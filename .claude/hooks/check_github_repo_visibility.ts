import { defineHook } from "cc-hooks-ts";

declare module "cc-hooks-ts" {
  interface ToolSchema {
    mcp__deepwiki__ask_question: {
      input: {
        question: string;
        repoName: string;
      };
      response: unknown;
    };
    mcp__deepwiki__read_wiki_contents: {
      input: {
        repoName: string;
      };
      response: unknown;
    };
    mcp__deepwiki__read_wiki_structure: {
      input: {
        repoName: string;
      };
      response: unknown;
    };
  }
}

const hook = defineHook({
  trigger: {
    PreToolUse: {
      mcp__deepwiki__ask_question: true,
      mcp__deepwiki__read_wiki_contents: true,
      mcp__deepwiki__read_wiki_structure: true,
    },
  },

  run: async (c) => {
    if (Bun.which("gh") == null) {
      return c.json({
        event: "PreToolUse",
        output: {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason:
              "Cannot check repository visibility since user has not installed GitHub CLI (gh).",
          },
          stopReason:
            "GitHub CLI (gh) is not installed. Please install it to check repository visibility on Claude Code Hooks.",
        },
      });
    }

    const repoName = c.input.tool_input.repoName;
    const repoVisibility =
      await Bun.$`gh repo view ${repoName} --json visibility --jq '.visibility'`.nothrow().quiet(); // stdout will break claude code

    // "PUBLIC\n" -> "public"
    const isPublic = repoVisibility.text().trim().toLowerCase() === "public";
    if (repoVisibility.exitCode === 0 && isPublic) {
      return c.success();
    }

    return c.json({
      event: "PreToolUse",
      output: {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `The GitHub repository "${repoName}" is not public or does not exist.`,
        },
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
