#!/usr/bin/env bash
# Day-1 Bedrock access verification.
# Confirms the chosen Claude model is invokable in the demo region.
# Safe: a single tiny invoke. Falls back to us-east-1 if Singapore is denied.
set -uo pipefail

MODEL="${BEDROCK_MODEL_ID:-anthropic.claude-sonnet-4-6}"
REGION="${BEDROCK_REGION:-ap-southeast-1}"

echo "==> Checking Bedrock access"
echo "    model : ${MODEL}"
echo "    region: ${REGION}"

if ! command -v aws >/dev/null 2>&1; then
  echo "    aws CLI not found -- skip. App still runs offline (grounded narrative)."
  exit 0
fi

aws sts get-caller-identity >/dev/null 2>&1 || {
  echo "    No AWS credentials. App runs fully offline -- USE_BEDROCK stays 0."
  exit 0
}

BODY='{"anthropic_version":"bedrock-2023-05-31","max_tokens":16,"messages":[{"role":"user","content":"ping"}]}'

try() {
  local region="$1"
  aws bedrock-runtime invoke-model \
    --region "$region" \
    --model-id "$MODEL" \
    --content-type application/json \
    --accept application/json \
    --body "$(printf '%s' "$BODY" | base64)" \
    /tmp/cc_bedrock_out.json >/dev/null 2>&1
}

if try "$REGION"; then
  echo "    OK: ${MODEL} invokable in ${REGION}. Set USE_BEDROCK=1 to stream from Bedrock."
elif try "us-east-1"; then
  echo "    ${REGION} denied; OK in us-east-1. Run with BEDROCK_REGION=us-east-1 USE_BEDROCK=1."
else
  echo "    Bedrock model access not available. App runs offline with grounded narrative."
fi
