#!/usr/bin/env -S deno run --allow-env
// @ts-check
/**
 * @fileoverview
 *   Send tips when using web fetch in Claude Code.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { defineHook } from "../../../../ai/scripts/claude-code-hooks/define.ts";
import { runHook } from "../../../../ai/scripts/claude-code-hooks/run.ts";

const hook = defineHook({
  trigger: {
    PreToolUse: {
      WebFetch: true,
    },
  },
  run: (c) => {
    const urlObj = new URL(c.input.tool_input.url);

    if (urlObj.hostname.includes("notion.so")) {
      return c.blockingError({
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          "Use mcp__notion__fetch instead of web fetch for Notion URLs.",
      });
    }

    // tips: in github.com, .application-main class has main content

    return c.success();
  },
});

await runHook(hook);
