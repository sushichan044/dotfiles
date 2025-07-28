import * as v from "jsr:@valibot/valibot";
import { HookEvents } from "./types.ts";

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

export const HookInputSchemas = {
  Notification: {
    default: buildHookInputSchema("Notification", {
      message: v.optional(v.string()),
    }),
  },
  Stop: {
    default: buildHookInputSchema("Stop", {
      stop_hook_active: v.optional(v.boolean()),
    }),
  },
  SubagentStop: {
    default: buildHookInputSchema("SubagentStop", {
      stop_hook_active: v.optional(v.boolean()),
    }),
  },
  PreToolUse: {
    default: buildHookInputSchema("PreToolUse", {}),
    Read: createPreToolUseInputSchema(
      "Read",
      v.object({
        file_path: v.string(),
      })
    ),
    WebFetch: createPreToolUseInputSchema(
      "WebFetch",
      v.object({
        url: v.pipe(v.string(), v.url()),
        prompt: v.string(),
      })
    ),
  },
  PostToolUse: {
    default: buildHookInputSchema("PostToolUse", {}),
  },
  UserPromptSubmit: {
    default: buildHookInputSchema("UserPromptSubmit", {
      prompt: v.string(),
    }),
  },
  PreCompact: {
    default: buildHookInputSchema("PreCompact", {
      trigger: v.union([v.literal("manual"), v.literal("auto")]),
      /**
       * For `manual`, `custom_instructions` comes from what the user passes into /compact.
       *
       * For `auto`, `custom_instructions` is empty.
       */
      custom_instructions: v.string(),
    }),
  },
} as const satisfies Record<
  HookEvents,
  {
    [key: string]: v.ObjectSchema<
      v.ObjectEntries,
      v.ErrorMessage<v.ObjectIssue> | undefined
    >;
  }
>;

type HookInputSchemaDefs = typeof HookInputSchemas;

export type HookInputs = {
  [EventKey in HookEvents]: {
    [SchemaKey in keyof HookInputSchemaDefs[EventKey]]: v.InferOutput<
      HookInputSchemaDefs[EventKey][SchemaKey] extends v.BaseSchema<
        unknown,
        unknown,
        v.BaseIssue<unknown>
      >
        ? HookInputSchemaDefs[EventKey][SchemaKey]
        : never
    >;
  };
};
