autoload bashcompinit && bashcompinit
autoload -Uz compinit && compinit

COMPLETION_HOME="$HOME/.zsh.d/completions"

fpath=("$COMPLETION_HOME" "$(brew --prefix)/share/zsh/site-functions" "${fpath[@]}")

# 1Password CLI
if command_exists op; then
    eval "$(op completion zsh)"
    compdef _op op
fi

# AWS
complete -C "$(mise which aws_completer)" aws

# uv
eval "$("$(mise which uv)" generate-shell-completion zsh)"
eval "$("$(mise which uvx)" --generate-shell-completion zsh)"

# task
if command_exists task; then
    eval "$(task --completion zsh)"
fi
