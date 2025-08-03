import type { Awaitable } from "../utils/types.ts";
import type { HookContext } from "./context.ts";
import type { ExtractTriggeredHookOutput, HookTrigger } from "./types.ts";

type HookHandler<THookTrigger extends HookTrigger> = (
  context: HookContext<THookTrigger>
) => Awaitable<HookHandlerResult<THookTrigger>>;

export type HookResponseSuccess = {
  kind: "success";

  /**
   * Message shown to the user in transcript mode.
   */
  messageForUser?: string;

  /**
   * Additional context for Claude.
   *
   * Only available for `UserPromptSubmit` and `SessionStart` hooks.
   */
  additionalClaudeContext?: string;
};

export type HookResponseBlockingError<TTrigger extends HookTrigger> = {
  kind: "blocking-error";

  output?: ExtractTriggeredHookOutput<TTrigger>;
};

export type HookResponseNonBlockingError = {
  kind: "non-blocking-error";

  /**
   * Message shown to the user in transcript mode.
   */
  messageForUser?: string;
};

export type HookHandlerResult<TTrigger extends HookTrigger> =
  | HookResponseSuccess
  | HookResponseBlockingError<TTrigger>
  | HookResponseNonBlockingError;

export type HookDefinition<THookTrigger extends HookTrigger = HookTrigger> = {
  trigger: THookTrigger;

  run: HookHandler<THookTrigger>;

  shouldRun?: () => Awaitable<boolean>;
};

export function defineHook<THookTrigger extends HookTrigger = HookTrigger>(
  definition: HookDefinition<THookTrigger>
): HookDefinition<THookTrigger> {
  return definition;
}
