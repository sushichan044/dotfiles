---
name: rebase-pr-base
description: Use when a pull request base might be wrong after `git rebase`, `gh pr create`, or stacked PR work and the agent needs a fixed procedure to inspect the current PR and correct its base branch.
allowed-tools: Bash(git branch:*) Bash(git merge-base:*) Bash(git rev-list:*) Bash(git rev-parse:*) Bash(git cat-file:*) Bash(git fetch:*) Bash(gh pr view:*) Bash(gh pr list:*) Bash(gh repo view:*) Bash(gh pr edit:*)
---

# rebase-pr-base

## Goal

This skill is a fixed procedure:

1. Find the open PR for the current branch.
2. Find the repository default branch.
3. Find the nearest open parent PR by git ancestry.
4. Set the PR base to that parent branch if one exists.
5. Otherwise set or keep the PR base as the default branch.

Do not add extra policy or heuristics.

## When To Use

- After `git rebase`
- After `gh pr create`
- When working with stacked PRs
- When checking whether `gh pr edit --base ...` is needed

## Rules

Follow these rules in order:

1. Only inspect the PR for the current branch.
2. Only consider open PRs as parent candidates.
3. A parent candidate must be an ancestor of `HEAD`.
4. If multiple parent candidates exist, choose the one with the smallest `git rev-list <candidate>..HEAD --count`.
5. If no parent candidate exists, use the default branch.
6. If the current base already matches the target base, do nothing.
7. If the current branch has no open PR, stop and report that nothing was changed.

## Procedure

### 1. Read current branch and PR

```bash
git branch --show-current
gh pr view --json number,title,url,baseRefName,headRefName,state 2>/dev/null
```

If `gh pr view` fails, retry with:

```bash
branch=$(git branch --show-current)
gh pr list --head "$branch" --state open --json number,title,url,baseRefName,headRefName,state
```

If there is no open PR for the current branch, stop.

### 2. Read default branch

```bash
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
```

### 3. Find the nearest open parent PR

Use git ancestry only. Ignore reflog and subjective reasoning.

```bash
head_oid=$(git rev-parse HEAD)
gh pr list --author "@me" --state open --limit 30 \
  --json number,headRefName,headRefOid,url \
  | jq -r '.[] | "\(.number) \(.headRefName) \(.headRefOid) \(.url)"' \
  | while read num name oid url; do
      [ "$oid" = "$head_oid" ] && continue
      if ! git cat-file -e "$oid" 2>/dev/null; then
        git fetch --quiet origin "$name" 2>/dev/null || continue
      fi
      if git merge-base --is-ancestor "$oid" HEAD 2>/dev/null; then
        dist=$(git rev-list "${oid}..HEAD" --count)
        echo "$dist $num $name $url"
      fi
    done | sort -n | head -n 1
```

Interpretation:

- If this command returns one line, the third column is the target base branch.
- If this command returns nothing, the target base branch is the default branch.

### 4. Update the PR base if needed

```bash
gh pr edit <number> --base <target-branch>
```

Run this only when the current base and target base differ.

### 5. Report the result

Always report:

- current branch
- current PR URL
- previous base
- target base
- whether `gh pr edit --base` was run

## Output Template

```text
Current branch: <branch>
Current PR: <url>
Previous base: <old-base>
Target base: <target-base>
Action: changed | unchanged | no-open-pr
Reason: nearest open ancestor PR | no open ancestor PR, so default branch
```

## Don'ts

- Do not ask the user to choose between multiple bases.
- Do not inspect closed PRs.
- Do not use reflog as a source of truth.
- Do not keep extra fallback branches in the procedure.
- Do not leave the target base ambiguous.
