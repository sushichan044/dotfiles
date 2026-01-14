#!/bin/sh
set -eu

if ! type ya >/dev/null 2>&1; then
    echo "⚠️ ya is not available. Exiting..."
    exit 0
fi

ya pkg install
