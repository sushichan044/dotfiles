import { defineHook } from "cc-hooks-ts";

import { createOmakaseContext } from "../../tools/utils/omakase";

const DENY_ASK_USER_QUESTION = [
  "Omakase mode is ON for this working directory. The user has explicitly delegated decision-making to you.",
  "",
  "Do NOT ask the user via AskUserQuestion. Instead:",
  "- Spawn subagents (Agent tool, dispatching-parallel-agents skill, or codex:rescue) to research options, gather evidence, or get a second opinion.",
  "- Integrate the findings yourself and proceed with the most reasonable action.",
  "- If you hit a genuine blocker that research cannot resolve, surface it as a plain text message with your tentative recommendation — do not fall back to AskUserQuestion.",
].join("\n");

function buildCompletionCheckReason(originalPrompt: string): string {
  return [
    "Before stopping, verify that you have fully completed the original task.",
    "",
    "The original instruction was:",
    "---",
    originalPrompt,
    "---",
    "",
    "Ask yourself:",
    "1. Have I fully addressed every part of the original instruction?",
    "2. Are there any loose ends, unfinished steps, or follow-up actions required?",
    "",
    "If the task is complete, you may stop. If not, continue working until it is done.",
    "Do NOT ask the user for confirmation — proceed autonomously.",
  ].join("\n");
}

const hook = defineHook({
  trigger: {
    PreToolUse: {
      AskUserQuestion: true,
    },
    UserPromptSubmit: true,
    Stop: true,
  },

  run: async (c) => {
    const omakase = createOmakaseContext(c.input.cwd, c.input.session_id);

    switch (c.input.hook_event_name) {
      case "UserPromptSubmit": {
        if (!(await omakase.isEnabled())) {
          return c.success();
        }

        await omakase.setLastPrompt(c.input.prompt);
        return c.success();
      }

      case "PreToolUse": {
        if (!(await omakase.isEnabled())) {
          return c.success();
        }

        return c.json({
          event: "PreToolUse",
          output: {
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason: DENY_ASK_USER_QUESTION,
            },
          },
        });
      }

      case "Stop": {
        if (c.input.stop_hook_active) {
          return c.success();
        }
        if (!(await omakase.isEnabled())) {
          return c.success();
        }

        const originalPrompt = await omakase.getLastPrompt();
        if (originalPrompt === null) {
          return c.success();
        }

        return c.json({
          event: "Stop",
          output: {
            decision: "block",
            reason: buildCompletionCheckReason(originalPrompt),
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
