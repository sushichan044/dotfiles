// @ts-check
/**
 * @fileoverview
 *   Send tips when using web fetch in Claude Code.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { extract, toMarkdown } from "@mizchi/readability";
import { regex } from "arkregex";
import { defineHook, runHook } from "cc-hooks-ts";
import { check as isReservedNameByGitHub } from "github-reserved-names";

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

function extractGitHubRepo(
  url: URL,
): { name: string; owner: string; restPaths: string[] } | null {
  const [owner, name, ...rest] = url.pathname
    .split("/")
    .map((part) => decodeURIComponent(part).trim())
    .filter((part) => part.length > 0);
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!owner || !name) return null;
  if (isReservedNameByGitHub(owner)) {
    return null;
  }

  return { name, owner, restPaths: rest };
}

const issueRegex = regex("/(?<type>issues|pull)/(?<number>\\d+)$");
function extractGitHubIssueOrPRNumber(url: URL): {
  number: number;
  type: "issue" | "pr";
} | null {
  const match = issueRegex.exec(url.pathname);
  if (!match?.groups) {
    return null;
  }

  return {
    number: parseInt(match.groups.number, 10),
    type: match.groups.type === "issues" ? "issue" : "pr",
  };
}

function isRawContentURL(url: URL): boolean {
  if (
    // GitHub raw content URLs
    url.hostname === "raw.githubusercontent.com" ||
    url.hostname === "gist.githubusercontent.com"
  ) {
    return true;
  }

  return false;
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

    if (urlObj.hostname === "github.com") {
      const repo = extractGitHubRepo(urlObj);
      if (!repo) {
        return c.success();
      }
      if (repo.restPaths.length === 0) {
        // it's a repository root URL
        return c.json({
          event: "PreToolUse",
          output: {
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason: [
                `Use the GitHub CLI instead.`,
                "Suggested command:",
                "```bash",
                `gh repo view ${repo.owner}/${repo.name}`,
                "```",
              ].join("\n"),
            },
          },
        });
      }

      const issueOrPR = extractGitHubIssueOrPRNumber(urlObj);
      if (issueOrPR) {
        const ghCmd =
          issueOrPR.type === "issue"
            ? `gh issue view ${issueOrPR.number} --repo ${repo.owner}/${repo.name}`
            : `gh pr view ${issueOrPR.number} --repo ${repo.owner}/${repo.name}`;

        return c.json({
          event: "PreToolUse",
          output: {
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason: [
                `Use the GitHub CLI instead.`,
                "Suggested command:",
                "```bash",
                ghCmd,
                "```",
              ].join("\n"),
            },
          },
        });
      }

      return c.success();
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
