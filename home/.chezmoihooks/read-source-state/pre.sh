#!/bin/sh

### Check execution environment
if [ "${CHEZMOI:-0}" -ne 1 ]; then
    echo "❌ This script should only be run by chezmoi."
    exit 1
fi

### Check OS
is_macos() {
    [ "$(uname -s)" = "Darwin" ]
}

is_linux() {
    [ "$(uname -s)" = "Linux" ]
}

if ! is_macos && ! is_linux; then
    echo "❌ sushichan044/dotfiles only supports macOS and Linux."
    exit 1
fi

# exit immediately if password-manager-binary is already in $PATH
type op >/dev/null 2>&1 && exit

CHEZMOI_BIN_DIR="$HOME/.chezmoi-bin"
mkdir -p "$CHEZMOI_BIN_DIR"

if is_macos; then
    # commands to install password-manager-binary on Darwin
    mkdir -p ~/.dotfiles/.tmp
    curl -L https://cache.agilebits.com/dist/1P/op2/pkg/v2.32.0/op_darwin_arm64_v2.32.0.zip -o ~/.dotfiles/.tmp/op.zip
    unzip ~/.dotfiles/.tmp/op.zip -d ~/.dotfiles/.tmp
    mv ~/.dotfiles/.tmp/op "$CHEZMOI_BIN_DIR"
    # shellcheck disable=SC1091
    export PATH="$CHEZMOI_BIN_DIR:$PATH"
elif is_linux; then
    # commands to install password-manager-binary on Linux
    curl -sS https://downloads.1password.com/linux/keys/1password.asc |
        sudo gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/$(dpkg --print-architecture) stable main" |
        sudo tee /etc/apt/sources.list.d/1password.list
    sudo mkdir -p /etc/debsig/policies/AC2D62742012EA22/
    curl -sS https://downloads.1password.com/linux/debian/debsig/1password.pol |
        sudo tee /etc/debsig/policies/AC2D62742012EA22/1password.pol
    sudo mkdir -p /usr/share/debsig/keyrings/AC2D62742012EA22
    curl -sS https://downloads.1password.com/linux/keys/1password.asc |
        sudo gpg --dearmor --output /usr/share/debsig/keyrings/AC2D62742012EA22/debsig.gpg
    sudo apt update && sudo apt install 1password-cli
fi
