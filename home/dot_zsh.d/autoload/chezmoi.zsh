#!/bin/bash

update() {
    local env_files=(
        "$HOME/.sushichan044/op/chezmoi.env"
        "$HOME/.sushichan044/op/mise.env"
    )

    local args=()
    for f in "${env_files[@]}"; do
        args+=(--env-file="$f")
    done

    op run "${args[@]}" -- chezmoi update
}
