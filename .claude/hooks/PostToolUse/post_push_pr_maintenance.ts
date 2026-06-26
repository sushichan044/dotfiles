import { defineHook } from "cc-hooks-ts";

import { getPRNumberOfCurrentBranch } from "../../../tools/github";

export function buildPushTriggerContext(prNumber: number | null): string | null {
  if (prNumber == null) {
    return null;
  }

  return [
    `Pull request #${prNumber} exists for the current branch you just pushed.`,
    "Execute following steps to ensure the PR is properly set up:",
    "1. Review whether the PR title, description, and metadata still match the latest branch state. If updates are needed, edit the PR.",
    "2. Execute the `watch-ci` skill to monitor CI and automatically fix any failures.",
  ].join("\n");
}

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Bash: true,
    },
  },

  run: async (c) => {
    const op = c.input.tool_response.gitOperation;
    if (!op?.push) {
      return c.success();
    }

    const additionalContext = buildPushTriggerContext(
      await getPRNumberOfCurrentBranch(c.input.cwd),
    );
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
