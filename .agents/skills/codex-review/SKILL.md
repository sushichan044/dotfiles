---
name: codex-review
description: Run automated code review using Codex CLI. Use when the user wants an automated code review of uncommitted changes, a specific commit, or changes against a base branch. This skill runs `codex review` non-interactively and returns structured feedback — it does not post comments on PRs or interact with GitHub.
allowed-tools: Bash(codex review:*)
---

<!--
Example prompts:
  /codex-review Review my uncommitted changes
  /codex-review Review changes against the correct base branch
  /codex-review Review the last commit
-->

You are a code review coordinator. When invoked, run a code review using the bundled Codex CLI binary.

## How to Review

Use `codex review` with the appropriate flags:

### Review uncommitted changes (staged, unstaged, and untracked)

```bash
codex review --uncommitted
```

### Review changes against a base branch

```bash
codex review --base <resolved-base-branch>
```

### Review a specific commit

```bash
codex review --commit <SHA>
```

### Review with custom instructions

`[PROMPT]` is a positional argument that **cannot** be combined with `--uncommitted`, `--base`, or `--commit`. Use it alone for a free-form review prompt:

```bash
codex review "Focus on error handling and edge cases"
```

## Workflow

1. **Determine scope**: Ask the user what they want reviewed if not clear — uncommitted changes, a branch diff, or a specific commit.
2. **Resolve the base branch when needed**: For branch diff reviews, determine the correct base branch before running `codex review --base`.
3. **Run the review**: Execute `codex review` with the appropriate flags.
4. **Present findings**: Share the review output with the user. Highlight critical issues separately from suggestions.
5. **Discuss**: If the user wants to act on specific feedback, help them implement the changes.

## Resolving the Base Branch

When reviewing a branch diff, do not assume the base branch is `main`.

- If the user explicitly names a base branch, use it.
- If the branch may be part of a stacked PR flow, use the `adjust-pr-base` skill's discovery procedure through step 3 only to identify the nearest open parent PR branch.
- If you are already using the `stacked-pr` skill for the current task, reuse its branch relationship discovery instead of deriving the base separately.
- If a nearest open parent PR branch exists, use it as the review base.
- Otherwise use the repository default branch as the review base.

After resolving the base branch, run:

```bash
codex review --base <resolved-base-branch>
```

## Important Guidelines

- Default to `--uncommitted` when the user says "review my changes" without further detail
- For branch diff reviews, resolve the correct base branch first instead of assuming `main`
- In a stacked PR workflow, prefer the nearest open parent PR branch as the review base
- The review runs non-interactively and returns structured feedback
- Treat the review as advisory — not all suggestions need to be applied

## Help

!`codex review --help`
