typeset -gU path PATH

autoload -Uz colors
colors

setopt ignoreeof
setopt extended_glob

setopt auto_cd
setopt auto_pushd
setopt pushd_ignore_dups

setopt no_beep
setopt globdots
setopt interactive_comments

setopt share_history
setopt hist_ignore_all_dups
setopt hist_ignore_space
setopt hist_reduce_blanks

HISTFILE=$HOME/.zsh_history
HISTSIZE=2000
SAVEHIST=2000

# '/' を単語の境界として認める
# https://blog.3qe.us/entry/2025/05/20/201219
typeset -g WORDCHARS=${WORDCHARS:s@/@}

command_exists() {
    type "$1" >/dev/null 2>&1
}

dir_exists() {
    [ -d "$1" ]
}

file_exists() {
    [ -f "$1" ]
}

is_readable() {
    [ -r "$1" ]
}

is_writable() {
    [ -w "$1" ]
}

is_executable() {
    [ -x "$1" ]
}

is_empty_string() {
    [ -z "$1" ]
}

is_mac() {
    [ "$(uname)" = 'Darwin' ]
}

is_linux() {
    [ "$(uname)" = 'Linux' ]
}

add_to_path_if_not_exists() {
    local dir="$1"
    if ! dir_exists "$dir"; then
        return
    fi

    case ":$PATH:" in
    *":$dir:"*) ;;
    *) export PATH="$dir:$PATH" ;;
    esac
}

add_to_manpath_if_not_exists() {
    local dir="$1"
    if ! dir_exists "$dir"; then
        return
    fi

    case ":$MANPATH:" in
    *":$dir:"*) ;;
    *) export MANPATH="$dir:$MANPATH" ;;
    esac
}

source_if_exists() {
    file_exists "$1" && source "$1"
}

# Load files from a directory with .zsh extension recursively
load_zsh_files_from_dir() {
    local dir="$1"

    if dir_exists "$dir" && is_readable "$dir" && is_executable "$dir"; then
        # Use find to recursively search for .zsh files
        while IFS= read -r -d '' file; do
            # shellcheck disable=SC1090
            is_readable "$file" && source "$file"
        done < <(find "$dir" -name "*.zsh" -type f -print0 2>/dev/null | sort -z)
    fi
}

cached_eval() {
  mkdir -p "$XDG_CACHE_HOME/zsh"
  local cache="$XDG_CACHE_HOME/zsh/$(echo $1 | tr ' ' '_').zsh"
  if [[ ! -s "$cache" ]]; then
    eval $1 > $cache
  fi
  source "$cache"
}

# This function requires bash or zsh
copy-to-clipboard() {
    if test "$#" = 0; then
        payload=$(cat -)
    else
        payload=$(echo -n "$1")
    fi

    b64_payload=$(printf "%s" "$payload" | base64 -w0)

    # OSC52
    printf "\e]52;c;%s\a" "$b64_payload"
}

# Get RAM size in GB.
# $ get_ram_in_gb
# 64
get_ram_in_gb() {
    if is_mac; then
        sysctl -n hw.memsize | awk '{print int($1 / 1024 / 1024 / 1024)}'
    elif is_linux; then
        echo $(($(grep MemTotal /proc/meminfo | awk '{print $2}') / 1024 / 1024))
    else
        echo "Unsupported OS" 1>&2
        return 1
    fi
}
