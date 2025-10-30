#!/bin/sh
set -eu

if ! type mmcp >/dev/null 2>&1; then
    echo "mmcp is not available. Exiting..."
    exit 0
fi

mmcp apply
