#!/bin/sh
if type op >/dev/null 2>&1; then
    eval "$(op signin)"
fi

#!/bin/sh
case "$(uname -s)" in
Darwin)
    if type "$HOME/.dotfiles/.bin/op" >/dev/null 2>&1; then
        eval "$("$HOME"/.dotfiles/.bin/op signin)"
    fi
    ;;
Linux)
    if type op >/dev/null 2>&1; then
        eval "$(op signin)"
    fi
    ;;
*)
    echo "unsupported OS"
    exit 1
    ;;
esac
