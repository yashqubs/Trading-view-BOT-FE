#!/usr/bin/env bash
#
# Build the frontend and deploy it.
# Two supported targets (both free, no Vercel):
#   1. Nginx on the same EC2 instance (copy build to the served directory)
#   2. Cloudflare Pages (via wrangler)
#
# Usage:
#   ./deploy.sh nginx      # build + copy to Nginx web root on this server
#   ./deploy.sh cloudflare # build + publish to Cloudflare Pages

set -euo pipefail

TARGET="${1:-nginx}"
NGINX_ROOT="/var/www/trading-bot-portal"
CF_PROJECT="trading-bot-portal"

echo "[deploy] Building frontend..."
pnpm install --frozen-lockfile
pnpm build

if [ "${TARGET}" = "nginx" ]; then
  echo "[deploy] Deploying to Nginx web root: ${NGINX_ROOT}"
  sudo rm -rf "${NGINX_ROOT:?}/"*
  sudo cp -r dist/* "${NGINX_ROOT}/"
  sudo nginx -t && sudo systemctl reload nginx
  echo "[deploy] Done. Portal served by Nginx."

elif [ "${TARGET}" = "cloudflare" ]; then
  echo "[deploy] Publishing to Cloudflare Pages project: ${CF_PROJECT}"
  # Requires wrangler installed and authenticated (CLOUDFLARE_API_TOKEN in env)
  npx wrangler pages deploy dist --project-name "${CF_PROJECT}"
  echo "[deploy] Done. Portal published to Cloudflare Pages."

else
  echo "[deploy] Unknown target '${TARGET}'. Use 'nginx' or 'cloudflare'."
  exit 1
fi
