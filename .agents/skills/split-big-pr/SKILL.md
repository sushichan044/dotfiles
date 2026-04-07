---
name: split-big-pr
description: 大きな PR やブランチの分割分析と実行を行うスキル。差分を論理的に分割し、機械的制約で順序付けし、stacked draft PR を作成する。PR が大きすぎる、PoC を分割したい、diff の分割方法を相談したい、plan-stacked-pr から分割粒度の決定を委譲されたときに使う。
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git fetch:*), Bash(git diff:*), Bash(git show:*), Bash(git merge-base:*), Bash(git rev-parse:*), Bash(git rev-list:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git cherry-pick:*), Bash(git restore:*), Bash(git stash:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh pr create:*), Bash(gh repo view:*)
---

# split-big-pr

Analyze a large diff or feature spec, determine how to split it into stacked PRs, and optionally execute the split.

This skill has two phases that can be used independently:

- **Phase 1 (Analysis)** — Determine the split: what PRs, what scope, what order. Always runs. Reusable by other skills (e.g., `plan-stacked-pr` invokes only this phase).
- **Phase 2 (Execution)** — Create branches and draft PRs from the split plan. Only runs when there is actual code to split and the user wants execution.

## When This Skill Applies

- A PR is too large to review effectively and needs splitting
- A PoC branch has grown and needs restructuring into mergeable units
- A local branch has accumulated changes that should be released incrementally
- `plan-stacked-pr` delegates split granularity decisions here
- Someone asks "how should I split this?" (Phase 1 only) or "split this up" (Phase 1 + 2)

## Reference

Read `references/pr-granularity.md` (in this skill's directory) for detailed guidelines on PR sizing, splitting strategy, and anti-patterns. This is the authoritative reference for split decisions.

---

## Phase 1: Analysis — Determine the Split

This phase is independently reusable. When invoked by `plan-stacked-pr`, only this phase runs. The output is a structured split plan that other skills or the user can consume.

### 1-1. Gather Context

Understand what needs to be split. The input varies depending on who is calling:

**Direct invocation with existing PR:**

```bash
gh pr view <number> --json number,title,url,baseRefName,headRefName,additions,deletions,changedFiles
gh pr diff <number>
```

**Direct invocation with local branch:**

```bash
git branch --show-current
default_branch=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)
git diff "${default_branch}...HEAD" --stat
git diff "${default_branch}...HEAD"
```

**Invoked by `plan-stacked-pr`:**

The caller provides a big-picture description of the feature's major areas and dependencies. There may or may not be existing code — use the description and codebase exploration to inform the split.

Read through the available information to understand the full scope. Note which areas are related, what responsibilities are involved, and where the natural boundaries are.

### 1-2. Logical Split (by responsibility)

Group changes by what they do. Ask:

- Which changes form a cohesive unit of work?
- Which changes can be understood and reviewed independently?
- Which changes would a reviewer want to see together?

Common logical boundaries:

- Schema / migration changes
- Type definitions, interfaces, contracts
- Core business logic
- API handlers / endpoints
- UI components
- Configuration / infrastructure
- Tests

Each group becomes a candidate PR. A group should be cohesive — removing it from the stack should leave the other groups conceptually intact.

### 1-3. Mechanical Ordering (by dependency)

Arrange the groups based on technical constraints:

1. Schema / migration changes (must exist before code that references new schema)
2. Shared types / interfaces (must exist before implementations)
3. Core logic (must exist before consumers)
4. Consumers (API, UI, CLI)
5. Integration / wiring / configuration
6. Tests / documentation

Within the same dependency level, prefer the ordering that minimizes the delta between adjacent PRs.

If some groups are independent of each other (no dependency between them), note that they can branch from the same parent — the stack can be a tree, not just a line.

### 1-4. Validate Against Granularity Guidelines

Check the proposed split against `references/pr-granularity.md`:

- Is each PR independently meaningful and reviewable?
- Are the sizing heuristics reasonable?
- Is the topology (linear vs tree) appropriate?
- Are there any anti-patterns (mega PR, scatter PR, premature split)?

If the diff is actually a reasonable size, say so. Not every large-looking PR needs splitting.

### 1-5. Output: Structured Split Plan

The output of Phase 1 is a structured split plan. Present it as:

```
Split Plan:

main
├─ 1. <branch-name> — <one-line summary>
│    Scope: <what files/changes this PR covers>
│    Why separate: <why this needs to be its own PR>
│
├─ 2. <branch-name> — <one-line summary>
│    Base: <parent-branch>
│    Scope: <what files/changes>
│    Why separate: <rationale>
│
└─ ...
```

This output is consumed differently depending on the caller:

- **Direct invocation:** Proceed to Phase 2 after user approval
- **`plan-stacked-pr`:** Returns this plan for the caller to generate plan documents from

---

## Phase 2: Execution — Create Branches and PRs

This phase only runs when there is actual code to split (an existing PR or local branch). It takes the approved split plan from Phase 1 and creates the stacked PRs.

### 2-1. Confirm the Plan

Show the split plan from Phase 1 and wait for user approval. Use an interactive question tool when available.

### 2-2. Create Branches

Create branches and apply changes in dependency order.

**Branch naming:** Use a consistent prefix derived from the original branch or feature name. If the original branch is `feat/big-feature`, name the split branches `feat/big-feature-schema`, `feat/big-feature-core`, etc.

**Applying changes:** Choose the approach based on the commit history:

- **Clean commit history:** If commits map to the logical groups, use `git cherry-pick`.
- **Messy commit history:** Use file-level operations:
  1. Start each branch from its parent
  2. Check out relevant files: `git checkout <original-branch> -- <file1> <file2> ...`
  3. Stage, review, and commit

```bash
# Create branch from parent
git checkout -b <branch-name> <parent-branch>

# Apply changes
git cherry-pick <commit1> <commit2> ...
# or
git checkout <original-branch> -- <file1> <file2> ...
git add -A
git commit -m "<descriptive message>"

# Push
git push -u origin <branch-name>
```

Verify each branch builds before proceeding. If a branch fails to build, adjust the split — some files may need to move to an earlier PR.

### 2-3. Create Draft PRs

Create draft PRs in dependency order, each targeting its parent branch.

Use the `prepare-issue-pr` skill to draft each PR's title and body. Provide it with:

- The PR's scope and purpose from the split plan
- Its position in the stack (e.g., "Part 2/4 of feature X")
- The parent PR URL for cross-linking

```bash
gh pr create \
  --draft \
  --base <parent-branch> \
  --head <this-branch> \
  --title "<title>" \
  --body "<body>"
```

### 2-4. Report and Hand Off

Report the result and hand off to `stacked-pr`:

```
## Split Complete

Original: <original branch/PR>

| # | Branch | PR | Base | Status |
|---|--------|----|------|--------|
| 1 | feat/... | #201 | main | ✅ draft created |
| 2 | feat/... | #202 | feat/... | ✅ draft created |
| ... | ... | ... | ... | ... |

Next steps:
- Review each PR and mark ready when appropriate
- Use the `stacked-pr` skill for cascade rebase, CI monitoring, and stack sync
```

---

## Edge Cases

### Changes That Don't Split Cleanly

Some changes touch the same file across multiple logical groups. In these cases:

- Split file changes if modifications are in distinct, non-overlapping sections
- If changes are interleaved, keep them in the earlier PR (closer to the dependency root)
- Note this in the plan so the user can decide

### Circular Dependencies

If group A needs something from group B and vice versa, they belong in the same PR. Merge the groups and note why.

### The Diff Is Too Small to Split

If analysis shows the PR is a reasonable size per `pr-granularity.md`, say so and explain why it's fine as-is.

### Original PR Should Be Closed

If the original change existed as a single large PR, suggest closing it with a comment linking to the new stacked PRs. Don't close automatically.

## Boundaries

- **Phase 1** is a pure analysis step — it produces a split plan without side effects. It can be invoked by other skills.
- **Phase 2** creates branches and draft PRs. It requires actual code (an existing diff) and user approval.
- After Phase 2, the `stacked-pr` skill takes over for cascade rebase, CI monitoring/fixing, and stack sync.
- This skill does not force a specific commit message format — it follows repository conventions.
- If the user wants planning-only output (markdown plan documents), use `plan-stacked-pr` which invokes this skill's Phase 1 internally.
