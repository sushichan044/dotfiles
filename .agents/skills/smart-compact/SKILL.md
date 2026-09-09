---
name: smart-compact
description: Prepare a Japanese /compact prompt that preserves the session's active work and decisions.
disable-model-invocation: true
# source: https://github.com/ushironoko/dotfiles/blob/ba039f51da9a59b0917f14560e90f0d248ce704d/claude/.claude/skills/smart-compact/SKILL.md
---

# Smart Compact

Prepare a copyable `/compact` command for continuing the current task. The user executes the host application's command; producing the prompt needs no additional approval.

## Workflow

1. Read the available conversation and identify the active objective, accepted corrections, completed work, remaining work, and blockers. Preserve the original objective when recent messages merely steer it.
2. Collect the decisions and evidence needed to resume: changed files and their purposes, relevant symbols and errors, verification results, constraints, and existing authorization. Distinguish observed results from plans or assumptions. This step ends when each remaining task has enough context for another agent to take its next action.
3. Reuse any retention preferences already stated by the user. Otherwise prioritize active work and unresolved decisions. Ask one focused question only when a missing preference would materially change which context is retained; continue assembling the known context while waiting.
4. Generate the prompt in Japanese, using concrete paths, names, commands, and decision reasons where needed. Describe what to preserve with positive instructions. Keep information proportional to its value for resuming work.
5. Return the copyable command. Completion means the prompt accounts for the active task, its current state, and its next action. Describe it as prepared, not executed.

## Output

Use this shape, filling only applicable items:

```text
/compact 以下の情報を保持してコンテキストを圧縮してください：

1. 現在の目的と、ユーザーが追加した修正・制約。
2. 完了した作業と確認結果、変更したファイルとその目的。
3. 採用した判断と理由、すでに得ている作業の承認。
4. 残作業、未解決の問題、次に実行する具体的な作業。

以下は正確に保持してください：
- <継続に必要なパス、シンボル、コマンド、エラー>
```

For a short session, briefly explain that compression is unlikely to help and still provide the requested command. When no task context needs preservation, provide `/compact` without an argument. Apply requested revisions directly and return the updated command. If the user cancels, stop.
