import { z } from "zod";
import { pool } from "../db/pool.js";
import { sanitizeInput } from "../security/validator.js";

export function registerDomainTools(server) {
  server.tool("list_domains", "List all 13 skill domains.", {},
    async () => {
      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT d.code, d.label, COUNT(s.id) AS skill_count FROM domains d LEFT JOIN repos r ON r.domain = d.code LEFT JOIN skills s ON s.repo_id = r.id GROUP BY d.code, d.label ORDER BY skill_count DESC"
        );
        return { content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }] };
      } finally { client.release(); }
    }
  );

  server.tool("get_alternatives", "Get skill alternatives comparison.",
    { domain: z.string().max(50) },
    async ({ domain }) => {
      const d = sanitizeInput(domain, 50);
      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT purpose, options, recommendation FROM alternatives WHERE domain = $1",
          [d]
        );
        return { content: [{ type: "text", text: result.rows.length > 0 ? JSON.stringify(result.rows[0], null, 2) : "Not found." }] };
      } finally { client.release(); }
    }
  );

  server.tool("get_role_template", "Get recommended skills for an agent role.",
    { role: z.string().max(50) },
    async ({ role }) => {
      const r = sanitizeInput(role, 50);
      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT role, domains, recommended_skills, description FROM role_templates WHERE role = $1",
          [r]
        );
        return { content: [{ type: "text", text: result.rows.length > 0 ? JSON.stringify(result.rows[0], null, 2) : "Not found." }] };
      } finally { client.release(); }
    }
  );
}
