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


memo() {
    local year=$(date +%Y)
    local month=$(date +%m)
    local day=$(date +%d)
    local hour=$(date +%H)
    local minute=$(date +%M)

    local memo_file_name="${year}/${month}-${day}-${hour}-${minute}.md"
    local memo_file_path="$(pwd)/.sushichan044/memo/$memo_file_name"

    create_directory_for_new_file "$memo_file_path"
    touch "$memo_file_path"
    copy_to_clipboard "$memo_file_path"

    # message for human, print to stderr
    echo "✅ Memo created at: $memo_file_path. Path copied to clipboard." 1>&2

    # print the file path to stdout, useful for piping
    echo "$memo_file_path"
}

memo-fzf() {
    local memo_dir="$(pwd)/.sushichan044/memo"
    if [ ! -d "$memo_dir" ]; then
        echo "Memo directory does not exist: $memo_dir"
        return 1
    fi

    local selected_file=$(find "$memo_dir" -type f | fzf \
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
