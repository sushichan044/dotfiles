// @ts-check
/**
 * @fileoverview
 *   Send tips when using web fetch in Claude Code.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { extract, toMarkdown } from "@mizchi/readability";
import { defineHook } from "cc-hooks-ts";

import { isNonEmptyString } from "../../home/ai/scripts/utils/string";
import { parseGitHubUrlToGhCommand } from "../../tools/github";
import { isRawContentURL } from "../../tools/url";

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

const hook = defineHook({
  trigger: {
    PreToolUse: {
      mcp__readability__read_url_content_as_markdown: true,
      WebFetch: true,
    },
  },

  run: async (c) => {
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

    if (
      c.input.tool_name === "mcp__readability__read_url_content_as_markdown"
    ) {
      return c.success();
    }

    // use markdown fetch instead of WebFetch
    const resp = await fetch(c.input.tool_input.url);
    const html = await resp.text();
    if (!resp.ok) {
      // if not 200, we don't process the HTML
      return c.success();
    }
    if (
      resp.headers.get("Content-Type")?.toLowerCase().includes("text/plain") ===
      true
    ) {
      // if it's plain text, we don't process the HTML
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
            `You should not use web fetch for ${c.input.tool_input.url}.`,
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

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
