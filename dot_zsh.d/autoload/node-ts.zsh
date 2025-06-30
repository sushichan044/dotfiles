#!/bin/zsh

# execute typescript with node.js
nts() {
    if ! command_exists node; then
        echo "node is not installed"
        return 1
    fi

    if ! command_exists npx; then
        echo "npx is not available"
        return 1
    fi

    if [ -z "$1" ]; then
        echo "Usage: nts <file.ts>"
        return 1
    fi

    if npx -y semver@latest -r ">=23.6.0 <24 || >=24.3.0" "$(node -v)"; then
        node --experimental-transform-types "$1"
    elif npx -y semver@latest -r ">=22.7.0 <23.6.0" "$(node -v)"; then
        node --experimental-transform-types --experimental-strip-types "$1"
    else
        echo "Node.js version does not support typescript execution."
        return 1
    fi
}
