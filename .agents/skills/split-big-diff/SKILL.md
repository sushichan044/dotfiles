---
name: split-big-diff
description: 大きな diff を per logical changes で分割分析し、必要に応じて stacked PR か複数 commit に実行するスキル。PR が大きすぎる、ローカルのブランチ差分が肥大化した、PoC をレビュー可能な単位に崩したい、commit を論理単位に整理したい、diff の分割方法を相談したい、`plan-stacked-pr` から分割粒度の決定を委譲されたときはこのスキルを使う。
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git fetch:*), Bash(git diff:*), Bash(git show:*), Bash(git merge-base:*), Bash(git rev-parse:*), Bash(git rev-list:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git cherry-pick:*), Bash(git restore:*), Bash(git stash:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh pr create:*), Bash(gh repo view:*)
---

# split-big-diff

Analyze a large diff or feature spec, determine how to split it per logical changes, and optionally execute that split as either stacked PRs or a series of commits.

This skill has two phases:

- **Phase 1 (Analysis)** — Determine the split: what logical changes exist, what scope each unit has, and what order/dependency they require. This always runs first.
- **Phase 2 (Execution)** — Materialize the approved plan. The execution target is chosen explicitly:
  - `pr` mode: create stacked branches and draft PRs
  - `commit` mode: create a clean series of commits on the current branch

## When This Skill Applies

- A PR is too large to review effectively and should become stacked PRs
- A local branch has accumulated unrelated or weakly related changes and needs to be broken into logical commits
- A PoC branch needs to be restructured into mergeable, reviewable units
- Someone asks "how should I split this diff?" or "split this branch by logical changes"
- `plan-stacked-pr` delegates split granularity decisions here

## Reference

Read `references/diff-granularity.md` for the authoritative rules on logical change boundaries, dependency ordering, sizing heuristics, and anti-patterns for both PR and commit outputs.

---

## Phase 1: Analysis — Determine the Split

This phase is reusable on its own. When invoked by `plan-stacked-pr`, only this phase runs.

### 1-1. Gather Context

Understand what needs to be split.

**Existing PR:**

```bash
gh pr view <number> --json number,title,url,baseRefName,headRefName,additions,deletions,changedFiles
gh pr diff <number>
```

**Local branch or working tree:**

```bash
git branch --show-current
default_branch=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)
git diff "${default_branch}...HEAD" --stat
git diff "${default_branch}...HEAD"
git status --short
```

**Invoked by another planning skill:**

Use the provided feature description and inspect the codebase only as needed to understand likely boundaries and dependencies.

Before proposing any split, identify:

- What responsibilities are mixed together
- Which parts are foundational versus consuming layers
- Whether the user wants an analysis-only answer or execution
- If execution is requested, whether the desired output is `pr` or `commit`

If the user did not specify an execution target and execution matters, ask one direct question before Phase 2: "Do you want this materialized as stacked PRs or as a series of commits?"

### 1-2. Logical Split (per logical changes)

Split by coherent change intent, not by file count and not by existing commit boundaries.

Ask:

- What is the smallest meaningful unit that tells one story?
- Which changes belong together because a reviewer or future reader would want to reason about them together?
- Which changes are prerequisites for others?
- Which changes are just mechanical fallout and should stay with the logical change that caused them?

Common logical units:

- Schema or migration changes
- Shared contracts, interfaces, types
- Core domain logic
- API or CLI entry points
- UI or presentation changes
- Infrastructure or configuration
- Tests and documentation
- Refactors that should be isolated from behavior changes

Each unit should have one clear purpose. If you cannot explain "what changed and why" in one sentence, the unit is still too broad.

### 1-3. Mechanical Ordering (by dependency)

After finding the logical units, order them by dependency:

1. Schema / migration
2. Shared contracts / types
3. Core logic
4. Consumers such as API, UI, CLI
5. Wiring / configuration / rollout controls
6. Tests / docs when they can stand apart

Within a dependency level, prefer the order that minimizes overlap between adjacent units.

If two units do not depend on each other:

- In `pr` mode, note that they may form a tree instead of a strict linear stack.
- In `commit` mode, still choose a linear order that keeps the history easiest to read.

### 1-4. Validate Against Granularity Guidelines

Check the candidate split against `references/diff-granularity.md`:

- Is each unit independently understandable?
- Is each unit meaningfully reviewable or inspectable?
- Would reverting one unit be conceptually clean?
- Are there anti-patterns such as scattershot grouping, over-splitting, or mixing refactors with behavior changes?

If the diff is already at a reasonable granularity, say so plainly. Not every large-looking diff needs to be split.

### 1-5. Output: Structured Split Plan

Always present the result as a logical change plan, independent of whether it will later become PRs or commits.

Use this structure:

```text
Split Plan:

1. <slug> — <one-line summary>
   Scope: <files or areas covered>
   Why separate: <why this is its own logical change>
   Depends on: <none | previous logical units>
   Output form:
   - pr mode: <branch / PR shape>
   - commit mode: <commit shape>

2. <slug> — <one-line summary>
   ...
```

For direct invocations, end Phase 1 with:

- Whether splitting is recommended
- Recommended execution target (`pr` or `commit`) and why
- Any constraints that may force regrouping during execution

---

## Phase 2: Execution — Materialize the Plan

This phase only runs when there is actual code to split and the user wants execution.

### 2-1. Confirm the Plan

Show the split plan and confirm two things before making changes:

- The logical units are correct
- The execution target is `pr` or `commit`

Do not execute before approval.

### 2-2. Build the Units

Materialize changes in dependency order. Choose the safest extraction method for each unit:

- **Clean existing commits**: use `git cherry-pick` when commit boundaries already match logical changes.
- **Messy history or mixed working tree**: extract by file or hunk, then stage selectively.

Typical primitives:

```bash
git checkout -b <branch-name> <parent-branch>
git checkout <source-ref> -- <path>
git add -p
git add <path>
git commit -m "<message>"
```

Prefer `git add -p` whenever the same file contains changes from multiple logical units.

### 2-3. Execution Path A — `pr` Mode

Use this when the user wants reviewable delivery units.

1. Create branches from the approved topology.
2. Apply each logical unit to its branch.
3. Verify each branch is coherent before moving on.
4. Use `prepare-issue-pr` to draft each PR title/body.
5. Create draft PRs in dependency order.

```bash
gh pr create \
  --draft \
  --base <parent-branch> \
  --head <this-branch> \
  --title "<title>" \
  --body "<body>"
```

The result should preserve the logical change order from Phase 1. After creation, hand ongoing maintenance to `stacked-pr`.

### 2-4. Execution Path B — `commit` Mode

Use this when the user wants a clean branch history without opening multiple PRs.

1. Stay on the working branch unless the user asks for a scratch branch.
2. Stage and commit one logical unit at a time.
3. Write commit messages that describe the logical change, not the extraction mechanic.
4. Verify the resulting sequence tells a coherent story from foundation to consumer.

Preferred commit shape:

```text
1. chore(schema): add notification delivery tables
2. refactor(domain): extract notifier interface
3. feat(api): add notification send endpoint
4. feat(ui): add notification settings screen
```

If the repository has specific commit conventions, follow them. If the user later wants to publish these as PRs, this commit sequence becomes the source material for a future stacked split.

### 2-5. Report the Result

For `pr` mode, report:

- Original source branch or PR
- Each generated branch and PR
- Base relationship for each PR
- Hand-off note to `stacked-pr`

For `commit` mode, report:

- Original source branch
- Final ordered commit list
- Any remaining uncommitted changes
- Whether the branch is now ready for a normal PR or further splitting

---

## Edge Cases

### Changes That Do Not Split Cleanly

When multiple logical changes touch the same file:

- Split by hunk when the sections are truly independent
- Otherwise keep the shared file changes in the earlier foundational unit
- Call out the compromise explicitly in the plan

### Circular Dependencies

If unit A and unit B need each other to make sense, they are one logical change and should stay together.

### Diff Is Small but Messy

Even a small diff may deserve commit cleanup if it mixes unrelated concerns. Focus on logical cohesion, not only size.

### Diff Is Large but Already Well Structured

If existing commits or PR boundaries already align with logical changes, say so. The right answer can be "do not resplit."

### Existing Large PR Should Be Replaced

If a monolithic PR is being replaced by stacked PRs, suggest closing the original PR with links to the new stack. Do not close it automatically.

## Boundaries

- Phase 1 is analysis-only and side-effect free.
- Phase 2 requires user approval and an explicit execution target.
- This skill decides the split per logical changes; it does not guess whether the user prefers PRs or commits when that choice matters.
- In `pr` mode, `stacked-pr` takes over after creation for stack maintenance.
- In `commit` mode, this skill stops once the history is clean and reported.
