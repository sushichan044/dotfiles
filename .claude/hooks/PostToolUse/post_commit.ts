import { regex } from "arkregex";
import { defineHook } from "cc-hooks-ts";

// detect git commit, git <options> commit.
function isGitCommitCommand(cmd: string): boolean {
  const pattern = regex(`^git(\\s+\\S+)*\\s+commit(\\s+\\S+)*$`);
  return pattern.test(cmd);
}

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Bash: true,
    },
  },

  run: (c) => {
    const cmd = c.input.tool_input.command;
    if (!isGitCommitCommand(cmd)) {
      return c.success();
    }

    return c.json({
      event: "PostToolUse",
      output: {
        hookSpecificOutput: {
          additionalContext: [
            "It looks like you just committed some changes.",
            "If you didn't use `contextual-commit` skill, load it and check your commit message format, and refine the commit message with `amend` if needed.",
            "This will help reviewers understand the context and purpose of the commit, and facilitate a smoother review process.",
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
