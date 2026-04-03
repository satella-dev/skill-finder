import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import http from "http";
import { PORT } from "./config.js";
import { getClientIP, applySecurityHeaders, handleCORS, checkAccess } from "./security/middleware.js";
import { handleSSE, handleMessages } from "./security/transport.js";
import { registerSearchTools } from "./tools/search.js";
import { registerDomainTools } from "./tools/domains.js";
import { registerStatsTools } from "./tools/stats.js";

const server = new McpServer({ name: "skill-registry", version: "1.0.0" });
registerSearchTools(server);
registerDomainTools(server);
registerStatsTools(server);

const transports = {};
const sessionsByIP = new Map();

const httpServer = http.createServer(async (req, res) => {
  const ip = getClientIP(req);
  if (handleCORS(req, res)) return;
  applySecurityHeaders(res);
  if (!checkAccess(req, res, ip)) return;
  const urlPath = (req.url || "").split("?")[0];
  if (handleSSE(req, res, ip, urlPath, sessionsByIP, transports, server, SSEServerTransport)) return;
  if (handleMessages(req, res, ip, urlPath, transports)) return;
  req.destroy();
});

httpServer.timeout = 30_000;
httpServer.keepAliveTimeout = 5_000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Skill Registry MCP Server v1.0.0 (hardened)`);
  console.log(`   http://0.0.0.0:${PORT}`);
});
