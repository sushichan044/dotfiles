import * as v from "jsr:@valibot/valibot";

const baseHookInputSchema = v.object({
  session_id: v.string(),
  transcript_path: v.string(),
  hook_event_name: v.string(),
  cwd: v.string(),
});

const buildHookInputSchema = <
  TName extends string,
  TEntries extends v.ObjectEntries
>(
  hook_event_name: TName,
  entries: TEntries
) => {
  return v.object({
    ...baseHookInputSchema.entries,
    hook_event_name: v.literal(hook_event_name),
    ...entries,
  });
};

const createPreToolUseInputSchema = <
  TName extends string,
  TInput extends v.ObjectEntries[string]
>(
  toolName: TName,
  toolInput: TInput
) =>
  buildHookInputSchema("PreToolUse", {
    tool_name: v.literal(toolName),
    tool_input: toolInput,
  });

export const preToolUseInputSchema = {
  /**
   * Schema for the `Read` tool input.
   */
  Read: createPreToolUseInputSchema(
    "Read",
    v.object({
      file_path: v.string(),
    })
  ),
} as const;

export type NotificationInput = v.InferOutput<typeof notificationInputSchema>;
export const notificationInputSchema = buildHookInputSchema("Notification", {
  message: v.optional(v.string()),
});

const stopInputSchema = buildHookInputSchema("Stop", {
  stop_hook_active: v.optional(v.boolean()),
});

const subAgentStopInputSchema = buildHookInputSchema("SubagentStop", {
  stop_hook_active: v.optional(v.boolean()),
});

export type StopOrSubAgentStopInput = v.InferOutput<
  typeof stopOrSubAgentStopInputSchema
>;
export const stopOrSubAgentStopInputSchema = v.variant("hook_event_name", [
  stopInputSchema,
  subAgentStopInputSchema,
]);

export const userPromptSubmitInputSchema = buildHookInputSchema(
  "UserPromptSubmit",
  {
    prompt: v.string(),
  }
);

export const preCompactInputSchema = buildHookInputSchema("PreCompact", {
  trigger: v.union([v.literal("manual"), v.literal("auto")]),
  /**
   * For `manual`, `custom_instructions` comes from what the user passes into /compact.
   *
   * For `auto`, `custom_instructions` is empty.
   */
  custom_instructions: v.string(),
});
