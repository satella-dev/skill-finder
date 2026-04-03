import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import pg from "pg";
import OpenAI from "openai";
import http from "http";

const PORT = 4100;
const pool = new pg.Pool({ connectionString: "postgresql://jwpark@127.0.0.1:6432/skill_registry", max: 10 });
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;

function hasKorean(t) { return /[\uac00-\ud7af]/.test(t); }
async function translate(t) {
  if (!openai) return t;
  try { const r = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "system", content: "Translate Korean to English. Keep tech terms. Output ONLY translation." }, { role: "user", content: t }], max_tokens: 100, temperature: 0 }); return r.choices[0].message.content.trim(); } catch { return t; }
}
async function embed(t) {
  if (!openai) return null;
  try { const r = await openai.embeddings.create({ model: "text-embedding-3-small", input: [t] }); return r.data[0].embedding; } catch { return null; }
}
function sanitize(s, max = 200) { return typeof s === "string" ? s.replace(/[<>{}]/g, "").replace(/[\x00-\x08\x0e-\x1f]/g, "").slice(0, max).trim() : ""; }

// Register tools on a McpServer instance
function registerTools(srv) {
  srv.tool("search_skills", "Fast keyword search with domain inference.",
    { query: z.string().max(200), limit: z.number().min(1).max(50).optional().default(10) },
    async ({ query, limit }) => {
      const q = sanitize(query); if (q.length < 2) return { content: [{ type: "text", text: "Query too short." }] };
      const c = await pool.connect();
      try { const r = await c.query("SELECT skill_name,skill_type,repo,grade,domain,ROUND(relevance::numeric,1) AS score FROM search_skills($1,$2)", [q, limit]); return { content: [{ type: "text", text: JSON.stringify(r.rows, null, 2) }] }; }
      finally { c.release(); }
    });

  srv.tool("hybrid_search", "Keyword + vector hybrid search. Most accurate. Korean supported.",
    { query: z.string().max(200), limit: z.number().min(1).max(50).optional().default(10) },
    async ({ query, limit }) => {
      const q = sanitize(query); if (q.length < 2) return { content: [{ type: "text", text: "Query too short." }] };
      let sq = q, tr = null;
      if (hasKorean(q)) { tr = await translate(q); sq = tr; }
      const emb = await embed(sq);
      if (!emb) return { content: [{ type: "text", text: "Embedding unavailable. Use search_skills." }] };
      const vec = "[" + emb.join(",") + "]";
      const c = await pool.connect();
      try { const r = await c.query("SELECT skill_name,skill_type,repo,grade,domain,skill_desc,ROUND(final_score::numeric,1) AS score FROM hybrid_search($1,$2::vector,$3)", [q, vec, limit]); const res = { results: r.rows }; if (tr) res.translated = tr; return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] }; }
      finally { c.release(); }
    });

  srv.tool("list_domains", "List all 13 skill domains with counts.", {},
    async () => { const c = await pool.connect(); try { const r = await c.query("SELECT d.code,d.label,COUNT(s.id) AS skill_count FROM domains d LEFT JOIN repos r ON r.domain=d.code LEFT JOIN skills s ON s.repo_id=r.id GROUP BY d.code,d.label ORDER BY skill_count DESC"); return { content: [{ type: "text", text: JSON.stringify(r.rows, null, 2) }] }; } finally { c.release(); } });

  srv.tool("get_alternatives", "Compare skill alternatives for a domain.",
    { domain: z.string().max(50) },
    async ({ domain }) => { const c = await pool.connect(); try { const r = await c.query("SELECT purpose,options,recommendation FROM alternatives WHERE domain=$1", [sanitize(domain, 50)]); return { content: [{ type: "text", text: r.rows.length ? JSON.stringify(r.rows[0], null, 2) : "Not found." }] }; } finally { c.release(); } });

  srv.tool("get_role_template", "Get recommended skills for an agent role.",
    { role: z.string().max(50) },
    async ({ role }) => { const c = await pool.connect(); try { const r = await c.query("SELECT role,domains,recommended_skills,description FROM role_templates WHERE role=$1", [sanitize(role, 50)]); return { content: [{ type: "text", text: r.rows.length ? JSON.stringify(r.rows[0], null, 2) : "Not found." }] }; } finally { c.release(); } });

  srv.tool("get_stats", "Registry statistics.", {},
    async () => { const c = await pool.connect(); try { const r = await c.query("SELECT (SELECT COUNT(*) FROM repos) AS repos,(SELECT COUNT(*) FROM skills) AS skills,(SELECT COUNT(*) FROM skills WHERE type='agent') AS agents"); return { content: [{ type: "text", text: JSON.stringify(r.rows[0], null, 2) }] }; } finally { c.release(); } });
}

// Each SSE connection gets its own McpServer instance
const sseTransports = {};

const httpServer = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const urlPath = (req.url || "").split("?")[0];

  if (urlPath === "/" || urlPath === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"status":"ok","service":"skill-registry-mcp"}');
    return;
  }

  // SSE — each connection gets its own server instance
  if (urlPath === "/sse" && req.method === "GET") {
    const srv = new McpServer({ name: "skill-registry", version: "1.0.0" });
    registerTools(srv);
    const transport = new SSEServerTransport("/messages", res);
    sseTransports[transport.sessionId] = { transport, srv };
    res.on("close", () => { delete sseTransports[transport.sessionId]; });
    await srv.connect(transport);
    return;
  }

  // SSE messages
  if (urlPath === "/messages" && req.method === "POST") {
    const sid = new URL(req.url, `http://localhost:${PORT}`).searchParams.get("sessionId");
    const session = sseTransports[sid];
    if (!session) { res.writeHead(404); res.end(); return; }
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => { try { await session.transport.handlePostMessage(req, res, body); } catch { res.writeHead(500); res.end(); } });
    return;
  }

  res.writeHead(404); res.end();
});

httpServer.timeout = 30000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Skill Registry MCP Server v1.0.0`);
  console.log(`   http://0.0.0.0:${PORT}`);
  console.log(`   GET  /sse      — SSE transport`);
  console.log(`   POST /messages — SSE messages`);
});
