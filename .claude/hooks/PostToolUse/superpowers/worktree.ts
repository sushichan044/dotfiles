import { defineHook, runHook } from "cc-hooks-ts";

declare module "cc-hooks-ts" {
  interface ToolSchema {
    Skill: {
      input: {
        args?: string;
        skill: string;
      };
      response: unknown;
    };
  }
}

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Skill: true,
    },
  },

  run: (c) => {
    if (c.input.tool_input.skill !== "superpowers:using-git-worktrees") {
      return c.success();
    }

    return c.json({
      event: "PostToolUse",
      output: {
        hookSpecificOutput: {
          additionalContext:
            "Skip asking user where to create the worktree, and just use Claude Code's builtin Worktree tool.",
          hookEventName: "PostToolUse",
        },
      },
    });
  },
});

if (import.meta.main) {
  await runHook(hook);
}
