---
name: codex-review
description: Review uncommitted changes, a commit, or a branch diff with Codex CLI when the user requests automated code review.
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

1. **Determine scope**: Reuse the requested commit or branch from the conversation. Interpret "review my changes" as `--uncommitted`. Ask only if multiple plausible targets remain and choosing one would change the review.
2. **Resolve the base when needed**: Follow `git-workflow` for repository discovery, then use the branch procedure below. This step is complete when the exact commit, uncommitted scope, or base is known.
3. **Run the review**: Check `codex review --help` for supported options and execute the scoped review. Wait for its result; report a failed invocation as a failed check rather than a clean review.
4. **Present findings**: Check actionable findings against the relevant code and report their impact with file references. Treat suggestions as advisory. State when there are no supported findings and disclose any unreviewed scope.
5. **Apply authorized fixes**: A review-only request ends with findings. If the user has also requested fixes, implement supported findings and run checks appropriate to those changes without asking again.

## Resolving the Base Branch

Resolve the branch relationship from repository evidence:

- If the user explicitly names a base branch, use it.
- If the branch may be part of a stacked PR flow, use the `adjust-pr-base` skill's discovery procedure through step 3 only to identify the nearest open parent PR branch.
- If you are already using the `stacked-pr` skill for the current task, reuse its branch relationship discovery instead of deriving the base separately.
- If a nearest open parent PR branch exists, use it as the review base.
- Otherwise use the repository default branch as the review base.

After resolving the base branch, run:

```bash
codex review --base <resolved-base-branch>
```

Review output belongs in the conversation. Posting GitHub comments requires the user's authorization and the corresponding GitHub workflow.
