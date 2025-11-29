#!/bin/sh
set -eu

if ! type sheldon >/dev/null 2>&1; then
    echo "❌ sheldon is not available. Exiting..."
    exit 1
fi

sheldon lock --update
