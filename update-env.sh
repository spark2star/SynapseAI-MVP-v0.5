#!/bin/bash
# Update .env.prod with your domain

echo "🔧 Updating .env.prod with your domain..."

# Update ALLOWED_ORIGINS with your domain
sed -i.bak 's|ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com|ALLOWED_ORIGINS=https://synapseai.health,https://www.synapseai.health|g' .env.prod

echo "✅ Updated ALLOWED_ORIGINS to use synapseai.health"

echo ""
echo "🔍 STILL NEED YOUR GCP PROJECT ID:"
echo "   1. Go to https://console.cloud.google.com"  
echo "   2. Look at the top of the page - you'll see your Project ID"
echo "   3. It looks like: 'synapseai-123456' or 'my-project-123456'"
echo "   4. Replace 'your-gcp-project-id' in .env.prod with that value"
echo ""
echo "📋 Current .env.prod after domain update:"
cat .env.prod
