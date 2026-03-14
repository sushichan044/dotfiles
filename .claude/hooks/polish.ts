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
        reason:
          "Before finishing the task, YOU MUST polish the code by running `polish` skill to ensure the final deliverable is of high quality and meets project standards.",
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
