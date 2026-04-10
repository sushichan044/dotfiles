import { defineHook } from "cc-hooks-ts";

const nonCodingAgents = ["Explore", "Plan"];

const hook = defineHook({
  trigger: {
    Stop: true,
    SubagentStop: true,
  },

  run: (c) => {
    if (c.input.stop_hook_active) {
      return c.success();
    }

    switch (c.input.hook_event_name) {
      case "Stop": {
        return c.json({
          event: "Stop",
          output: {
            decision: "block",
            reason: [
              "Before completing the task, check whether the task involved writing or modifying code.",
              '- If it did, execute the "polish" skill to refine the code and ensure the final deliverable is of high quality and meets project standards.',
              "- If it did NOT involve writing or modifying code (e.g., planning, analysis, research, discussion, or answering questions), you may skip these skills and complete the task as-is.",
              "If you receive these instructions again after executing skills, you may disregard them.",
            ].join("\n"),
          },
        });
      }
      case "SubagentStop": {
        if (nonCodingAgents.includes(c.input.agent_type)) {
          return c.success();
        }

        return c.json({
          event: "SubagentStop",
          output: {
            decision: "block",
            reason: [
              `The subagent of type "${c.input.agent_type}" has stopped, but before completing the task, check whether the task involved writing or modifying code.`,
              '- If it did, execute the "polish" skill to refine the code and ensure the final deliverable is of high quality and meets project standards.',
              "- If it did NOT involve writing or modifying code (e.g., planning, analysis, research, discussion, or answering questions), you may skip these skills and complete the task as-is.",
              "If you receive these instructions again after executing skills, you may disregard them.",
            ].join("\n"),
          },
        });
      }
    }
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
