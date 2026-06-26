import { defineHook } from "cc-hooks-ts";

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Bash: true,
    },
  },

  run: (c) => {
    const op = c.input.tool_response.gitOperation;
    if (!op) {
      return c.success();
    }

    if (op.pr?.action === "created" || op.pr?.action === "edited") {
      return c.json({
        event: "PostToolUse",
        output: {
          hookSpecificOutput: {
            additionalContext: [
              "You just created or edited a pull request.",
              "Execute the `prepare-issue-pr` skill to tidy up the PR title, body, and metadata.",
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
