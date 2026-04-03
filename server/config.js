export const PORT = 4100;
export const PG_URL = "postgresql://jwpark@127.0.0.1:6432/skill_registry";
export const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

// Allowed paths
export const ALLOWED_PATHS = new Set(["/health", "/sse", "/messages"]);

// Allowed MCP methods
export const ALLOWED_MCP_METHODS = new Set([
  "initialize", "initialized", "ping",
  "tools/list", "tools/call",
  "resources/list", "resources/read",
  "prompts/list", "prompts/get"
]);

// Rate limiting
export const RATE_LIMIT = 30;
export const RATE_WINDOW = 60_000;

// Auto-ban
export const BAN_THRESHOLD = 100;
export const BAN_DURATION = 10 * 60_000;

// Session limits
export const MAX_SESSIONS_PER_IP = 3;

// Request size limit: 10KB
export const MAX_BODY_SIZE = 10_240;

// Tool call argument size limit
export const MAX_ARG_SIZE = 1000;
