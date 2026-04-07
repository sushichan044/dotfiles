---
name: stacked-pr
description: 依存関係のある複数の PR を管理・同期するためのスキル。stacked PR のカスケード rebase、PR 間の依存検出、base branch 管理、CI の上流優先修正を行う。PR が別の PR に依存している状況全般で使う — cascade rebase、スタック sync、依存先 PR 更新後のメンテ、PR チェーンの整合性確認などをするときなど。
allowed-tools: Read, Grep, Glob, Edit, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git fetch:*), Bash(git rebase:*), Bash(git add:*), Bash(git diff:*), Bash(git show:*), Bash(git merge-base:*), Bash(git rev-parse:*), Bash(git rev-list:*), Bash(git cat-file:*), Bash(git restore:*), Bash(git push:*), Bash(git log:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh pr edit:*), Bash(gh pr checks:*), Bash(gh pr create:*), Bash(gh repo view:*), Bash(gh run view:*), Bash(gh run list:*), Bash(gh run watch:*)
---

# stacked-pr

依存関係のある複数の PR を管理・同期する。PR 間の依存を検出し、カスケード rebase で整合性を保ち、CI を上流から修正する。

## When This Skill Applies

- 依存関係のある複数の PR を扱うとき全般
- 親ブランチが更新され、子 PR が古くなったとき
- PR チェーン全体を最新状態に同期したいとき
- スタックの途中の PR がマージされ、残りの PR を re-target・rebase する必要があるとき
- 機能開発で stacked PR 戦略を使っていて、スタック全体のメンテが必要なとき

## Core Idea

Stacked PRs form a chain: each PR targets its parent branch rather than `main`. When an upstream branch changes, every downstream branch must rebase onto the updated parent in order, one level at a time. CI failures are fixed top-down because upstream CI is independent of downstream changes — once an upstream branch's CI passes, it stays passed regardless of what happens below.

## Procedure

### 1. Identify the Starting Point

Determine the current branch — this is the "root of the cascade." Everything below it in the stack will be rebased.

```bash
git branch --show-current
gh pr view --json number,title,url,baseRefName,headRefName,state 2>/dev/null
```

If the current branch itself needs rebasing onto its parent first, do that before cascading. Use the `resolve-merge-conflict` skill's approach if conflicts arise.

### 2. Discover Downstream Branches

Find all open PRs whose branches are descendants of the current branch.

```bash
current_head=$(git rev-parse HEAD)
default_branch=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)

gh pr list --author "@me" --state open --limit 50 \
  --json number,headRefName,headRefOid,baseRefName,url \
  | jq -c '.[]'
```

For each PR returned, check if the current branch's HEAD is an ancestor of that PR's head:

```bash
# Fetch the branch if not available locally
git fetch --quiet origin <headRefName> 2>/dev/null

# Check ancestry: is current HEAD an ancestor of this branch?
git merge-base --is-ancestor "$current_head" <headRefOid>
```

If yes, this PR is a downstream descendant. Record it with its parent relationship.

### 3. Build the Stack Tree

From the discovered descendants, build the parent-child tree:

- A branch's parent is its PR's `baseRefName`
- Sort topologically: branches whose parent is the current branch come first, then their children, and so on

The result is an ordered list of branches to rebase, each paired with its parent branch.

**Example:**

```
main ← feat/auth (current, already rebased)
         ├─ feat/auth-ui
         │   └─ feat/auth-ui-tests
         └─ feat/auth-api
```

Rebase order: `feat/auth-ui` → `feat/auth-ui-tests` → `feat/auth-api`

### 4. Show Plan and Confirm

Present the stack and planned actions:

```
Stack from feat/auth:
  1. feat/auth-ui (PR #42) ← rebase onto feat/auth
  2. feat/auth-ui-tests (PR #43) ← rebase onto feat/auth-ui
  3. feat/auth-api (PR #44) ← rebase onto feat/auth

Proceed with cascade rebase? (3 branches)
```

Wait for user confirmation before proceeding. Use an interactive question tool when available.

### 5. Cascade Rebase

For each branch in topological order:

```bash
git checkout <branch>
git fetch origin <parent-branch>
git rebase origin/<parent-branch>
```

**If the rebase succeeds cleanly:**

- Continue to the next step

**If conflicts arise:**

- Follow the `resolve-merge-conflict` skill's approach: resolve simple conflicts (formatting, imports, renames) automatically, ask the user about ambiguous ones
- After resolving: `git add <files> && git rebase --continue`
- If the conflict is too complex to auto-resolve, stop the cascade at this branch and report what's left

**If a branch is already up-to-date:**

- Check with `git merge-base --is-ancestor origin/<parent-branch> HEAD`
- If already up-to-date, skip with a note

After each successful rebase:

```bash
git push --force-with-lease origin HEAD
```

Then run the `adjust-pr-base` skill's procedure to verify/correct the PR's base branch. This skill already covers base adjustment inline, so PostToolUse hooks that suggest running `adjust-pr-base` separately can be skipped.

### 6. Watch CI

After all branches are pushed, start background CI watches for every branch that was rebased:

```bash
# For each rebased branch, find the latest run and watch it
gh run list --branch <branch> --limit 1 --json databaseId --jq '.[0].databaseId'
gh run watch <run-id> --exit-status
```

Run all watches in background simultaneously. There's no need to wait for them sequentially.

### 7. Fix CI Failures (Top-Down)

When CI results come back, process failures starting from the most upstream branch:

**Why top-down?** Each PR's CI tests its diff against its parent branch. Downstream changes never affect upstream CI. So once an upstream branch passes CI, it's stable — there's no need to re-check it regardless of what happens downstream.

**Fixing a failure:**

1. Use the `fix-github-actions-ci` skill's approach: read failed logs, identify the root cause, implement the fix
2. Commit and push the fix to that branch
3. Re-watch CI for that branch
4. If the fix involved code changes, every downstream branch needs re-rebasing:
   - Re-run Steps 5–6 starting from that branch's children
   - This is a mini-cascade within the larger one

**When to stop fixing:**

- All CI passes → report success
- A failure is outside the scope of the current changes (pre-existing flaky test, infrastructure issue) → report the failure and move on
- The user says to stop

### 8. Report

Summarize the entire cascade:

```
## Cascade Rebase Report

Starting point: feat/auth

| Branch | PR | Rebase | Conflicts | Push | CI |
|--------|-----|--------|-----------|------|----|
| feat/auth-ui | #42 | ✅ clean | — | ✅ | ✅ pass |
| feat/auth-ui-tests | #43 | ✅ clean | — | ✅ | ⏳ running |
| feat/auth-api | #44 | ⚠️ conflicts | 2 auto-resolved | ✅ | ❌ lint failure (fixed) |

Actions taken:
- Resolved 2 merge conflicts in feat/auth-api (import reordering)
- Fixed lint error in feat/auth-api/src/handler.ts
- All PR bases verified correct
```

## Edge Cases

### Branch Has No Open PR

Skip it but warn: the branch exists in the ancestry chain but has no PR. It might be a local-only branch or a deleted PR.

### Conflict Cannot Be Auto-Resolved

Stop the cascade at the conflicting branch. Report:

- Which branch has the conflict
- What files are conflicted
- What the cascade state is (which branches were already rebased)
- Ask the user to resolve manually, then offer to continue the cascade

### CI Fix Triggers Re-Cascade

When fixing CI requires code changes and a new push, downstream branches become stale again. Re-cascade from that point. Track which branches have been re-rebased to avoid infinite loops — if the same branch needs re-rebasing more than twice, stop and report.

### Orphaned Stack Member

A PR in the stack targets a branch that's been deleted or merged. Use `adjust-pr-base` to re-target it to the nearest valid ancestor or the default branch.

## Boundaries

- このスキルは依存関係のある PR の同期・メンテナンスを扱う。新規スタックの作成や大きな PR の分割は扱わない。
  - 大きな PR/ブランチを stacked PR に分割するには `split-big-pr` スキルを使う。
  - 大きな機能開発の stacked PR 計画を立てるには `plan-stacked-pr` スキルを使う。
  - これらのスキルで作成されたスタックの継続的メンテナンス（cascade rebase、CI 監視・修正、スタック同期）は本スキルが担う。
- When PostToolUse hooks for `adjust-pr-base`, `prepare-issue-pr`, or `contextual-commit` fire during the cascade, they are already covered by this workflow. Follow the cascade procedure rather than switching to those skills individually.
- If the user asks to create a new branch in the stack while cascading, finish the cascade first, then address the new branch request separately.
