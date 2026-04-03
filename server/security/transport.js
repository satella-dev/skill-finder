import { ALLOWED_MCP_METHODS, MAX_BODY_SIZE, MAX_ARG_SIZE, MAX_SESSIONS_PER_IP, PORT } from "../config.js";

export function handleSSE(req, res, ip, urlPath, sessionsByIP, transports, server, SSEServerTransport) {
  if (urlPath !== "/sse" || req.method !== "GET") return false;

  const ipSessions = sessionsByIP.get(ip) || 0;
  if (ipSessions >= MAX_SESSIONS_PER_IP) { res.writeHead(429); res.end(); return true; }
  sessionsByIP.set(ip, ipSessions + 1);

  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = { transport, ip };
  res.on("close", () => {
    delete transports[transport.sessionId];
    const cur = sessionsByIP.get(ip) || 1;
    if (cur <= 1) sessionsByIP.delete(ip);
    else sessionsByIP.set(ip, cur - 1);
  });
  server.connect(transport);
  return true;
}

export function handleMessages(req, res, ip, urlPath, transports) {
  if (urlPath !== "/messages" || req.method !== "POST") return false;

  const sessionId = new URL(req.url, `http://localhost:${PORT}`).searchParams.get("sessionId");
  const session = transports[sessionId];
  if (!session) { res.writeHead(404); res.end(); return true; }

  let body = "";
  let exceeded = false;
  req.on("data", chunk => {
    body += chunk;
    if (body.length > MAX_BODY_SIZE) { exceeded = true; req.destroy(); }
  });
  req.on("end", async () => {
    if (exceeded) return;
    try {
      const msg = JSON.parse(body);
      if (msg.method && !ALLOWED_MCP_METHODS.has(msg.method)) {
        console.log(`⚠️ Blocked method from ${ip}: ${msg.method}`);
        res.writeHead(403); res.end(); return;
      }
      if (msg.params?.arguments) {
        const argStr = JSON.stringify(msg.params.arguments);
        if (argStr.length > MAX_ARG_SIZE) { res.writeHead(413); res.end(); return; }
      }
      await session.transport.handlePostMessage(req, res, body);
    } catch {
      res.writeHead(400); res.end();
    }
  });
  return true;
}
