// @ts-check
/**
 * @fileoverview
 *   Send tips when using web fetch in Claude Code.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { defineHook } from "cc-hooks-ts";

import { parseGitHubUrlToGhCommand } from "../../tools/github";
import { isRawContentURL } from "../../tools/url";
import { isNonEmptyString } from "../../tools/utils/string";

const hook = defineHook({
  trigger: {
    PreToolUse: {
      WebFetch: true,
    },
  },

  run: (c) => {
    const urlObj = new URL(c.input.tool_input.url);
    if (isRawContentURL(urlObj)) {
      return c.success();
    }

    if (urlObj.hostname.includes("notion.so")) {
      return c.json({
        event: "PreToolUse",
        output: {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason:
              "Use mcp__notion__fetch instead of web fetch for Notion URLs.",
          },
        },
      });
    }

    const ghResult = parseGitHubUrlToGhCommand(urlObj);
    if (ghResult) {
      return c.json({
        event: "PreToolUse",
        output: {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: [
              "Use the GitHub CLI instead.",
              "Suggested command:",
              "```bash",
              ghResult.command,
              "```",
              ...(isNonEmptyString(ghResult.additionalInformation)
                ? ["Additional information:", ghResult.additionalInformation]
                : []),
            ].join("\n"),
          },
        },
      });
    }

    return c.success();
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
