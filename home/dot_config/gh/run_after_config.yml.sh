#!/bin/sh

if ! type gh >/dev/null 2>&1; then
    echo "⚠️ gh is not available. Exiting..."
    exit 0
fi

if ! gh auth status >/dev/null 2>&1; then
    echo "⚠️ gh is not authenticated. Exiting..."
    exit 0
fi

gh extension upgrade --all
