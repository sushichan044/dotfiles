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

    # cwd/.sushichan044/memo/year/month-day-hour-minute.md
    local memo_file_name="${year}/${month}-${day}-${hour}-${minute}.md"
    local memo_file_path="$(pwd)/.sushichan044/memo/$memo_file_name"

    create_directory_for_new_file "$memo_file_path"
    touch "$memo_file_path"
    copy_to_clipboard "$memo_file_path"

    echo "✅ Memo created at: $memo_file_path. Path copied to clipboard."
}
