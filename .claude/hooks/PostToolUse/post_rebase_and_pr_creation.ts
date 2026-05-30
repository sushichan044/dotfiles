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
              "If you are not already executing a multi-step workflow that covers PR base verification, execute the `adjust-pr-base` skill before completing the task.",
              "Use that skill to inspect the current branch PR, possible parent PRs, and whether the PR base branch should change.",
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
              "You just created a pull request.",
              "If you are not already executing a multi-step workflow that covers post-PR-creation steps, do the following before completing the task:",
              "1. Execute `reorganize-diff` to organize your commits if not already done.",
              "2. Execute the `adjust-pr-base` skill to inspect the current PR, possible parent PRs, and whether `gh pr edit --base ...` is needed.",
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
