#!/usr/bin/env bash
# One-command CDK deploy wrapper (STUB).
# Cloud deploy is intentionally DEFERRED for this prototype -- run locally with
# scripts/dev.sh instead. The handlers are already Lambda-ready plain functions;
# see infra/cdk/carbon_clarity_stack.py for the intended topology.
set -euo pipefail

echo "Cloud deploy is deferred for this prototype."
echo "Run the full app locally instead:"
echo ""
echo "    bash scripts/dev.sh"
echo ""
echo "To implement cloud deploy later: complete infra/cdk/, then"
echo "    cd infra/cdk && cdk bootstrap && cdk deploy"
exit 0
