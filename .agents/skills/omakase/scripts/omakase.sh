#!/usr/bin/env bash
# Toggle omakase mode per git repo / linked worktree.
# State is keyed by the closest git worktree root (repo root or linked worktree
# root) so toggling anywhere inside the tree applies to the whole tree.
# Written to ~/.cache/sushichan044/omakase/state.json and consumed by
# .claude/hooks/omakase.ts to deny AskUserQuestion and push Claude
# toward autonomous, subagent-driven decision making.

set -euo pipefail

state_dir="${XDG_CACHE_HOME:-$HOME/.cache}/sushichan044/omakase"
state_file="$state_dir/state.json"

mkdir -p "$state_dir"
[[ -f "$state_file" ]] || printf '{"directories":{},"sessions":{}}\n' >"$state_file"

mode="${1:-status}"
key="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"

write_state() {
    local jq_expr="$1"
    local tmp
    tmp="$(mktemp "${state_file}.XXXXXX")"
    # shellcheck disable=SC2064
    trap "rm -f '$tmp'" EXIT
    jq --arg key "$key" "$jq_expr" "$state_file" >"$tmp"
    mv "$tmp" "$state_file"
    trap - EXIT
}

case "$mode" in
on)
    # shellcheck disable=SC2016
    write_state '.directories[$key] = {"enabled": true}'
    printf 'omakase: ON for %s\n' "$key"
    ;;
off)
    # shellcheck disable=SC2016
    write_state '.directories[$key] = {"enabled": false}'
    printf 'omakase: OFF for %s\n' "$key"
    ;;
status)
    # shellcheck disable=SC2016
    if jq -e --arg key "$key" '.directories[$key].enabled // false' "$state_file" >/dev/null; then
        printf 'omakase: ON for %s\n' "$key"
    else
        printf 'omakase: OFF for %s\n' "$key"
    fi
    ;;
*)
    printf 'usage: omakase.sh [on|off|status]\n' >&2
    exit 2
    ;;
esac
