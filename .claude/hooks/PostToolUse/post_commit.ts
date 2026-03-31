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
            "You just committed some changes.",
            "You MUST execute the `contextual-commit` skill before completing the task to tidy up your commit message.",
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
