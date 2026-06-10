#!/bin/bash
set -e

echo "=== Cloudflare Pages static mirror build ==="

# 1. Run the main build (Vercel adapter generates static output in dist/client/)
npm run build

# 2. Copy static output to Cloudflare output directory
echo "Preparing Cloudflare output..."
rm -rf dist-cloudflare
cp -r dist/client dist-cloudflare

# 3. Create Cloudflare Pages _redirects file
#    Rewrite all /ketsu/* requests internally to the notice page (200 = internal rewrite)
cat > dist-cloudflare/_redirects << 'EOF'
# Cloudflare Pages static mirror redirects
# All ketsu routes are served from the Vercel primary site only
/ketsu* /ketsu-notice 200
EOF

# 4. Rebuild pagefind index for Cloudflare output (excluding ketsu content)
echo "Building search index for Cloudflare..."
npx pagefind --site dist-cloudflare

echo "=== Cloudflare Pages build complete ==="
