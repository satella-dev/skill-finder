import { ALLOWED_PATHS } from "../config.js";
import { isBanned, checkRateLimit, banIP } from "./rate-limiter.js";
import { isSuspiciousRequest } from "./validator.js";

export function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

export function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
}

export function handleCORS(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.writeHead(204); res.end();
    return true;
  }
  return false;
}

export function checkAccess(req, res, ip) {
  if (isBanned(ip)) { req.destroy(); return false; }

  const urlPath = (req.url || "").split("?")[0];

  if (urlPath === "/health" || urlPath === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"status":"ok"}');
    return false;
  }

  const basePath = "/" + urlPath.split("/")[1];
  if (!ALLOWED_PATHS.has(basePath)) { req.destroy(); return false; }

  if (!checkRateLimit(ip)) { res.writeHead(429); res.end(); return false; }

  if (isSuspiciousRequest(req.url, "")) {
    banIP(ip, `suspicious request pattern - ${req.url}`);
    req.destroy();
    return false;
  }

  return true;
}
