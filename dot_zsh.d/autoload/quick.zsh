#!/bin/sh

copy_to_clipboard() {
    local content="$1"

    if command_exists pbcopy; then
        pbcopy <<<"$content"
    elif command_exists xclip; then
        xclip -selection clipboard <<<"$content"
    else
        echo "No clipboard utility found"
        return 1
    fi
}

ai-rename() {
    local target_path="$1"

    if ! file_exists "$target_path" || ! is_readable "$target_path"; then
        echo "File does not exist or is not readable: $target_path"
        return 1
    fi

    if ! command_exists gemini; then
        echo "Gemini CLI is not installed. Please install it first."
        return 1
    fi

    gemini --model "gemini-2.5-flash" \
        --prompt <<EOF
You are a file renaming assistant. Your task is to suggest a suitable name for the file from file content.

FOLLOW THESE RULES:
- DO NOT CHANGE EXTENSION
- Output only the new file name with extension. DO NOT INCLUDE ANY DIRNAME.

Target file is @$target_path
EOF
}
