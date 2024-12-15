#!/bin/zsh
# ref: https://www.mizdra.net/entry/2024/10/19/172323

user_name=$(git config user.name)
fmt="\
%(if:equals=$user_name)%(authorname)%(then)%(color:default)%(else)%(color:brightred)%(end)%(refname:short)|\
%(committerdate:relative)|\
%(subject)"
function select-git-branch-friendly() {
    selected_branch=$(
        git branch --sort=-committerdate --format=$fmt --color=always |
            column -ts'|' |
            fzf --ansi --exact --preview='git log --oneline --graph --decorate --color=always -50 {+1}' |
            awk '{print $1}'
    )
    BUFFER="${LBUFFER}${selected_branch}${RBUFFER}"
    CURSOR=$#LBUFFER+$#selected_branch
    zle redisplay
}
zle -N select-git-branch-friendly
bindkey '^b' select-git-branch-friendly
