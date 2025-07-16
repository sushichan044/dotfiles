#!/bin/sh
set -euo

if ! type SuperClaude >/dev/null 2>&1; then
    echo "⚠️ SuperClaude is not installed. Exiting..."
    exit 0
fi

SuperClaude install \
    --profile developer \
    --install-dir "$XDG_CONFIG_HOME/superclaude" \
    --components core commands \
    --force --yes

echo "✅ SuperClaude installed successfully."
