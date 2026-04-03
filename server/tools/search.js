import { z } from "zod";
import { pool } from "../db/pool.js";
import { sanitizeInput } from "../security/validator.js";
import { hasKorean, translateToEnglish, getEmbedding } from "../ai/embedding.js";

export function registerSearchTools(server) {
  server.tool("search_skills", "Search skills/agents by keyword.",
    { query: z.string().max(200), limit: z.number().min(1).max(50).optional().default(10) },
    async ({ query, limit }) => {
      const q = sanitizeInput(query);
      if (q.length < 2) return { content: [{ type: "text", text: "Query too short (min 2 chars)." }] };
      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT skill_name, skill_type, repo, grade, domain, ROUND(relevance::numeric, 1) AS score FROM search_skills($1, $2)",
          [q, limit]
        );
        return { content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }] };
      } finally { client.release(); }
    }
  );

  server.tool("hybrid_search", "Hybrid keyword+vector search. Most accurate.",
    { query: z.string().max(200), limit: z.number().min(1).max(50).optional().default(10) },
    async ({ query, limit }) => {
      const q = sanitizeInput(query);
      if (q.length < 2) return { content: [{ type: "text", text: "Query too short." }] };
      let searchQuery = q;
      let translated = null;
      if (hasKorean(q)) { translated = await translateToEnglish(q); searchQuery = translated; }
      const embedding = await getEmbedding(searchQuery);
      if (!embedding) return { content: [{ type: "text", text: "Embedding unavailable. Use search_skills." }] };
      const vecStr = "[" + embedding.join(",") + "]";
      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT skill_name, skill_type, repo, grade, domain, skill_desc, ROUND(final_score::numeric, 1) AS score FROM hybrid_search($1, $2::vector, $3)",
          [q, vecStr, limit]
        );
        const response = { results: result.rows };
        if (translated) response.translated = translated;
        return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
      } finally { client.release(); }
    }
  );
}
