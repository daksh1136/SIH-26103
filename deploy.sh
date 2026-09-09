#!/bin/bash
set -e

echo "=== 1. Setting up Node.js environment ==="
export PATH="/Users/raj/.nvm/versions/node/v20.20.2/bin:$PATH"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "=== 2. Building frontend bundle ==="
cd /Users/raj/Desktop/SIH-26103/frontend
npm run build

echo "=== 3. Syncing git repository ==="
cd /Users/raj/Desktop/SIH-26103
git add .
git commit -m "fix(predictor): fix white screen on upload and trigger Vercel deploy" || true
git push origin main || true

echo "=== 4. Deploying directly to Vercel Production ==="
npx vercel --prod --yes

echo "=== Deployment Completed Successfully! ==="
