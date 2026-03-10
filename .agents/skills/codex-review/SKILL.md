---
name: codex-review
description: Codex CLI を使って、noninteractive に code review を依頼し、その結果をもとに next action を考えましょう。
allowed-tools: Bash(codex review:*)
---

# Run a code review non-interactively and decide next steps based on the review results

## 1. Execute code review

You can use `codex review -c model_reasoning_effort="high" -c sandbox_mode="read-only"` command to request a code review non-interactively using the Codex CLI.
This allows you to get feedback on your code changes without having to engage in an interactive session.

Detailed Usage:

```bash
Usage: codex review [OPTIONS] [PROMPT]

Arguments:
  [PROMPT]
          Custom review instructions. If `-` is used, read from stdin

Options:
  -c, --config <key=value>
          Override a configuration value that would otherwise be loaded from `~/.codex/config.toml`. Use a dotted path (`foo.bar.baz`) to override nested values. The `value` portion is parsed as TOML. If it fails to parse as TOML, the raw string is used as a literal.

          Examples: - `-c model="o3"` - `-c 'sandbox_permissions=["disk-full-read-access"]'` - `-c shell_environment_policy.inherit=all`

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

## 2. Analyze review results

After executing the code review command, you will receive feedback on your code changes.
Analyze the review results to identify any issues or areas for improvement in your code.
