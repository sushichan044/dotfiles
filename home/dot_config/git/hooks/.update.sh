#!/bin/bash
set -eu
cd "$(dirname "$0")" || exit 1

if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew is not installed. Please install Homebrew to use this script."
    exit 0
fi

hooks_dir="$(brew --prefix git)/share/git-core/templates/hooks"

find "$hooks_dir" -mindepth 1 -maxdepth 1 -type f -name '*.sample' -print0 |
    while IFS= read -r -d '' path; do
        hook="${path##*/}"
        hook="${hook%.sample}"
        target="executable_${hook}"

        # すでにファイルが存在する場合はスキップ
        [ -e "$target" ] && continue

        cp .template.sh "$target"
    done
