#!/usr/bin/env -S bun run --silent -i
// @ts-check
/**
 * @fileoverview
 *   Send tips when using web fetch in Claude Code.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { extract, toMarkdown } from "@mizchi/readability";
import { defineHook, runHook } from "cc-hooks-ts";

declare module "cc-hooks-ts" {
  interface ToolSchema {
    mcp__readability__read_url_content_as_markdown: {
      input: {
        url: string;
      };
      response: Array<{
        text: string;
        type: "text";
      }>;
    };
  }
}

const isGitHubIssueLike = (url: URL) => {
  return /\/issues\/[0-9]+/.test(url.pathname);
};

const isGitHubPRLike = (url: URL) => {
  return /\/pulls\/[0-9]+/.test(url.pathname);
};

const hook = defineHook({
  trigger: {
    PreToolUse: {
      mcp__readability__read_url_content_as_markdown: true,
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

    if (urlObj.hostname === "github.com") {
      if (isGitHubIssueLike(urlObj) || isGitHubPRLike(urlObj)) {
        return c.json({
          event: "PreToolUse",
          output: {
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason:
                "Use GitHub CLI for issues and pull requests. Always set --repo explicitly to avoid confusion with forked repositories.",
            },
          },
        });
      }

      return c.success();
    }

    if (c.input.tool_name === "WebFetch") {
      // use markdown fetch instead of WebFetch
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
    }

    return c.success();
  },
});

await runHook(hook);
