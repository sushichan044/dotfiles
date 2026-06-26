import { defineHook } from "cc-hooks-ts";

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Bash: true,
    },
  },

  run: (c) => {
    const op = c.input.tool_response.gitOperation;

    if (op?.branch?.action === "rebased") {
      return c.json({
        event: "PostToolUse",
        output: {
          hookSpecificOutput: {
            additionalContext: [
              "You just ran `git rebase`.",
              "Execute the `adjust-pr-base` skill to adjust the PR base branch.",
            ].join("\n"),
            hookEventName: "PostToolUse",
          },
        },
      });
    }

    if (op?.pr?.action === "created") {
      return c.json({
        event: "PostToolUse",
        output: {
          hookSpecificOutput: {
            additionalContext: [
              "You just created a pull request. Do following steps to ensure the PR is properly set up:",
              "1. Execute `reorganize-diff` skill, tidy commit size, and force push if necessary.",
              "2. Execute the `adjust-pr-base` skill to adjust the PR base branch.",
            ].join("\n"),
            hookEventName: "PostToolUse",
          },
        },
      });
    }

    return c.success();
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
