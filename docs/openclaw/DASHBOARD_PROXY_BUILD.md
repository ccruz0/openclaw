# OpenClaw image for dashboard proxy (/openclaw/)

Build and push the image used when serving the Control UI behind a dashboard at `/openclaw/` with WebSocket at `/openclaw/ws`.

## Build and push

```bash
docker build -t ghcr.io/ccruz0/openclaw:latest .
docker push ghcr.io/ccruz0/openclaw:latest
```

## Env (optional)

- **Build time:** `OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/` (set in Dockerfile for UI build).
- **Build time (override WS URL):** `VITE_OPENCLAW_WS_URL=wss://dashboard.hilovivo.com/openclaw/ws` — default is same-origin `/openclaw/ws`.

## Verification (browser)

After redeploying the LAB container with this image and opening https://dashboard.hilovivo.com/openclaw/:

- UI is the real Control UI (no "Placeholder").
- Console has no `ws://localhost:8081`.
- Network → WS: connection to `.../openclaw/ws` with status 101.
