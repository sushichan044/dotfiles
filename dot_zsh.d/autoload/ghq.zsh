function peco-ghq() {
    if ! type ghq >/dev/null 2>&1; then
        echo "ghq is not installed"
        return 1
    fi
    if ! type peco >/dev/null 2>&1; then
        echo "peco is not installed"
        return 1
    fi

    local selected_dir=$(ghq list -p | peco --prompt="repositories >" --query "$LBUFFER")
    if [ -n "$selected_dir" ]; then
        BUFFER="cd ${selected_dir} && git fetch --all --prune"
        zle accept-line
    fi
    zle clear-screen
}
zle -N peco-ghq
bindkey '^]' peco-ghq
