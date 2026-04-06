import { regex } from "arkregex";
import { defineHook } from "cc-hooks-ts";
import { parse as parseIntoArray } from "shell-quote";

function isGitRebaseCommand(cmd: string): boolean {
  const pattern = regex(`^git(\\s+\\S+)*\\s+rebase(\\s+\\S+)*$`);
  return pattern.test(cmd);
}

function shouldSkip(cmd: string): boolean {
  const tokens = parseIntoArray(cmd).flatMap((token) => (typeof token === "string" ? [token] : []));
  return tokens.includes("--abort") || tokens.includes("--quit");
}

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Bash: true,
    },
  },

  run: (c) => {
    const cmd = c.input.tool_input.command;
    if (!isGitRebaseCommand(cmd) || shouldSkip(cmd)) {
      return c.success();
    }

    return c.json({
      event: "PostToolUse",
      output: {
        hookSpecificOutput: {
          additionalContext: [
            "You just ran `git rebase`.",
            "If this branch may already have an open PR, or may now be part of a stacked PR chain, execute the `rebase-pr-base` skill before completing the task.",
            "Use that skill to inspect the current branch PR, possible parent PRs, and whether the PR base branch should change.",
          ].join("\n"),
          hookEventName: "PostToolUse",
        },
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
