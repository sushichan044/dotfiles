---
name: codex-review
description: Codex CLI を使って、noninteractive に code review を依頼することができます。
---

# Run a code review non-interactively

You can use `codex review` command to request a code review non-interactively using the Codex CLI.
This allows you to get feedback on your code changes without having to engage in an interactive session.

```bash
Usage: codex review [OPTIONS] [PROMPT]

Arguments:
  [PROMPT]
          Custom review instructions. If `-` is used, read from stdin

Options:
      --uncommitted
          Review staged, unstaged, and untracked changes

      --base <BRANCH>
          Review changes against the given base branch

      --enable <FEATURE>
          Enable a feature (repeatable). Equivalent to `-c features.<name>=true`

      --commit <SHA>
          Review the changes introduced by a commit

      --disable <FEATURE>
          Disable a feature (repeatable). Equivalent to `-c features.<name>=false`

      --title <TITLE>
          Optional commit title to display in the review summary

  -h, --help
          Print help (see a summary with '-h')
```
