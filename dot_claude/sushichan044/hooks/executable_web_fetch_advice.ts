#!/usr/bin/env -S bun run --silent
// @ts-check
/**
 * @fileoverview
 *   Send tips when using web fetch in Claude Code.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { extract, toMarkdown } from "@mizchi/readability";
import { defineHook, runHook } from "cc-hooks-ts";

const hook = defineHook({
  trigger: {
    PreToolUse: {
      WebFetch: true,
    },
  },

  run: async (c) => {
    const urlObj = new URL(c.input.tool_input.url);

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

    const resp = await fetch(c.input.tool_input.url);
    const html = await resp.text();
    if (!resp.ok) {
      // if not 200, we don't process the HTML
      return c.success();
    }

    const content = extract(html);
    const markdown = toMarkdown(content.root);

    return c.json({
      event: "PreToolUse",
      output: {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: [
            "You should not use web fetch for this URL.",
            "Here is the markdown content I fetched from the page:",
            "```markdown",
            markdown,
            "```",
          ].join("\n"),
        },
        suppressOutput: true,
      },
    });
  },
});

await runHook(hook);
