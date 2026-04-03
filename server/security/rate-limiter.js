import { RATE_LIMIT, RATE_WINDOW, BAN_THRESHOLD, BAN_DURATION } from "../config.js";

export const rateLimits = new Map();
export const bannedIPs = new Map();

export function isBanned(ip) {
  const ban = bannedIPs.get(ip);
  if (!ban) return false;
  if (Date.now() > ban.until) { bannedIPs.delete(ip); return false; }
  return true;
}

export function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW, total: 0 };
    rateLimits.set(ip, entry);
  }
  entry.count++;
  entry.total++;

  if (entry.count > BAN_THRESHOLD) {
    bannedIPs.set(ip, { until: now + BAN_DURATION, reason: "excessive requests" });
    console.log(`🚫 BANNED ${ip}: ${entry.count} requests in window`);
    return false;
  }

  return entry.count <= RATE_LIMIT;
}

export function banIP(ip, reason) {
  bannedIPs.set(ip, { until: Date.now() + BAN_DURATION, reason });
  console.log(`🚫 BANNED ${ip}: ${reason}`);
}

// Periodic cleanup (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimits) {
    if (now > entry.resetAt + RATE_WINDOW) rateLimits.delete(ip);
  }
  for (const [ip, ban] of bannedIPs) {
    if (now > ban.until) bannedIPs.delete(ip);
  }
}, 5 * 60_000);
