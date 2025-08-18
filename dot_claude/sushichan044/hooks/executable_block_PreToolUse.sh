#!/bin/sh

cd "$(dirname "$0")" || exit

reason="$1"

jq -n --arg decision "block" --arg reason "$reason" '{decision: $decision, reason: $reason}'
