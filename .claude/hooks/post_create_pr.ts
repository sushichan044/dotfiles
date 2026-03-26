import { defineHook } from "cc-hooks-ts";

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Bash: true,
    },
  },

  run: (c) => {
    const cmd = c.input.tool_input.command;
    if (!cmd.includes("gh pr create")) {
      return c.success();
    }

    return c.json({
      event: "PostToolUse",
      output: {
        hookSpecificOutput: {
          additionalContext: [
            "It looks like you just create a pull request.",
            "If you didn't use `prepare-issue-pr` skill, load it and check your pull request format, and refine the pull request if needed.",
            "This will help reviewers understand the context and purpose of the pull request, and facilitate a smoother review process.",
          ].join(" "),
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
