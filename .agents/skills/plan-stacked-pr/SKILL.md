---
name: plan-stacked-pr
description: 大きな機能開発を stacked PR で進めるための計画を立案するスキル。Design doc やPlan から、各 PR の scope・What solves Why・Goal/Acceptance Criteria を定義した計画ドキュメント群を生成する。大きな機能を stacked PR で開発したい、feature 開発の PR 分割計画を立てたい、design doc から実装計画を作りたいときに使う。
allowed-tools: Read, Grep, Glob, Edit, MultiEdit, Bash(git status:*), Bash(git branch:*), Bash(git log:*), Bash(git diff:*), Bash(gh pr list:*), Bash(gh pr view:*), Bash(gh repo view:*)
---

# plan-stacked-pr

Create a structured plan for developing a large feature using stacked PRs. The plan defines the scope, rationale, and acceptance criteria for each PR — without prescribing implementation details.

## When This Skill Applies

- Planning a large feature that should be developed as stacked PRs
- Breaking down a design doc or feature spec into an ordered set of PRs
- Want a clear plan before starting stacked PR development
- Need to communicate a multi-PR development plan to a team

## Core Idea

Planning a stacked PR workflow has two distinct phases: drawing the big picture, then determining the split granularity. This skill handles the big picture — understanding the feature, identifying major areas and their dependencies, and producing plan documents. The actual PR split granularity (how many PRs, what goes where) is determined by the `split-big-pr` skill, which owns the splitting criteria and PR sizing guidelines.

The output is a set of markdown files that serve as the working document throughout development. Each file contains explicit instructions to use the `stacked-pr` skill during implementation.

## Procedure

### 1. Understand the Feature

Gather context about what needs to be built:

- Read the design doc, feature spec, or plan provided by the user
- Explore the current codebase to understand what exists and what needs to change
- Identify the scope boundaries — what's in and what's out

```bash
# Understand the repo structure
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
git --no-pager log --oneline -20
```

Ask the user clarifying questions if the scope or requirements are ambiguous. Focus on understanding the feature well enough to identify the major areas of work and their dependencies.

### 2. Draw the Big Picture

Identify the major areas of work and their dependency relationships. Think at the level of responsibilities and components, not individual PRs:

- What are the major areas this feature touches? (data layer, domain logic, API, UI, infra, etc.)
- What are the dependencies between these areas? (schema must exist before code that uses it, etc.)
- What is the overall delivery strategy? (incremental rollout, feature flag, big-bang, etc.)

Present this as a high-level overview to the user. This is the "what needs to happen" without yet deciding "how to slice the PRs."

### 3. Determine Split Granularity

Use the `split-big-pr` skill's **Phase 1 (Analysis)** to determine the actual PR boundaries. That skill owns the PR granularity guidelines (`references/pr-granularity.md` in its directory) and the splitting procedure — it decides how many PRs, what goes in each, and in what order.

Provide it with the big picture from Step 2: the major areas, their dependencies, and the delivery strategy. If there is existing code (a branch or diff), point it at that too.

Phase 1 returns a structured split plan — a list of PRs with their scopes, dependency order, and rationale. For each PR, capture:

- **Scope** — exactly what changes this PR covers
- **What solves Why** — what problem this PR solves and why it needs to be a separate PR
- **Goal / Acceptance Criteria** — concrete conditions for this PR to be considered complete

Do not go deeper into "how" — implementation details are left to the developer working on each PR.

### 4. Determine Output Location

Ask the user where to place the plan files. Propose a sensible default:

- For repository-level plans: `docs/plans/<topic>/` or `.plans/<topic>/`
- For session-level plans: within the session workspace

The `<topic>` directory name should be a short, descriptive slug (e.g., `user-auth`, `payment-v2`, `api-redesign`).

### 5. Generate the Plan Documents

Create the following structure:

```
<topic>/
├── overview.md
└── plans/
    ├── 01-<slug>.md
    ├── 02-<slug>.md
    ├── 03-<slug>.md
    └── ...
```

#### overview.md

The overview serves as the entry point for the entire plan.

```markdown
# <Feature Name> — Stacked PR Plan

## Background

<Brief description of the feature and why it's being built>

## References

- [Design Doc](url) — <one-line description>
- <other relevant links>

## Stack Structure

<Dependency tree showing the PR order>
```

main
├─ 01-<slug> — <one-line summary>
│ └─ 02-<slug> — <one-line summary>
├─ 03-<slug> — <one-line summary>
└─ ...

```

## PR Plans

| # | Plan | Summary |
|---|------|---------|
| 1 | [01-<slug>](plans/01-<slug>.md) | <one-line summary> |
| 2 | [02-<slug>](plans/02-<slug>.md) | <one-line summary> |
| ... | ... | ... |

## Workflow

This feature is developed using stacked PRs. Each PR plan below is designed
to be worked on using the `stacked-pr` skill for branch creation, cascade
rebase, CI monitoring, and stack synchronization.

When starting work on any PR in this plan:
1. Use the `prepare-issue-pr` skill to draft the PR with correct base branch and template compliance
2. Use the `stacked-pr` skill for managing the PR stack lifecycle
```

#### Individual PR Plan (plans/NN-slug.md)

Each PR plan follows a consistent template:

```markdown
# PR <N>: <Title>

> Part of [<Feature Name> Stacked PR Plan](../overview.md)

## Scope

<Clear definition of what this PR covers and what it does NOT cover>

## What Solves Why

<What problem does this PR solve, and why does it need to be a separate PR
in the stack? What value does shipping this independently provide?>

## Goal / Acceptance Criteria

- [ ] <Concrete, verifiable condition 1>
- [ ] <Concrete, verifiable condition 2>
- [ ] <Concrete, verifiable condition 3>

## Dependencies

- **Parent:** <parent PR reference or "main">
- **Children:** <child PR references or "none">

## Stack Management

This PR is part of a stacked PR workflow.

- Use the `prepare-issue-pr` skill when creating this PR to draft the title, body, and base branch
- Use the `stacked-pr` skill for cascade rebase, CI monitoring, and stack sync
- Use the `split-big-pr` skill if this PR itself grows too large and needs further splitting
- Base branch: `<parent-branch-name>`

When implementing this PR:

1. Use `prepare-issue-pr` to draft the PR title/body with correct base branch and template compliance
2. Use `stacked-pr` to manage the branch lifecycle and coordinate with other PRs in the stack
```

### 6. Present and Iterate

Show the user the generated plan:

- Present the overview first (the stack structure and PR summary table)
- Highlight any decisions you made about scope boundaries
- Note any areas where you're uncertain about the split

Wait for the user's feedback. Common adjustments:

- Merging two PRs that are too small
- Splitting a PR that covers too much
- Reordering PRs based on priority or risk
- Adjusting scope boundaries

Update the plan documents based on feedback. Iterate until the user is satisfied.

## Edge Cases

### Feature Too Small for Stacking

If the feature analysis shows it can be done in 1–2 reasonably-sized PRs, say so. Not every feature needs a stacked PR plan. Suggest just using the regular PR workflow.

### Unclear Dependencies

When the dependency order between two PR groups is ambiguous, note both options in the plan and ask the user. Often the "right" order depends on deployment strategy or team preferences that the codebase alone doesn't reveal.

### Evolving Plans

Plans are living documents. When the user discovers during implementation that the plan needs adjustment, the plan files should be updated. The `stacked-pr` skill handles the git/PR mechanics of any reordering.

### Existing Partial Implementation

If some of the work is already done (e.g., a branch exists with partial changes), account for it in the plan. The first PR(s) might cover "what's already built" and the remaining PRs cover "what's left."

## Boundaries

- This skill produces **plan documents only** — it does not create branches or PRs.
- Split granularity decisions are delegated to `split-big-pr` Phase 1. This skill does not own PR sizing guidelines.
- For executing the split (creating branches and PRs from an existing diff), use `split-big-pr` Phase 2.
- For ongoing stack maintenance (rebase, CI, sync), use the `stacked-pr` skill.
- The plan stays at the "what and why" level. Implementation details ("how") are out of scope.
- The `<topic>` directory location is determined in consultation with the user, not prescribed by this skill.
