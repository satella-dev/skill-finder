import { pool } from "../db/pool.js";

export function registerStatsTools(server) {
  server.tool("get_stats", "Get registry statistics.", {},
    async () => {
      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT (SELECT COUNT(*) FROM repos) AS repos, (SELECT COUNT(*) FROM skills) AS skills, (SELECT COUNT(*) FROM skills WHERE type='agent') AS agents"
        );
        return { content: [{ type: "text", text: JSON.stringify(result.rows[0], null, 2) }] };
      } finally { client.release(); }
    }
  );
}
