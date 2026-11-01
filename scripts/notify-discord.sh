#!/usr/bin/env bash
# Posts a deployment notification to a Discord webhook.
# All inputs come from environment variables so commit messages can never
# be interpreted as shell code. Skips cleanly when no webhook is configured.
set -euo pipefail

if [ -z "${DISCORD_WEBHOOK_URL:-}" ]; then
  echo "DISCORD_WEBHOOK_URL is not set; skipping deployment notification."
  exit 0
fi

command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }

first_line=$(printf '%s' "${COMMIT_MESSAGE:-}" | head -n 1 | cut -c1-200)
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

payload=$(jq -n \
  --arg project "${PROJECT_NAME:-production-upgrade}" \
  --arg commit "${first_line:-n/a}" \
  --arg sha "${COMMIT_SHA:-n/a}" \
  --arg author "${COMMIT_AUTHOR:-n/a}" \
  --arg url "${DEPLOYMENT_URL:-not configured}" \
  --arg run "${RUN_URL:-n/a}" \
  --arg ts "$timestamp" \
  '{
    username: "Deploy Bot",
    embeds: [{
      title: ("Deployed: " + $project),
      url: $run,
      color: 3066993,
      fields: [
        { name: "Commit", value: $commit },
        { name: "SHA", value: ($sha[0:7]), inline: true },
        { name: "Author", value: $author, inline: true },
        { name: "Deployment URL", value: $url },
        { name: "Pipeline run", value: $run }
      ],
      timestamp: $ts
    }]
  }')

curl -fsS -X POST -H 'Content-Type: application/json' -d "$payload" "$DISCORD_WEBHOOK_URL"
echo "Deployment notification sent."
