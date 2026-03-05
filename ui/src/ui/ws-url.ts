/**
 * Resolve WebSocket URL for the OpenClaw gateway when the UI is served behind a proxy
 * (e.g. dashboard at /openclaw/ with WS at /openclaw/ws).
 * Prefer build-time env VITE_OPENCLAW_WS_URL; fallback to same-origin /openclaw/ws.
 */
export function getOpenClawWsUrl(): string {
  const env =
    (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env) ||
    {};
  const url = typeof env.VITE_OPENCLAW_WS_URL === "string" ? env.VITE_OPENCLAW_WS_URL.trim() : "";
  if (url) {
    return url;
  }
  if (typeof location === "undefined") {
    return "ws://localhost:18789";
  }
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const host = location.host;
  return `${proto}://${host}/openclaw/ws`;
}
