#!/bin/bash
# Run this ONCE after migrating to Railway to replace the vercel.json cron job.
# It creates a QStash schedule that hits your cron endpoint every 5 minutes.
# The CRON_SECRET is sent as a bearer token header so the endpoint auth still works.
#
# Usage: QSTASH_TOKEN=your_token CRON_SECRET=your_secret BASE_URL=https://vibeblogger.io ./scripts/setup-qstash-cron.sh

if [ -z "$QSTASH_TOKEN" ] || [ -z "$CRON_SECRET" ] || [ -z "$BASE_URL" ]; then
  echo "Error: QSTASH_TOKEN, CRON_SECRET, and BASE_URL must be set"
  echo "Usage: QSTASH_TOKEN=your_token CRON_SECRET=your_secret BASE_URL=https://vibeblogger.io ./scripts/setup-qstash-cron.sh"
  exit 1
fi

echo "Creating QStash schedule: GET $BASE_URL/api/cron/process-scheduled-topics every 5 minutes..."

curl -s -X POST "https://qstash.upstash.io/v2/schedules" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"destination\": \"$BASE_URL/api/cron/process-scheduled-topics\",
    \"cron\": \"*/5 * * * *\",
    \"method\": \"GET\",
    \"headers\": {
      \"authorization\": \"Bearer $CRON_SECRET\"
    }
  }" | python3 -m json.tool

echo ""
echo "Done! Verify at https://console.upstash.com/qstash"
