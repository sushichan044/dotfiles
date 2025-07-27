type HookOutput<T extends Record<string, unknown>> = T & {
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

export type PreToolUseOutput = HookOutput<{
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

export type UserPromptSubmitOutput = HookOutput<{
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

export type StopOrSubAgentStopOutput = HookOutput<{
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

export const exitHook = {
  success: (messageForUser?: string): void => {
    if (messageForUser != null && messageForUser !== "") {
      // This is a success message for the user, not for Claude.
      console.log(messageForUser);
    }
    // Non-blocking success. Show stdout to the user but not to Claude.
    Deno.exit(0);
  },

  warnForUser: (messageForUser?: string): void => {
    if (messageForUser != null && messageForUser !== "") {
      // This is a warning for the user, not for Claude.
      console.error(messageForUser);
    }
    // Non-blocking error. Show stderr to the user but not to Claude.
    Deno.exit(1);
  },

  errorForClaude: <T extends Record<string, unknown>>(
    output: HookOutput<T>
  ): void => {
    // This is a structured output for Claude, not for the user.
    console.log(JSON.stringify(output));
    // Blocking error. Show stderr to Claude but not to the user.
    Deno.exit(2);
  },
} as const;
