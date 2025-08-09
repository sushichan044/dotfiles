#!/bin/sh

if type claude >/dev/null 2>&1; then
    exit 0
fi

echo "⏩ Installing Claude Code..."

if ! type curl >/dev/null 2>&1; then
    echo "⚠️ curl is not installed. Exiting..."
    exit 1
fi

curl -fsSL https://claude.ai/install.sh | bash
