#!/bin/bash

if command_exists op; then
    cz() {
        local env_files=(
            "$HOME/.sushichan044/op/chezmoi.env"
            "$HOME/.sushichan044/op/mise.env"
        )

        local args=()
        for f in "${env_files[@]}"; do
            args+=(--env-file="$f")
        done

        op run "${args[@]}" -- chezmoi "$@"
    }
else
    cz() {
        echo "⚠️ op is not available or env files are missing. Running chezmoi without op."
        chezmoi "$@"
    }
fi

update() {
    cz update
    cz apply
}
