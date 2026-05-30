import { regex } from "arkregex";
import { defineHook } from "cc-hooks-ts";

import { createShell } from "../../../tools/utils/bun-sh";

// detect git commit, git <options> commit.
function isGitCommitCommand(cmd: string): boolean {
  const pattern = regex(`^git(\\s+\\S+)*\\s+commit(\\s+\\S+)*$`);
  return pattern.test(cmd);
}

const hook = defineHook({
  trigger: {
    PreToolUse: {
      Bash: true,
    },
  },

  run: async (c) => {
    const cmd = c.input.tool_input.command.trim();
    if (!isGitCommitCommand(cmd)) {
      return c.success();
    }

    const sh = createShell({ cwd: c.input.cwd });
    const result = await sh`git diff --cached --stat`;
    if (result.exitCode !== 0) {
      return c.success();
    }

    const staged = result.text().trim();
    if (staged === "") {
      return c.success();
    }

    return c.json({
      event: "PreToolUse",
      output: {
        hookSpecificOutput: {
          additionalContext: [
            "You are about to commit. Review the staged changes below and confirm no unintended files slipped in (especially a stray diff sneaking into `--amend`):",
            "",
            staged,
          ].join("\n"),
          hookEventName: "PreToolUse",
        },
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
