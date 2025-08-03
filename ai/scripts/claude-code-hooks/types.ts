import type { ExcludePropertyKey } from "../utils/types.ts";
import type { ExtractInferSchemaOutput } from "../utils/valibot.ts";
import type { SupportedHookEvent } from "./event.ts";
import type { HookInputSchemaType } from "./input.ts";
import type { ExtractHookOutput } from "./output.ts";

/**
 * Utility type to get specific schema output for an event and schema key.
 */
export type ExtractInputSchema<
  TEvent extends SupportedHookEvent,
  TSchemaKey extends keyof HookInputSchemaType[TEvent] = "default"
> = ExtractInferSchemaOutput<HookInputSchemaType[TEvent][TSchemaKey]>;

export type HookTrigger = Partial<{
  [EventKey in SupportedHookEvent]:
    | boolean // Subscribe to all schema keys of this event type
    | {
        [SchemaKey in keyof HookInputSchemaType[EventKey] as ExcludePropertyKey<
          SchemaKey,
          // { [EventKey]: true } means subscribe to all schemas.
          // So, users specifying schema key wants to subscribe to specific schemas only.
          // Default schema key is not appropriate for candidate here.
          "default"
        >]?: boolean;
      };
}>;

/**
 * Extracts triggered Event names from the `HookTrigger` configuration.
 *
 * @internal
 */
type ExtractTriggeredEvent<TTrigger extends HookTrigger> = {
  [EventKey in keyof TTrigger]: EventKey extends SupportedHookEvent
    ? TTrigger[EventKey] extends true | Record<string, boolean>
      ? EventKey
      : never
    : never;
}[keyof TTrigger];

/**
 * Utility type to get all schema outputs for a given event.
 */
type GetAllEventSchemaOutputs<TEvent extends SupportedHookEvent> = {
  [SchemaKey in keyof HookInputSchemaType[TEvent]]: ExtractInferSchemaOutput<
    HookInputSchemaType[TEvent][SchemaKey]
  >;
}[keyof HookInputSchemaType[TEvent]];

/**
 * Utility type to handle selective schema key extraction from trigger configuration.
 *
 * @internal
 */
type ExtractSelectiveSchemaOutputs<
  TEvent extends SupportedHookEvent,
  TTriggerValue extends Record<string, boolean>
> = {
  [SchemaKey in keyof TTriggerValue]: TTriggerValue[SchemaKey] extends true
    ? SchemaKey extends keyof HookInputSchemaType[TEvent]
      ? ExtractInputSchema<TEvent, SchemaKey>
      : never
    : never;
}[keyof TTriggerValue];

/**
 * Extracts the input schema types based on HookTrigger configuration.
 *
 * @template TTrigger - The HookTrigger configuration
 *
 * @example
 * ```ts
 * // Subscribe to all schemas for PreToolUse event
 * type Config1 = { PreToolUse: true };
 * type Inputs1 = ExtractTriggeredInputs<Config1>;
 * // Results in union of all PreToolUse schema types (default | Read | WebFetch)
 *
 * // Subscribe to specific schemas only
 * type Config2 = { PreToolUse: { Read: true, WebFetch: true } };
 * type Inputs2 = ExtractTriggeredInputs<Config2>;
 * // Results in union of only Read and WebFetch schema types for PreToolUse
 * ```
 */
export type ExtractTriggerHookInput<TTrigger extends HookTrigger> = {
  [EventKey in keyof TTrigger]: EventKey extends SupportedHookEvent
    ? TTrigger[EventKey] extends true
      ? GetAllEventSchemaOutputs<EventKey>
      : TTrigger[EventKey] extends Record<string, boolean>
      ? ExtractSelectiveSchemaOutputs<EventKey, TTrigger[EventKey]>
      : never
    : never;
}[keyof TTrigger];

export type ExtractTriggeredHookOutput<TTrigger extends HookTrigger> =
  ExtractTriggeredEvent<TTrigger> extends infer TEvent
    ? TEvent extends SupportedHookEvent
      ? ExtractHookOutput<TEvent>
      : never
    : never;
