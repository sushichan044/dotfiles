import { defineHook } from "cc-hooks-ts";

import { createOmakase } from "../../../tools/utils/omakase";

const denyMessage = [
  "Omakase mode is ON for this working directory. The user has explicitly delegated decision-making to you.",
  "",
  "Do NOT ask the user via AskUserQuestion. Instead:",
  "- Spawn subagents (Agent tool, dispatching-parallel-agents skill, or codex:rescue) to research options, gather evidence, or get a second opinion.",
  "- Integrate the findings yourself and proceed with the most reasonable action.",
  "- If you hit a genuine blocker that research cannot resolve, surface it as a plain text message with your tentative recommendation — do not fall back to AskUserQuestion.",
].join("\n");

const hook = defineHook({
  trigger: {
    PreToolUse: {
      AskUserQuestion: true,
    },
  },

  run: async (c) => {
    if (!(await createOmakase(c.input.cwd).isEnabled())) {
      return c.success();
    }

    return c.json({
      event: "PreToolUse",
      output: {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: denyMessage,
        },
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
