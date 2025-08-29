import { defineHook, runHook } from "cc-hooks-ts";

const hook = defineHook({
  run: (c) => {
    return c.json({
      event: "PreToolUse",
      output: {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason:
            'Use Bash(gemini --prompt "WebSearch: <query>") instead.',
        },
      },
    });
  },
  trigger: {
    PreToolUse: true,
  },
});

await runHook(hook);
