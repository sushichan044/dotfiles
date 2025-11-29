#!/bin/sh

summary() {
    local target_path=$(realpath "$1")

    local dir_name=$(dirname "$target_path")
    local file_name=$(basename "$target_path")
    local summary_file_path="$dir_name/${file_name%.*}_summary.md"

    echo "Creating summary file at: $summary_file_path"

    mkdir_for_file "$summary_file_path"

    if ! file_exists "$target_path" || ! is_readable "$target_path"; then
        echo "File does not exist or is not readable: $target_path"
        return 1
    fi

    local prompt=$(
        cat <<EOF
You are a file summarization assistant. Your task is to provide a concise summary of the file
@$target_path.

## 1. Write your summary

### Content Guidelines

- Well-formatted, concise, and clear
- Use bullet points for clarity
- Include key points, insights, and conclusions
- Avoid unnecessary details

### Style Guidelines
- Use a professional tone
- Use Markdown formatting for headings, lists, and emphasis
- Use proper grammar and punctuation
- Insert newlines between sections for readability

## 2. Dump your summary

Execute write_file(
    file_path="$summary_file_path",
    content="{YOUR SUMMARY HERE}"
)
EOF
    )

    copy_to_clipboard "$prompt"
    echo "✅ Prompt copied to clipboard. Please paste it into your AI assistant."

    gemini --model "gemini-2.5-flash"
}
