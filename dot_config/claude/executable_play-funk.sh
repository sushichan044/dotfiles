#!/bin/sh

is_mac() {
    [ "$(uname)" = "Darwin" ]
}

if ! is_mac; then
    echo "This script is intended for macOS only."
    exit 0
fi

afplay /System/Library/Sounds/Funk.aiff
