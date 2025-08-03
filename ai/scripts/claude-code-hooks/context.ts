import type {
  HookResponseBlockingError,
  HookResponseNonBlockingError,
  HookResponseSuccess,
} from "./define.ts";
import type { ExtractTriggerHookInput, HookTrigger } from "./types.ts";

type HookSuccessInput = Partial<
  Pick<HookResponseSuccess, "messageForUser" | "additionalClaudeContext">
>;

type HookNonBlockingErrorInput = Partial<{
  messageForUser: string;
}>;

type HookBlockingErrorInput<THookTrigger extends HookTrigger> = Partial<
  Pick<HookResponseBlockingError<THookTrigger>, "output">
>["output"];

export interface HookContext<THookTrigger extends HookTrigger> {
  input: ExtractTriggerHookInput<THookTrigger>;

  success: (result?: HookSuccessInput) => HookResponseSuccess;
  nonBlockingError: (
    result?: HookNonBlockingErrorInput
  ) => HookResponseNonBlockingError;
  blockingError: (
    result?: HookBlockingErrorInput<THookTrigger>
  ) => HookResponseBlockingError<THookTrigger>;
}
