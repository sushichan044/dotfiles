#!/bin/sh
set -eu

if ! type mise >/dev/null 2>&1; then
    echo "❌ mise is not available. Exiting..."
    exit 1
fi

mise up && mise prune
