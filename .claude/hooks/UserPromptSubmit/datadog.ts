import { defineHook } from "cc-hooks-ts";

const hook = defineHook({
  trigger: {
    UserPromptSubmit: true,
  },

  run: (c) => {
    const prompt = c.input.prompt.trim();

    const suggestDataDogSkill = prompt.toLowerCase().includes("datadog");
    if (!suggestDataDogSkill) {
      return c.success();
    }

    return c.json({
      event: "UserPromptSubmit",
      output: {
        hookSpecificOutput: {
          additionalContext:
            "User mentioned Datadog. You may use `dd-*` skills to interact with Datadog if necessary.",
          hookEventName: "UserPromptSubmit",
        },
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
