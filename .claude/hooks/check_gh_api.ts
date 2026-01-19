/**
 * Hook to validate gh api commands
 * Allows safe read-only GitHub API operations
 */

import { defineHook } from "cc-hooks-ts";

import { parseGhApiCommand } from "../../tools/github";

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

    // Delegate permission decision to user for GraphQL
    if (gh.type === "graphql") {
      return c.json({
        event: "PreToolUse",
        output: {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "ask",
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
          permissionDecision: "deny",
          permissionDecisionReason: `Blocked mutating ${gh.method} operation to "${pathname}"`,
        },
      },
    });
  },
});

export default hook;
