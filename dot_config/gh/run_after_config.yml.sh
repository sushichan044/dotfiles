#!/bin/sh

if ! type gh >/dev/null 2>&1; then
    echo "❌ gh is not available. Exiting..."
    exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
    echo "❌ gh is not authenticated. Exiting..."
    exit 1
fi

gh extension upgrade --all
