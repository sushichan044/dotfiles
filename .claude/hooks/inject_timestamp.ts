import { defineHook } from "cc-hooks-ts";
import "temporal-polyfill-lite/global";

const hook = defineHook({
  trigger: {
    PostToolUse: {
      Bash: true,
    },
    PreToolUse: {
      Bash: true,
    },
  },

  run: (c) => {
    const timestamp = Temporal.Now.zonedDateTimeISO("Asia/Tokyo").toLocaleString("ja-JP");

    switch (c.input.hook_event_name) {
      case "PostToolUse":
        return c.json({
          event: c.input.hook_event_name,
          output: {
            hookSpecificOutput: {
              additionalContext: `Timestamp in JST after using Bash (tool_use_id: ${c.input.tool_use_id}): ${timestamp}`,
              hookEventName: c.input.hook_event_name,
            },
          },
        });
      case "PreToolUse":
        return c.json({
          event: c.input.hook_event_name,
          output: {
            hookSpecificOutput: {
              additionalContext: `Timestamp in JST before using Bash (tool_use_id: ${c.input.tool_use_id}): ${timestamp}`,
              hookEventName: c.input.hook_event_name,
            },
          },
        });
    }
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
