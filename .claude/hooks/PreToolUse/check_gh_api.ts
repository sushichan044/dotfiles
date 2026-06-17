/** Hook to validate gh api commands Allows safe read-only GitHub API operations */

import { defineHook } from "cc-hooks-ts";

import { parseGhApiCommand } from "../../../tools/github";

const hook = defineHook({
  trigger: {
    PreToolUse: {
      Bash: true,
    },
  },

  run: (c) => {
    const command = c.input.tool_input.command.trim();

    const gh = parseGhApiCommand(command);
    if (gh == null) {
      return c.success();
    }

    if (gh.type === "graphql") {
      if (gh.operationType === "query") {
        return c.json({
          event: "PreToolUse",
          output: {
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "allow",
              permissionDecisionReason: "Read-only GraphQL query operation",
            },
          },
        });
      }

      const reason =
        gh.operationType === "mutation"
          ? "GraphQL mutation operation requires user approval"
          : "Unable to determine GraphQL operation type (not inline), requires user approval";
      return c.json({
        event: "PreToolUse",
        output: {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "ask",
            permissionDecisionReason: reason,
          },
        },
      });
    }

    const pathname = gh.pathComponents.join("/").toLowerCase();
    // Auto approve read-only operations
    if (["GET", "HEAD", "OPTIONS"].includes(gh.method)) {
      return c.json({
        event: "PreToolUse",
        output: {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "allow",
            permissionDecisionReason: `Read-only GET operation to "${pathname}"`,
          },
        },
      });
    }

    // Prevent mutating operations
    return c.json({
      event: "PreToolUse",
      output: {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason: `Mutating ${gh.method} operation to "${pathname}" requires user approval.`,
        },
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
