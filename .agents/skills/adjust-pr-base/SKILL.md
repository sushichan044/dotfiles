---
name: adjust-pr-base
description: Resolve the nearest open ancestor PR for drafting, or verify and correct an unmanaged PR base after creation, rebase, or a parent merge.
allowed-tools: Bash(git branch:*) Bash(git merge-base:*) Bash(git rev-list:*) Bash(git rev-parse:*) Bash(git cat-file:*) Bash(git fetch:*) Bash(gh pr view:*) Bash(gh pr list:*) Bash(gh repo view:*) Bash(gh pr edit:*)
---

# adjust-pr-base

## Goal

This skill is a fixed procedure:

1. Find the open PR for the current branch.
2. Find the repository default branch.
3. Find the nearest open parent PR by git ancestry.
4. Set the PR base to that parent branch if one exists.
5. If the base changes to a parent PR branch, update the PR description to include that parent PR URL.
6. Otherwise set or keep the PR base as the default branch without adding a base PR link.

For inspection or drafting, run discovery only (steps 0–3) and report the target.
For an authorized PR correction, continue through readback. Reuse the user's
authorization from the calling workflow.

## When To Use

- After `git rebase`
- After `gh pr create`
- When working with stacked PRs on a host without native stack support
- When checking whether `gh pr edit --base ...` is needed
- After a parent PR has been merged or closed, to update this PR's base to the default branch

## When Not To Use

Skip this skill when the PR belongs to a `gh stack` stack. `gh stack submit` / `gh stack link` set each PR's base to its parent branch, and GitHub re-targets a PR to the default branch when its base branch is merged. Running this procedure there is a no-op at best, and it can fight the tool when the stack is mid-repair. The `stacked-pr` skill decides when a base actually needs fixing.

Check with `gh stack view --json` before starting: if the current branch appears in
`.branches[]`, return `stack-owned` to the caller so it can continue through
`stacked-pr`. A failed probe leaves membership unknown; diagnose its error.

## Rules

Follow these rules in order:

1. If the current branch belongs to a `gh stack` stack, stop and report `stack-owned`. Do not edit the base.
2. Only inspect the PR for the current branch.
3. Only consider open PRs as parent candidates. A merged or closed PR is excluded;
   another open ancestor can still be the target.
4. A parent candidate must be an ancestor of `HEAD`.
5. If multiple parent candidates exist, choose the one with the smallest `git rev-list <candidate>..HEAD --count`.
6. If no parent candidate exists (including when the only candidate was a now-merged/closed PR), use the default branch.
7. If the current base already matches the target base, do nothing.
8. Only update the PR description when the target base comes from an open parent PR and `gh pr edit --base` is run.
9. If the current branch has no open PR, discovery can still resolve a draft's base;
   skip mutation and report `no-open-pr` for a correction request.

## Procedure

### 0. Check stack membership

```bash
gh stack view --json 2>/dev/null | jq -r '.currentBranch as $c | .branches[] | select(.name == $c) | .name'
```

If this returns a branch name, stop and report `stack-owned`.

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

Treat an empty successful query as no open PR. Treat query errors as missing evidence.
When drafting a new PR, continue discovery without a current PR.

### 2. Read default branch

```bash
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
```

### 3. Find the nearest open parent PR

Use git ancestry. Inspect open PR candidates and fetch missing commit objects before
comparison. The command below illustrates the distance calculation for an initial
page; expand the candidate query when truncated and include other authors when relevant.
Failed fetches leave unresolved candidates, not evidence that no parent exists.

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
- If this command returns one line, the fourth column is the parent PR URL to add to the description when the base changes.
- Use the default branch only after a successful, complete candidate search finds no
  open ancestor. If distinct candidates tie at the nearest distance, use an explicitly
  supplied parent or established PR relationship; otherwise report the exact ambiguity
  before changing the base.

### 4. Update the PR base if needed

```bash
gh pr edit <number> --base <target-branch>
```

Run this only for an authorized correction when the bases differ and discovery has
resolved all candidates. Inspection and drafting return the target without mutation.

### 5. Update the PR description when the base changed to a parent PR

Only do this when step 3 found a parent PR and step 4 changed the base.

Read the current body:

```bash
gh pr view <number> --json body --jq .body
```

Then update the body so it contains exactly one line in this format:

```text
Base PR: <parent-pr-url>
```

If an existing `Base PR:` line is present, replace it. Otherwise append it on its own line near the end of the body.

Apply the body update with `gh pr edit <number> --body-file <prepared-body-file>`.
If the target base is the default branch, do not add, replace, or remove any `Base PR:` line.

### 6. Report the result

Read back the PR base and body after a mutation. Report:

- current branch
- current PR URL
- previous base
- target base
- whether `gh pr edit --base` was run
- whether the PR description was updated with a base PR link

## Output Template

```text
Current branch: <branch>
Current PR: <url>
Previous base: <old-base>
Target base: <target-base>
Action: changed | unchanged | no-open-pr | stack-owned
Reason: nearest open ancestor PR | no open ancestor PR, so default branch | parent PR merged/closed, so default branch | branch is in a gh stack stack
Description: updated-base-pr-link | unchanged
```

Completion: discovery returns an evidence-backed target or a precise unresolved
relationship; a correction also verifies the requested base and body on readback.
