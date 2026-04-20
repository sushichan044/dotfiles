import { defineHook } from "cc-hooks-ts";

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Bash: true,
    },
  },

  run: (c) => {
    const cmd = c.input.tool_input.command;
    if (!cmd.includes("gh pr create") && !cmd.includes("gh pr edit")) {
      return c.success();
    }

    return c.json({
      event: "PostToolUse",
      output: {
        hookSpecificOutput: {
          additionalContext: [
            "You just created or edited a pull request.",
            "Execute the `prepare-issue-pr` skill to tidy up the PR title, body, and metadata.",
            "If you are in a multi-step workflow that creates multiple PRs (e.g. stacked PRs), defer until after ALL PRs are created, then run `prepare-issue-pr` for each PR one by one.",
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
