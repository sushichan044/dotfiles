---
name: git-workflow
description: "Git/GitHub entry point: use for repository inspection, commits, PR creation or updates, rebases, stacked PRs, reviews, and CI."
---

# Git Workflow

Route the requested operation to the skill that owns it. Carry the user's scope,
prior authorization, and completed actions through each handoff.
When a caller already owns a phase such as CI monitoring, return results to it
instead of recursively starting that phase.

## Scope and Discovery

Inspection and review requests produce findings. Posting comments, changing PRs,
or publishing branches requires authorization from the task. A request to commit
or publish the task's changes covers staging those changes; preserve unrelated
changes and ask only if ownership or the intended selection remains ambiguous.

Run only the probes needed for the current operation:

- Local changes: `git status --short` and the relevant staged or unstaged diff.
- Current branch: `git branch --show-current`.
- Current PR: `gh pr view --json number,url,state,baseRefName,headRefName,headRefOid`.
  If unavailable, query open PRs for the resolved head branch. Distinguish an empty
  successful query from authentication, network, or repository errors.
- Default branch: `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`.
- Before rebase, push, or PR creation: inspect `gh stack view --json` using
  [stacked-pr](../stacked-pr/SKILL.md). A failed probe leaves membership unknown;
  resolve the failure before applying single-branch operations.

Reuse observations until a relevant write or concurrent update invalidates them.
For history-rewriting pushes, establish affected branches, remote tips, and PRs.
Proceed when existing authorization covers that impact; otherwise prepare and verify
the local result before requesting approval for the concrete push.

## Routing

| Intent                                  | Workflow                                                             |
| --------------------------------------- | -------------------------------------------------------------------- |
| Inspect local state or diff             | Run relevant read-only probes and report evidence                    |
| Commit                                  | Follow Commit below                                                  |
| Create a PR                             | Follow Create PR below                                               |
| Push or update a PR                     | Follow Push below                                                    |
| Rebase                                  | Follow Rebase below                                                  |
| Synchronize or repair a stack           | [stacked-pr](../stacked-pr/SKILL.md)                                 |
| Split a PR or organize commits          | [reorganize-diff](../reorganize-diff/SKILL.md)                       |
| Draft an issue or PR                    | [prepare-issue-pr](../prepare-issue-pr/SKILL.md)                     |
| Review a PR or post authorized feedback | [github-pr-review-operation](../github-pr-review-operation/SKILL.md) |
| Inspect chronological issue/PR events   | [gh-timeline](../gh-timeline/SKILL.md)                               |
| Investigate or repair CI                | [fix-github-actions-ci](../fix-github-actions-ci/SKILL.md)           |
| Wait for CI                             | [watch-ci](../watch-ci/SKILL.md)                                     |

## Commit

1. Inspect the diff and select the changes covered by the request.
2. Stage the selected paths or hunks and inspect the staged diff.
3. Use [contextual-commit](../contextual-commit/SKILL.md) for the message.
4. Commit and verify the resulting commit and remaining worktree state. Hook failures
   are failed checks to resolve, not evidence that a commit succeeded.

Completion: the intended changes exist in a verified commit and unrelated work remains preserved.

## Create PR

1. Commit the intended pending changes when needed.
2. Use `reorganize-diff` Phase 1 to check review boundaries. If no split is needed,
   continue. If execution would materially expand the requested PR structure, present
   the concrete split before requesting direction.
3. For an existing or newly created stack, use `stacked-pr` and `gh-stack` for
   publication. Reuse PRs or pushes already completed by reorganization.
4. For a single PR, use `prepare-issue-pr` to finalize title, body, and base, then
   push the branch and create a draft PR. Use `--body-file` for multiline text.
   Make it ready for review only when requested.
5. For a single PR, use `adjust-pr-base` to verify its base. Use `watch-ci` after
   publication and pass any observation-only constraint.

Completion: report the verified PR URL, base, and CI outcome. Pending, absent, or
blocked checks remain explicit; PR creation alone does not establish CI success.

## Push

1. Commit authorized changes if needed. For a stack, route to `stacked-pr`.
2. Push only if the current commits have not already been published.
3. Inspect the PR title and body; use `prepare-issue-pr` to update stale metadata
   within the requested PR update.
4. Use `watch-ci` for the published revision.

Completion: the remote revision matches the intended local revision, metadata describes
the current change, and the CI outcome is reported.

## Rebase

1. Resolve the target base and stack membership. Route stacks to `stacked-pr`.
2. For a single branch, preserve existing work and record the original tip, fetch the
   target, and rebase. Use [resolving-merge-conflicts](../resolving-merge-conflicts/SKILL.md)
   for an in-progress conflict; that skill does not initiate or publish the rebase.
3. Inspect the resulting diff and run checks appropriate to conflict resolutions.
4. Publish only within the requested scope, using `--force-with-lease` when rewriting
   an existing remote branch. Verify the PR base with `adjust-pr-base` when relevant.
5. After publication, use `watch-ci`.

Completion: the branch contains the intended base and changes without unresolved
conflicts; report whether publication was requested and performed.
