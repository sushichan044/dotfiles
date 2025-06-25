#!/bin/sh
if type "rustup" >/dev/null 2>&1; then
    rustup update
    echo "✅ Rust toolchain updated successfully."
else
    echo "❌ Command 'rustup' not found. Exiting..."
    exit 1
fi
