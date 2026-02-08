#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# CLOUDFLARE DNS AUTO-INJECTION SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
#
# Field Nine Solutions - Phase 27: Autonomous Ascension
#
# Usage:
#   1. Export your Cloudflare credentials:
#      export CF_API_TOKEN="your_api_token"
#      export CF_ZONE_ID="your_zone_id"
#
#   2. Run this script:
#      ./scripts/dns-cloudflare-inject.sh
#
# Prerequisites:
#   - Cloudflare API Token with DNS edit permissions
#   - Zone ID for fieldnine.io domain
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  FIELD NINE - CLOUDFLARE DNS INJECTION${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"

# Check for required environment variables
if [ -z "$CF_API_TOKEN" ]; then
    echo -e "${RED}ERROR: CF_API_TOKEN not set${NC}"
    echo ""
    echo "To get your API Token:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Create Token > Edit zone DNS template"
    echo "3. Select 'fieldnine.io' zone"
    echo "4. Export: export CF_API_TOKEN='your_token'"
    exit 1
fi

if [ -z "$CF_ZONE_ID" ]; then
    echo -e "${RED}ERROR: CF_ZONE_ID not set${NC}"
    echo ""
    echo "To get your Zone ID:"
    echo "1. Go to https://dash.cloudflare.com"
    echo "2. Select fieldnine.io domain"
    echo "3. Scroll down, Zone ID is on the right sidebar"
    echo "4. Export: export CF_ZONE_ID='your_zone_id'"
    exit 1
fi

# API Base URL
CF_API="https://api.cloudflare.com/client/v4"

# DNS Records to create
declare -A DNS_RECORDS
DNS_RECORDS["m"]="cname.vercel-dns.com"
DNS_RECORDS["nexus"]="cname.vercel-dns.com"

# Function to create DNS record
create_dns_record() {
    local name=$1
    local content=$2

    echo -e "${YELLOW}Creating CNAME record: ${name}.fieldnine.io -> ${content}${NC}"

    response=$(curl -s -X POST "${CF_API}/zones/${CF_ZONE_ID}/dns_records" \
        -H "Authorization: Bearer ${CF_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "{
            \"type\": \"CNAME\",
            \"name\": \"${name}\",
            \"content\": \"${content}\",
            \"ttl\": 1,
            \"proxied\": true
        }")

    success=$(echo $response | grep -o '"success":true' || true)

    if [ -n "$success" ]; then
        echo -e "${GREEN}  ✅ SUCCESS: ${name}.fieldnine.io created${NC}"
        return 0
    else
        error=$(echo $response | grep -o '"message":"[^"]*"' | head -1)
        if echo "$response" | grep -q "already exists"; then
            echo -e "${YELLOW}  ⚠️  SKIPPED: ${name}.fieldnine.io already exists${NC}"
            return 0
        else
            echo -e "${RED}  ❌ FAILED: ${error}${NC}"
            return 1
        fi
    fi
}

# Main execution
echo ""
echo -e "${CYAN}Creating DNS records for Vercel...${NC}"
echo ""

for name in "${!DNS_RECORDS[@]}"; do
    create_dns_record "$name" "${DNS_RECORDS[$name]}"
done

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}DNS injection complete!${NC}"
echo ""
echo "Records should propagate within 1-5 minutes."
echo "Verify with: nslookup m.fieldnine.io 1.1.1.1"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
