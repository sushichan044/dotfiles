codex-pr-review() {
    if [[ "$1" == "--help" || "$1" == "-h" ]]; then
        cat <<'EOF'
Usage: codex-pr-review <pr>

Review a pull request locally with `codex review`.

Arguments:
  <pr>  Pull request number, URL, or blank for current branch's PR
EOF
        return 0
    fi

    local pr="$(gh resolve-pr "$1")"
    if [[ -z "$pr" ]]; then
        echo "PR not found: $1"
        return 1
    fi

    local number="$(jq -r '.number' <<<"$pr")"
    local merged="$(jq -r '.merged' <<<"$pr")"
    local owner="$(jq -r '.owner' <<<"$pr")"
    local repo="$(jq -r '.repo' <<<"$pr")"
    local branch="$(jq -r '.headRef' <<<"$pr")"
    local base_branch="$(jq -r '.baseRef' <<<"$pr")"

    if [[ "$merged" == "true" ]]; then
        echo "PR #$number is already merged."
        return 1
    fi

    local repo_path="$(ghq root)/github.com/${owner}/${repo}"
    # must be cloned locally
    if [[ ! -d "$repo_path" ]]; then
        echo "Repository not found locally: github.com/${owner}/${repo}"
        return 1
    fi

    # get into worktree
    cd "$repo_path" || return
    git wt "$branch"

    codex review --base "$base_branch" --config "model_reasoning_effort='high'"
}
