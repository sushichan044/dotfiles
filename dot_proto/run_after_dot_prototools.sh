#!/bin/sh
set -eu

if ! type proto >/dev/null 2>&1; then
    echo "❌ proto is not available. Exiting..."
    exit 1
fi

# proto upgrade
