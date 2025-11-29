#!/bin/sh

LAST_MESSAGE=$(echo "$1" | jq -r '.["last-assistant-message"] // "Codex task completed"')

terminal-notifier -sound Funk -title "OpenAI Codex" -message "$LAST_MESSAGE"
