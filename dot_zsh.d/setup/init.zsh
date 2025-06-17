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
    if [[ ":$PATH:" != *":$dir:"* ]]; then
        export PATH="$PATH:$dir"
    fi
}

source_if_exists() {
    file_exists "$1" && source "$1"
}

# Load files from a directory with .zsh extension
load_zsh_files_from_dir() {
    local dir="$1"

    if dir_exists "$dir" && is_readable "$dir" && is_executable "$dir"; then
        for i in "$dir"/*; do
            # shellcheck disable=SC1090
            [[ ${i##*/} = *.zsh ]] && { [ -f "$i" ] || [ -h "$i" ]; } && is_readable "$i" && source "$i"
        done
    fi
}

is_shell_for_ai_agent() {
    # check if shell is for AI agent
    [[ -n "$CURSOR_TRACE_ID" ]]
}
