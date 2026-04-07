import { defineHook } from "cc-hooks-ts";

const hook = defineHook({
  trigger: {
    UserPromptSubmit: true,
  },

  run: (c) => {
    const prompt = c.input.prompt.trim();

    const isQuestion = prompt.endsWith("?") || prompt.endsWith("？");
    if (!isQuestion) {
      return c.success();
    }

    return c.json({
      event: "UserPromptSubmit",
      output: {
        hookSpecificOutput: {
          additionalContext: [
            "User asked a question, Do not write any codes and just discuss the question.",
            "If the question is ambiguous, use `AskUserQuestion` tool to ask for clarification, then continue discussing.",
          ].join("\n"),
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
