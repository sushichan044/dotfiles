import { regex } from "arkregex";
import { defineHook } from "cc-hooks-ts";
import { parse as parseIntoArray } from "shell-quote";

function shouldSkip(cmd: string): boolean {
  const tokens = parseIntoArray(cmd).flatMap((token) => (typeof token === "string" ? [token] : []));
  return tokens.includes("--abort") || tokens.includes("--quit");
}

function getTriggerContext(cmd: string): string[] | null {
  const rebasePattern = regex(`^git(\\s+\\S+)*\\s+rebase(\\s+\\S+)*$`);
  if (rebasePattern.test(cmd) && !shouldSkip(cmd)) {
    return [
      "You just ran `git rebase`.",
      "If this branch may already have an open PR, or may now be part of a stacked PR chain, execute the `rebase-pr-base` skill before completing the task.",
      "Use that skill to inspect the current branch PR, possible parent PRs, and whether the PR base branch should change.",
    ];
  }

  if (cmd.includes("gh pr create")) {
    return [
      "You just ran `gh pr create`.",
      "Execute the `rebase-pr-base` skill before completing the task to verify that the new PR targets the correct base branch.",
      "Use that skill to inspect the current PR, possible parent PRs, and whether `gh pr edit --base ...` is needed.",
    ];
  }

  return null;
}

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Bash: true,
    },
  },

  run: (c) => {
    const cmd = c.input.tool_input.command;
    const additionalContext = getTriggerContext(cmd);
    if (!additionalContext) {
      return c.success();
    }

    return c.json({
      event: "PostToolUse",
      output: {
        hookSpecificOutput: {
          additionalContext: additionalContext.join("\n"),
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
