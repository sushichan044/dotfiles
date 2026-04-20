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

## Parallelism Strategy

**Maximize concurrency at every opportunity.** The rebase itself must be sequential (topological order), but everything around it — fetches, CI watches, PR base adjustments, CI failure diagnostics — should run in parallel whenever possible.

Key parallelism opportunities:

| Phase            | What to parallelize                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery        | `git fetch` all candidate branches concurrently                                                                                                               |
| Rebase loop      | After each push, immediately launch `adjust-pr-base` as a background sub-agent and a background CI watch before moving to the next branch                     |
| CI watching      | All CI watches run concurrently                                                                                                                               |
| CI fix diagnosis | Spawn `fix-github-actions-ci` sub-agents in parallel for independent failures; apply fixes top-down but don't wait for one diagnosis before starting the next |

**Run Bash commands in the background wherever possible** — independent commands should never block each other.

**Sub-agent pattern:** Use background sub-agents for tasks that involve multiple steps but don't need to block the main thread — e.g., `adjust-pr-base`, `fix-github-actions-ci`. Launch them immediately after the triggering action (push, CI failure detection) and collect results later.

## Procedure

### 1. Identify the Starting Point

Issue both lookups concurrently in background (they're independent):

```bash
git branch --show-current
gh pr view --json number,title,url,baseRefName,headRefName,state 2>/dev/null
```

If the current branch itself needs rebasing onto its parent first, do that before cascading. Invoke the `resolve-merge-conflict` skill if conflicts arise.

### 2. Discover Downstream Branches

**First**, issue a single API call to get all open PRs, and fetch the default branch name concurrently in background (independent):

```bash
gh pr list --author "@me" --state open --limit 50 \
  --json number,headRefName,headRefOid,baseRefName,url
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
```

**Then**, fetch all candidate remote branches — prefer a single `git fetch` with multiple refs to minimize round-trips:

```bash
git fetch origin <branch1> <branch2> <branch3> ...
```

**Then**, run all ancestry checks concurrently in background:

```bash
current_head=$(git rev-parse HEAD)
git merge-base --is-ancestor "$current_head" <oid1>
git merge-base --is-ancestor "$current_head" <oid2>
git merge-base --is-ancestor "$current_head" <oid3>
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

Branches at the same depth level with no dependency between them (e.g., `feat/auth-ui` and `feat/auth-api` above) are **independent siblings** — note them for potential parallel handling after their shared parent is rebased.

### 4. Show Plan and Confirm

Present the stack and planned actions:

```
Stack from feat/auth:
  1. feat/auth-ui (PR #42) ← rebase onto feat/auth
  2. feat/auth-ui-tests (PR #43) ← rebase onto feat/auth-ui
  3. feat/auth-api (PR #44) ← rebase onto feat/auth   [sibling of #1]

Proceed with cascade rebase? (3 branches)
```

Wait for user confirmation before proceeding. Use an interactive question tool when available.

### 5. Cascade Rebase

Process branches in topological order. The rebase itself is sequential (each branch depends on its parent being done), but fire off parallel work immediately after each push.

For each branch:

```bash
git checkout <branch>
```

**Before rebasing, detect if the parent PR was squash-merged:**

```bash
# If parent branch no longer exists on remote, it was likely squash-merged
git ls-remote --heads origin <parent-branch>
# Returns nothing → squash merge; pass this context to resolve-merge-conflict
```

Invoke `resolve-merge-conflict`, passing the squash-merge detection result in the skill invocation message — e.g., `"The parent branch <parent-branch> was squash-merged (no longer exists on remote). Rebase <current-branch> onto <target>."` vs `"Rebase <current-branch> onto <target>."` for normal cases. That skill owns the rebase procedure for both cases (regular and squash merge).

**If the rebase succeeds cleanly** — push, then immediately fire off the following concurrently before moving to the next branch:

```bash
git push --force-with-lease origin HEAD

# Fire-and-forget — don't wait before moving to the next branch:
# 1. Background sub-agent: invoke adjust-pr-base for this branch
# 2. Background CI watch (see Step 6)
```

**Exception — orphaned parent:** If the parent branch was detected as deleted/squash-merged (see Edge Cases: Orphaned Stack Member), invoke `adjust-pr-base` **before** the rebase — not as a background post-push task. GitHub's PR base must point to a valid branch before CI runs.

Proceed to the next branch in the topological order without waiting for these to finish.

**If conflicts arise:**

- Invoke the `resolve-merge-conflict` skill to handle the conflict resolution
- If the conflict is too complex to auto-resolve, stop the cascade at this branch and report what's left

**If a branch is already up-to-date:**

- Check with `git merge-base --is-ancestor origin/<parent-branch> HEAD`
- If already up-to-date, skip with a note

**Independent siblings:** When two branches at the same depth are both ready to rebase (their shared parent was just pushed), spawn each rebase as a separate background sub-agent so they proceed in parallel. Collect results before moving to their children.

### 6. Watch CI

各ブランチの push 直後に **`watch-ci` スキルを background sub-agent として invoke** する — cascade 全体の完了を待たない。

```
# Immediately after push for <branch>:
Invoke watch-ci as a background sub-agent for <branch>.
```

全ブランチの push が完了した時点で、全 `watch-ci` インスタンスが並列で稼働している。`watch-ci` は監視・再実行・flaky 判定・`fix-github-actions-ci` 委譲まで完走する。

### 7. Coordinate CI and Re-cascade After Upstream Fixes

Background `watch-ci` sub-agents からの結果を上流ブランチ順に収集する。

**Why top-down?** Each PR's CI tests its diff against its parent branch. Downstream changes never affect upstream CI. So once an upstream branch passes CI, it's stable — there's no need to re-check it regardless of what happens downstream.

**Re-cascade trigger:** `watch-ci` が CI 失敗を修正して新しいコミットを push した場合、その downstream ブランチが古くなる。`watch-ci` sub-agent の完了後、元の push 時の HEAD と現在の `origin/<branch>` を比較して検出する:

```bash
git rev-parse origin/<branch>
```

新しいコミットが検出されたら、downstream ブランチに mini-cascade を開始する:

1. Downstream ブランチを topological order でリベース（各ブランチで `resolve-merge-conflict` を invoke）
2. Push して新しい `watch-ci` を background sub-agent として起動する

**Upstream の `watch-ci` が完了する前に downstream `watch-ci` が先に結果を返した場合:**

- Downstream CI pass → 記録して待機を続ける
- Downstream CI fail → 結果を保留する。Upstream の修正が mini-cascade されてから新しい CI 結果が届くまで適用しない。Mini-cascade 後も fail なら保留済みの `watch-ci` 修正内容を適用する

**When to stop:**

- 全 `watch-ci` sub-agent が pass で完了 → Step 8 へ
- `watch-ci` が「upstream 変更と無関係な失敗（flaky、インフラ）」として報告 → 報告して次へ
- ユーザーが停止を指示

### 8. Collect Background Results and Report

Before generating the final report, collect all outstanding background tasks:

- Read results from all `watch-ci` background sub-agents
- Read results from all `adjust-pr-base` background sub-agents

Then summarize the entire cascade:

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

A PR in the stack targets a branch that's been deleted or merged. Invoke `adjust-pr-base` **before** the rebase (not as a post-push background task) to re-target the PR to the nearest valid ancestor or the default branch. The rebase can proceed with the same target once `adjust-pr-base` completes.

## Boundaries

- このスキルは依存関係のある PR の同期・メンテナンスを扱う。新規スタックの作成や大きな PR の分割は扱わない。
  - 大きな PR/ブランチを stacked PR に分割するには `split-big-pr` スキルを使う。
  - 大きな機能開発の stacked PR 計画を立てるには `plan-stacked-pr` スキルを使う。
  - これらのスキルで作成されたスタックの継続的メンテナンス（cascade rebase、CI 監視・修正、スタック同期）は本スキルが担う。
- This skill orchestrates the cascade by invoking specialized skills (`adjust-pr-base`, `resolve-merge-conflict`, `fix-github-actions-ci`) at the appropriate points. Each skill owns its own domain logic.
- If the user asks to create a new branch in the stack while cascading, finish the cascade first, then address the new branch request separately.
