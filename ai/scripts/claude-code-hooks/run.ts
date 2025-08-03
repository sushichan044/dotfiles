import process from "node:process";
import * as v from "jsr:@valibot/valibot";

import type { HookDefinition, HookHandlerResult } from "./define.ts";
import { HookInputSchemas, type HookInputBase } from "./input.ts";
import type { HookTrigger } from "./types.ts";
import { readFileSync } from "node:fs";
import type { HookContext } from "./context.ts";
import type { ValibotSchemaLike } from "../utils/valibot.ts";
import type { SupportedHookEvent } from "./event.ts";

export async function runHook<THookTrigger extends HookTrigger = HookTrigger>(
  def: HookDefinition<THookTrigger>
) {
  const { trigger, run, shouldRun } = def;

  let eventName: SupportedHookEvent | "unknown" = "unknown";

  try {
    const shouldContinue = shouldRun == null ? true : await shouldRun();
    if (!shouldContinue) {
      return handleHookResult(eventName, {
        kind: "success",
      });
    }

    const inputSchema = extractInputSchemaFromTrigger(trigger);

    const rawInput = readFileSync(process.stdin.fd, "utf-8");
    const input = JSON.parse(rawInput);
    const parsed = v.parse(inputSchema, input) as HookInputBase;
    eventName = parsed.hook_event_name;

    const context: HookContext<THookTrigger> = {
      // deno-lint-ignore no-explicit-any
      input: parsed as any,
      nonBlockingError: (result) => ({
        kind: "non-blocking-error",
        ...(result?.messageForUser
          ? { messageForUser: result?.messageForUser }
          : {}),
      }),
      success: (result) => ({
        kind: "success",
        ...(result?.messageForUser
          ? { messageForUser: result?.messageForUser }
          : {}),
        ...(result?.additionalClaudeContext
          ? { additionalClaudeContext: result?.additionalClaudeContext }
          : {}),
      }),
      blockingError: (result) => ({
        kind: "blocking-error",
        ...(result ? { output: result } : {}),
      }),
    };

    const result = await run(context);

    handleHookResult(eventName, result);
  } catch (error) {
    handleHookResult(eventName, {
      kind: "non-blocking-error",
      messageForUser: `Error in hook: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
}

const handleHookResult = (
  eventName: SupportedHookEvent | "unknown",
  hookResult: HookHandlerResult<HookTrigger>
): void => {
  switch (hookResult.kind) {
    case "success": {
      // early return if we use stdout for claude context
      if (eventName === "UserPromptSubmit") {
        if (hookResult.additionalClaudeContext) {
          console.log(hookResult.additionalClaudeContext);
          return process.exit(0);
        }
      }

      if (hookResult.messageForUser) {
        console.log(hookResult.messageForUser);
      }

      return process.exit(0);
    }
    case "blocking-error": {
      if (hookResult.output) {
        console.error(JSON.stringify(hookResult.output));
      }
      return process.exit(2);
    }
    case "non-blocking-error": {
      if (hookResult.messageForUser) {
        console.error(hookResult.messageForUser);
      }
      return process.exit(1);
    }
  }
};

const extractInputSchemaFromTrigger = (trigger: HookTrigger) => {
  const schemas: ValibotSchemaLike[] = [];

  for (const [hookEvent, eventValue] of Object.entries(trigger)) {
    if (eventValue === true) {
      const allSchemas = HookInputSchemas[hookEvent as SupportedHookEvent];
      if (allSchemas) {
        schemas.push(...Object.values(allSchemas));
      }
    } else if (typeof eventValue === "object" && eventValue !== null) {
      for (const [schemaKey, schemaValue] of Object.entries(eventValue)) {
        if (!schemaValue) {
          continue;
        }

        const schema =
          // @ts-expect-error schemaKey is a valid key in HookInputSchemas[hookEvent]
          HookInputSchemas[hookEvent as HookEvent]?.[schemaKey] as
            | ValibotSchemaLike
            | undefined;
        if (schema) {
          schemas.push(schema);
        }
      }
    }
  }

  return v.union(schemas);
};
