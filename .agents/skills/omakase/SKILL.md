---
name: omakase
description: Toggle or inspect Omakase mode for the current worktree.
disable-model-invocation: true
argument-hint: "[on|off|status]"
---

# Omakase Mode

Manage the user's opt-in to autonomous decisions in the current worktree. Enabling
the mode preserves the task's scope and runtime permissions.

## Procedure

1. Resolve the requested action: `on`, `off`, or `status`. With no action, use `status`.
2. Run the bundled script from the target working directory, passing that action.
   Use the directory containing this `SKILL.md` if `CLAUDE_SKILL_DIR` is unavailable.

   ```bash
   "${CLAUDE_SKILL_DIR}/scripts/omakase.sh" status
   ```

3. For `on` or `off`, read back `status` to verify the change. Report the mode and
   worktree path from the output. A failed command is a blocker, not a successful toggle.

Completion: the reported mode is observed for the intended worktree and, for a toggle,
matches the requested state.
