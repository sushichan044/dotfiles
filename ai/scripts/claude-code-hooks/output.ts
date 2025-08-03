import type { AssertFalse, IsNever } from "../utils/types.ts";
import type { SupportedHookEvent } from "./event.ts";

// deno-lint-ignore ban-types
type HookOutputBase<T extends Record<string, unknown> = {}> = T & {
  /**
   * Whether Claude should continue after hook execution
   *
   * @default true
   */
  continue?: boolean;

  /**
   * Message for the user, shown in the UI
   *
   * NOT FOR CLAUDE
   */
  stopReason?: string;

  /**
   * If `true`, user cannot see the stdout of this hook.
   *
   * @default false
   */
  suppressOutput?: boolean;
};

type HookOutput = {
  PreToolUse: HookOutputBase<{
    /**
     * - `approve` bypasses the permission system. `reason` is shown to the user but not to Claude.
     * - `block` prevents the tool call from executing. `reason` is shown to Claude.
     * - `undefined` leads to the existing permission flow. `reason` is ignored.
     */
    decision: "approve" | "block" | undefined;

    /**
     * Reason for the decision.
     */
    reason: string;
  }>;

  PostToolUse: HookOutputBase<{
    /**
     * - `block` prevents the tool call from executing. `reason` is shown to Claude.
     * - `undefined` leads to the existing permission flow. `reason` is ignored.
     */
    decision: "block" | undefined;

    /**
     * Reason for the decision.
     */
    reason: string;
  }>;

  UserPromptSubmit: HookOutputBase<{
    /**
     * - `block` prevents the prompt from being processed.
     * The submitted prompt is erased from context.
     * `reason` is shown to the user but not added to context.
     *
     * - `undefined` allows the prompt to proceed normally. `reason` is ignored.
     */
    decision: "block" | undefined;
    /**
     * Reason for the decision.
     */
    reason: string;
  }>;

  Stop: HookOutputBase<{
    /**
     * - `block` prevents Claude from stopping. You must populate `reason` for Claude to know how to proceed.
     *
     * - `undefined` allows Claude to stop. `reason` is ignored.
     */
    decision: "block" | undefined;
    /**
     * Reason for the decision.
     */
    reason: string;
  }>;

  SubagentStop: HookOutputBase<{
    /**
     * - `block` prevents Claude from stopping. You must populate `reason` for Claude to know how to proceed.
     *
     * - `undefined` allows Claude to stop. `reason` is ignored.
     */
    decision: "block" | undefined;
    /**
     * Reason for the decision.
     */
    reason: string;
  }>;

  SessionStart: HookOutputBase<{
    hookSpecificOutput: {
      hookEventName: "SessionStart";
      additionalContext: string;
    };
  }>;

  // Hooks below does not have additional output fields.

  Notification: HookOutputBase;
  PreCompact: HookOutputBase;
};

export type ExtractHookOutput<TEvent extends SupportedHookEvent> =
  HookOutput extends Record<SupportedHookEvent, unknown>
    ? HookOutput[TEvent]
    : never;

// internal type checker:
// If any type error occurs here, it means `HookOutput` missing required keys for `OutputSupportedHookEvents`.
type __TypeCheckExtractHookOutput = AssertFalse<
  IsNever<ExtractHookOutput<SupportedHookEvent>>
>;
