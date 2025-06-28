#!/bin/sh
set -euo

if [ ! -d "$HOME/.external/github.com/NomenAK/SuperClaude" ]; then
    echo "⚠️ SuperClaude not found, please run 'chezmoi update' first."
    exit 1
fi

if [ -z "${XDG_CONFIG_HOME:-}" ]; then
    echo "⚠️ XDG_CONFIG_HOME not set, please set it to your config directory."
    exit 1
fi

cd "$HOME/.external/github.com/NomenAK/SuperClaude" || exit 1

./install.sh --dir "$XDG_CONFIG_HOME/superclaude" --force --update

echo "✅ SuperClaude installed successfully."
