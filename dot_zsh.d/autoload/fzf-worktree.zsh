#!/bin/zsh
# fzf-based git worktree selector
# Inspired by:
# - https://www.mizdra.net/entry/2024/10/19/172323 (git branch selection patterns)
#
# Usage:
#   - Direct: fzf-worktree
#   - Keybind: Ctrl+N
#
# Features:
#   - Lists all git worktrees with enhanced preview
#   - Shows git log in preview pane
#   - Works both from command line and as ZLE widget
# Prerequisites:
#   - git
#   - fzf
#   - zsh

function fzf-worktree() {
    # Format of `git worktree list`: path commit [branch]
    local selected_worktree=$(git worktree list | fzf \
        --prompt="worktrees > " \
        --header="Select a worktree to cd into" \
        --preview="git -C {1} log --oneline --graph --decorate --color=always -50" \
        --preview-window="right:35%,wrap" \
        --reverse \
        --border \
        --ansi)

    if [ $? -ne 0 ]; then
        return 0
    fi

    if [ -n "$selected_worktree" ]; then
        local selected_path=${${(s: :)selected_worktree}[1]}

        if [ -d "$selected_path" ]; then
            if zle; then
                # Called from ZLE (keyboard shortcut)
                BUFFER="cd ${selected_path}"
                zle accept-line
            else
                # Called directly from command line
                cd "$selected_path"
            fi
        else
            echo "Directory not found: $selected_path"
            return 1
        fi
    fi

    # Only clear screen if ZLE is active
    if zle; then
        zle clear-screen
    fi
}

zle -N fzf-worktree
bindkey '^n' fzf-worktree
