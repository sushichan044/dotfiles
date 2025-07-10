#!/bin/sh

__ensure_memo_base_directory() {
    local memo_dir="$(pwd)/.sushichan044/memo"
    mkdir -p "$memo_dir"
    echo "$memo_dir"
}

memo() {
    local provided_name="$1"
    # remove extension if provided
    if [[ "$provided_name" == *.* ]]; then
        provided_name="${provided_name%.*}"
    fi
    local memo_slug="${provided_name:-$(TZ=UTC-9 date +'%H-%M-%S')}"

    local memo_base_dir=$(__ensure_memo_base_directory)
    local memo_dir=$(TZ=UTC-9 date +'%Y%m%d')
    local memo_file_path="$memo_base_dir/$memo_dir/$memo_slug.md"

    mkdir_for_file "$memo_file_path"
    touch "$memo_file_path"
    copy_to_clipboard "$memo_file_path"

    # message for human, print to stderr
    echo "✅ Memo created at: $memo_file_path. Path copied to clipboard." 1>&2

    # print the file path to stdout, useful for piping
    echo "$memo_file_path"
}

memo-fzf() {
    local memo_base_dir="$__ensure_memo_base_directory"

    local selected_file=$(find "$memo_base_dir" -type f | fzf \
        --header="Select a memo file path to copy" \
        --exact \
        --reverse \
        --border \
        --preview 'cat {+1}' \
        --preview-window=right:30%:wrap \
        --ansi)

    if [ -n "$selected_file" ]; then
        # message for human, print to stderr
        echo "✅ Memo created at: $selected_file. Path copied to clipboard." 1>&2

        # print the file path to stdout, useful for piping
        echo "$selected_file"
    else
        echo "No memo file selected."
    fi
}
