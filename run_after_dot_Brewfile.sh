#!/bin/sh
set -eu

if ! type brew >/dev/null 2>&1; then
    echo "brew is not available. Exiting..."
    exit 1
fi

brew bundle --file="$HOME/.Brewfile" cleanup --force

brew update && brew bundle install --file="$HOME/.Brewfile"
