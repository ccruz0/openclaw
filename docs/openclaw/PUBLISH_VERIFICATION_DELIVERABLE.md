# OpenClaw publish verification – deliverable

**Repository:** ccruz0/openclaw  
**Goal:** Publish production image for https://dashboard.hilovivo.com/openclaw  
**Date:** 2026-03-05

---

## 1. Files verified or modified

| File                                   | Status                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `.github/workflows/docker_publish.yml` | **Created** – workflow for push to main + workflow_dispatch, builds and pushes to `ghcr.io/ccruz0/openclaw:latest` |
| `Dockerfile`                           | **Verified** – builds real UI with base `/openclaw/`, no placeholder                                               |
| `ui/src/ui/ws-url.ts`                  | **Verified** – `getOpenClawWsUrl()` used; same-origin fallback in browser                                          |
| `ui/src/ui/storage.ts`                 | **Verified** – uses `getOpenClawWsUrl()` as default gateway URL                                                    |
| `ui/vite.config.ts`                    | **Verified** – base path from `OPENCLAW_CONTROL_UI_BASE_PATH` (set to `/openclaw/` in Dockerfile)                  |
| `.env.example`                         | **Verified** – includes `VITE_OPENCLAW_WS_URL=wss://dashboard.hilovivo.com/openclaw/ws` (commented)                |

---

## 2. GHCR workflow

- **Workflow:** `.github/workflows/docker_publish.yml`
- **Triggers:** `push` to `main`, `workflow_dispatch`
- **Actions:** Checkout → Docker Buildx → Login to GHCR → Build and push
- **Image:** `ghcr.io/ccruz0/openclaw:latest`
- **Cache:** GitHub Actions cache (type=gha)

---

## 3. Dockerfile summary

- **Base:** `node:22-bookworm`
- **Build:** `pnpm install` → `pnpm build` → `OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/` → `pnpm ui:build`
- **Runtime:** `node openclaw.mjs gateway --allow-unconfigured`
- **No placeholder HTML** – real Vite UI built and served by gateway
- **Default gateway port:** 18789 (see note in deployment section)

---

## 4. WebSocket configuration

- **Control UI** uses `getOpenClawWsUrl()` in `ui/src/ui/ws-url.ts`:
  - Prefers `VITE_OPENCLAW_WS_URL` (build-time)
  - In browser: same-origin fallback `${protocol}://${host}/openclaw/ws`
  - `ws://localhost:18789` is only used when `location` is undefined (Node/SSR), not in production browser
- **No hardcoded `ws://localhost` or `localhost:8081`** in the Control UI code path used in production
- Other `new WebSocket(...)` / `127.0.0.1` usages are in tests, server-side gateway, or other features (canvas, extensions), not the dashboard-served UI

**Confirmation:** WebSocket for the UI no longer relies on localhost in production; it uses env or same-origin `/openclaw/ws`.

---

## 5. Base path

- Vite base is set via **env** `OPENCLAW_CONTROL_UI_BASE_PATH`.
- Dockerfile sets `ENV OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/` before `pnpm ui:build`.
- Result: UI is built with `base: "/openclaw/"` and works under `/openclaw`.

---

## 6. Build and publish commands

```bash
cd ~/openclaw
git add .
git commit -m "release: openclaw production image"
git push origin main
```

Pushing to `main` triggers `.github/workflows/docker_publish.yml`. After the workflow completes, `ghcr.io/ccruz0/openclaw:latest` will be updated.

---

## 7. Deployment on LAB

Gateway in the image listens on **18789** by default. If your LAB proxy expects the app on host port **8081**, map host 8081 to container 18789:

```bash
docker pull ghcr.io/ccruz0/openclaw:latest
docker stop openclaw || true
docker rm openclaw || true
docker run -d --restart unless-stopped -p 8081:18789 --name openclaw ghcr.io/ccruz0/openclaw:latest
```

If you use a different port mapping (e.g. `-p 8081:8081`), ensure the gateway inside the container is started with that port (e.g. via env or command override).

---

## 8. Browser verification checklist

After redeploying on LAB and opening https://dashboard.hilovivo.com/openclaw/ :

- [ ] Page loads (no blank/placeholder).
- [ ] No console errors about WebSocket to `localhost` or `8081`.
- [ ] Network tab: WebSocket request to `wss://dashboard.hilovivo.com/openclaw/ws` (or same-origin).
- [ ] UI assets loaded from `/openclaw/` path (e.g. `/openclaw/assets/...`).

---

## Optional: check which image is running on LAB

From your machine (with AWS CLI and SSM access to LAB):

```bash
# Replace INSTANCE_ID with your LAB instance ID (e.g. i-0d82c172235770a0d)
aws ssm send-command \
  --instance-ids INSTANCE_ID \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["docker inspect openclaw --format \"{{.Config.Image}} {{.Created}}\""]' \
  --region ap-southeast-1 \
  --query 'Command.CommandId' --output text
# Then get output:
# aws ssm get-command-invocation --command-id <COMMAND_ID> --instance-id INSTANCE_ID --region ap-southeast-1
```

Or in one shot (run on LAB):

```bash
docker inspect openclaw --format '{{.Config.Image}} {{.Created}}'
```

You should see `ghcr.io/ccruz0/openclaw:latest` and a recent creation time after redeploy.
