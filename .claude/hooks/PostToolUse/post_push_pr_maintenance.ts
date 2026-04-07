import { regex } from "arkregex";
import { defineHook } from "cc-hooks-ts";

import { getPRNumberOfCurrentBranch } from "../../../tools/github";

export function isGitPushCommand(cmd: string): boolean {
  const pattern = regex(`^git(\\s+\\S+)*\\s+push(\\s+\\S+)*$`);
  return pattern.test(cmd.trim());
}

export function buildPushTriggerContext(prNumber: number | null): string | null {
  if (prNumber == null) {
    return null;
  }

  return [
    `Pull request #${prNumber} exists for the current branch you just pushed.`,
    "Review whether the PR title, description, and metadata still match the latest branch state.",
    "If updates are needed, edit the PR before completing the task.",
  ].join("\n");
}

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Bash: true,
    },
  },

  run: async (c) => {
    const cmd = c.input.tool_input.command;
    if (!isGitPushCommand(cmd)) {
      return c.success();
    }

    const additionalContext = buildPushTriggerContext(await getPRNumberOfCurrentBranch(c.input.cwd));
    if (additionalContext == null) {
      return c.success();
    }

    return c.json({
      event: "PostToolUse",
      output: {
        hookSpecificOutput: {
          additionalContext,
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
