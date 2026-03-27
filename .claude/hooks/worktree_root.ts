import { defineHook } from "cc-hooks-ts";

import { detectIfInsideWorktree } from "../../tools/git";
import { isNonEmptyString } from "../../tools/utils/string";

const hook = defineHook({
  trigger: {
    PreToolUse: {
      Edit: true,
      Grep: true,
      Read: true,
      Write: true,
    },
    SessionStart: true,
  },

  run: async (c) => {
    const wt = await detectIfInsideWorktree(c.input.cwd);
    if (!wt.insideLinkedWorktree) {
      return c.success();
    }

    if (c.input.hook_event_name === "SessionStart") {
      return c.json({
        event: "SessionStart",
        output: {
          hookSpecificOutput: {
            additionalContext: [
              `You are currently in a linked git worktree. The root of the worktree is ${wt.worktreeRoot}.`,
              "When using file-related tools (Edit, Read, Write, Grep) or Bash, you can only access files inside the worktree.",
              "This is a security measure to prevent unauthorized access to files outside of the worktree.",
            ].join("\n"),
            hookEventName: "SessionStart",
          },
        },
      });
    }

    if (
      c.input.tool_name === "Edit" ||
      c.input.tool_name === "Write" ||
      c.input.tool_name === "Read"
    ) {
      const path = c.input.tool_input.file_path;
      if (path.startsWith(wt.mainRepoRoot) && !path.startsWith(wt.worktreeRoot)) {
        return c.json({
          event: "PreToolUse",
          output: {
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason: [
                `You are in a linked git worktree (root: ${wt.worktreeRoot}), and the file you are trying to access (${path}) is inside the main repository but outside of your worktree.`,
                "Accessing files in the main worktree or another linked worktree is not allowed.",
              ].join("\n"),
            },
          },
        });
      }
    }

    if (c.input.tool_name === "Grep") {
      const path = c.input.tool_input.path;
      if (!isNonEmptyString(path)) {
        return c.success();
      }

      if (path.startsWith(wt.mainRepoRoot) && !path.startsWith(wt.worktreeRoot)) {
        return c.json({
          event: "PreToolUse",
          output: {
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason: [
                `You are in a linked git worktree (root: ${wt.worktreeRoot}), and the path you are trying to grep (${path}) is inside the main repository but outside of your worktree.`,
                "Accessing files in the main worktree or another linked worktree is not allowed.",
              ].join("\n"),
            },
          },
        });
      }
    }

    return c.success();
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
