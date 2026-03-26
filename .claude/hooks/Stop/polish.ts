import { defineHook } from "cc-hooks-ts";

const hook = defineHook({
  trigger: {
    Stop: true,
  },

  run: (c) => {
    if (c.input.stop_hook_active) {
      return c.success();
    }

    return c.json({
      event: "Stop",
      output: {
        decision: "block",
        reason: [
          "Before completing the task, check whether the task involved writing or modifying code.",
          '- If it did, execute the "polish" skill to refine the code and ensure the final deliverable is of high quality and meets project standards.',
          '- If it did NOT involve writing or modifying code (e.g., planning, analysis, research, discussion, or answering questions), you may skip the "polish" skill and complete the task as-is.',
          'If you receive these instructions again after executing the "polish" skill, you may disregard them.',
        ].join("\n"),
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
