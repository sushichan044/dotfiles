import { defineHook } from "cc-hooks-ts";

const hook = defineHook({
  run: (c) => {
    return c.json({
      event: "PreToolUse",
      output: {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: 'Use Bash(gemini "WebSearch: <query>") instead.',
        },
      },
    });
  },
  trigger: {
    PreToolUse: true,
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
