export function sanitizeInput(str, maxLen = 200) {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>{}]/g, "")
    .replace(/[\x00-\x08\x0e-\x1f]/g, "")
    .slice(0, maxLen)
    .trim();
}

export function isSuspiciousRequest(url, body) {
  const suspicious = [
    /(\.\.|\/etc\/|\/proc\/|\/dev\/)/i,
    /(union\s+select|drop\s+table|;\s*delete|;\s*update)/i,
    /(<script|javascript:|onerror=)/i,
    /(eval\(|exec\(|system\()/i,
    /__proto__|constructor\[/i,
  ];
  const combined = url + (body || "");
  return suspicious.some(p => p.test(combined));
}
