---
name: stacked-pr
description: 依存関係のある複数の PR を管理・同期するためのスキル。stacked PR のカスケード rebase、PR 間の依存検出、base branch 管理、CI の上流優先修正を行う。PR が別の PR に依存している状況全般で使う。
---

# stacked-pr

WARNING: If the repo is using GitHub, just use `gh-stack` skill to use GitHub's native stacked PR features.

依存関係のある複数の PR を管理・同期する。PR 間の依存を検出し、カスケード rebase で整合性を保ち、CI を上流から修正する。

## When This Skill Applies

- 依存関係のある複数の PR を扱うとき全般
- 親ブランチが更新され、子 PR が古くなったとき
- PR チェーン全体を最新状態に同期したいとき
- スタックの途中の PR がマージされ、残りの PR を re-target・rebase する必要があるとき
- 機能開発で stacked PR 戦略を使っていて、スタック全体のメンテが必要なとき

## Core Idea

Stacked PRs form a chain: each PR targets its parent branch rather than `main`. When an upstream branch changes, every downstream branch must rebase onto the updated parent in order, one level at a time. CI failures are fixed top-down because upstream CI is independent of downstream changes — once an upstream branch's CI passes, it stays passed regardless of what happens below.

## Concurrency Strategy

すべてのブランチが 1 つの working tree を共有する。境界はそこで引く。

**逐次に実行するもの（working tree を変更する操作）**: `git checkout`、`git rebase`、`git push`、conflict の解消。並行させると互いの index と HEAD を壊すため、必ずトポロジカル順に 1 ブランチずつ処理する。

**同時に発行してよいもの（read-only な照会）**: `gh pr list`、`gh pr view`、`gh repo view`、`gh pr checks`、`git merge-base --is-ancestor`、`git rev-parse`。これらは 1 メッセージ内に複数の Bash 呼び出しを並べて同時発行する。

**`git fetch`**: 複数 ref をまとめた 1 回の `git fetch origin <ref>...` にする。fetch を並行させるより往復が少ない。

**長時間ブロックするコマンド**: `gh run watch` のように待つコマンドは、Bash tool に background 実行のパラメータがあれば background で走らせる。

このスキルは cascade を自分で完走させる。`adjust-pr-base` や `fix-github-actions-ci` は該当箇所でインラインに呼び出す（いずれも gh 呼び出し数回で終わるため、切り出す利得がない）。

## Procedure

### 1. Identify the Starting Point

Issue both lookups concurrently (they're independent):

```bash
git branch --show-current
gh pr view --json number,title,url,baseRefName,headRefName,state 2>/dev/null
```

If the current branch itself needs rebasing onto its parent first, do that before cascading. Invoke the `resolve-merge-conflict` skill if conflicts arise.

### 2. Discover Downstream Branches

**First**, issue a single API call to get all open PRs, and fetch the default branch name concurrently (independent):

```bash
gh pr list --author "@me" --state open --limit 50 \
  --json number,headRefName,headRefOid,baseRefName,url
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
```

**Then**, fetch all candidate remote branches — prefer a single `git fetch` with multiple refs to minimize round-trips:

```bash
git fetch origin <branch1> <branch2> <branch3> ...
```

**Then**, run all ancestry checks concurrently (read-only):

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

Wait for user confirmation before proceeding. Use `AskUserQuestion` for the confirmation.

### 5. Cascade Rebase

Process branches one at a time in topological order. Each branch depends on its parent being pushed, and every branch shares the same working tree, so this loop is strictly sequential from start to finish.

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

**If the rebase succeeds cleanly** — push, then run `adjust-pr-base` for this branch before moving on:

```bash
git push --force-with-lease origin HEAD
```

`adjust-pr-base` is a handful of `gh` calls, so run it inline. Record this branch's pushed HEAD (`git rev-parse HEAD`) — Step 7 compares against it to detect re-cascade needs.

**Exception — orphaned parent:** If the parent branch was detected as deleted/squash-merged (see Edge Cases: Orphaned Stack Member), invoke `adjust-pr-base` **before** the rebase. GitHub's PR base must point to a valid branch before CI runs.

CI 監視は各ブランチでは行わない。cascade を全ブランチ完走させてから Step 6 でまとめて扱う。cascade 途中で CI 修正を挟むと、まだ rebase していない downstream を二度触ることになる。

**If conflicts arise:**

- Invoke the `resolve-merge-conflict` skill to handle the conflict resolution
- If the conflict is too complex to auto-resolve, stop the cascade at this branch and report what's left

**If a branch is already up-to-date:**

- Check with `git merge-base --is-ancestor origin/<parent-branch> HEAD`
- If already up-to-date, skip with a note

**Independent siblings:** Two branches at the same depth have no dependency on each other, but they still share one working tree — rebase them one after the other, in either order. Finish both before descending to their children.

### 6. Watch CI, Upstream First

cascade 完走後、`watch-ci` スキルを上流から下流の順に 1 ブランチずつ呼び出す。`watch-ci` は監視・再実行・flaky 判定・`fix-github-actions-ci` 委譲まで完走する。

**Why upstream first?** Each PR's CI tests its diff against its parent branch. Downstream changes never affect upstream CI. So once an upstream branch passes CI, it's stable — there's no need to re-check it regardless of what happens downstream. 逆に upstream の修正は downstream を必ず古くするので、upstream を確定させないまま downstream を直しても手戻りになる。

先に全ブランチの CI 状態だけ一覧したい場合は、read-only な `gh pr checks` を全 PR に対して同時発行してよい。修正を伴う `watch-ci` の呼び出し自体は 1 ブランチずつ行う。

### 7. Re-cascade After Upstream Fixes

`watch-ci` が CI 失敗を修正して新しいコミットを push すると、その downstream ブランチが古くなる。Step 5 で記録した pushed HEAD と現在の remote HEAD を比較して検出する:

```bash
git rev-parse origin/<branch>
```

新しいコミットが検出されたら、そのブランチより下だけを mini-cascade する:

1. Downstream ブランチを topological order で 1 つずつ rebase する（conflict が出たら `resolve-merge-conflict` を invoke）
2. Push してから、その downstream ブランチの `watch-ci` を改めて呼び出す

**Ordering rule:** あるブランチの CI 修正が終わるまで、その downstream の CI 修正には着手しない。upstream の修正で downstream の失敗が消えることがあり、先に downstream を直すと不要な変更を積む。

**When to stop:**

- 全ブランチが CI pass → Step 8 へ
- `watch-ci` が「PR の変更と無関係な失敗（flaky、インフラ）」として報告 → その内容を記録して次のブランチへ進む
- 同一ブランチの mini-cascade が 2 回を超えた → 停止して状況を報告する
- ユーザーが停止を指示

### 8. Report

Summarize the entire cascade:

```
## Cascade Rebase Report

Starting point: feat/auth

| Branch | PR | Rebase | Conflicts | Push | CI |
|--------|-----|--------|-----------|------|----|
| feat/auth-ui | #42 | ✅ clean | — | ✅ | ✅ pass |
| feat/auth-ui-tests | #43 | ✅ clean | — | ✅ | ⚠️ flaky (passed on rerun) |
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

A PR in the stack targets a branch that's been deleted or merged. Invoke `adjust-pr-base` **before** the rebase to re-target the PR to the nearest valid ancestor or the default branch. The rebase can proceed with the same target once `adjust-pr-base` completes.

## Boundaries

- このスキルは依存関係のある PR の同期・メンテナンスを扱う。新規スタックの作成や大きな PR の分割は扱わない。
  - 大きな PR/ブランチを stacked PR に分割するには `reorganize-diff` スキルを使う。
  - 大きな機能開発の stacked PR 計画を立てるには `plan-stacked-pr` スキルを使う。
  - これらのスキルで作成されたスタックの継続的メンテナンス（cascade rebase、CI 監視・修正、スタック同期）は本スキルが担う。
- This skill orchestrates the cascade by invoking specialized skills (`adjust-pr-base`, `resolve-merge-conflict`, `fix-github-actions-ci`) at the appropriate points. Each skill owns its own domain logic.
- If the user asks to create a new branch in the stack while cascading, finish the cascade first, then address the new branch request separately.
