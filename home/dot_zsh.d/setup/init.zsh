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

is_shell_for_ai_agent() {
    # check if shell is for AI agent
    [[ -n "$CURSOR_TRACE_ID" ]]
}

mkdir_for_file() {
    local file_path="$1"
    local dir_path
    dir_path=$(dirname "$file_path")

    if ! dir_exists "$dir_path"; then
        mkdir -p "$dir_path" || {
            echo "Failed to create directory: $dir_path"
            return 1
        }
    fi
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
