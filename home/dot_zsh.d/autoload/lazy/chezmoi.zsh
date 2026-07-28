#!/bin/bash

update() {
    local github_access_token
    local -a env_vars=()

    if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
        github_access_token="$(gh auth token)"
        if [[ -n "$github_access_token" ]]; then
            env_vars+=("CHEZMOI_GITHUB_ACCESS_TOKEN=$github_access_token")
        fi
    fi

    env "${env_vars[@]}" chezmoi update
}
