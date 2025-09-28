#!/bin/bash

# if ! gh auth status --hostname github.com >/dev/null 2>&1; then
#     echo "⏩ running gh auth login..."
#     gh auth login
# fi

ensure_login_with_hostname() {
    local hostname="$1"

    if ! gh auth status --hostname "$hostname" >/dev/null 2>&1; then
        echo "⏩ running gh auth login for $hostname..."
        gh auth login --hostname "$hostname" -c -p ssh --skip-ssh-key --web
    fi
}

hosts=(
    "github.com"
)

for host in "${hosts[@]}"; do
    ensure_login_with_hostname "$host"
done
