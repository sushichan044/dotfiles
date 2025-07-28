/**
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks#hook-events}
 */
export type HookEvents =
  | "PreToolUse"
  | "PostToolUse"
  | "Notification"
  | "UserPromptSubmit"
  | "Stop"
  | "SubagentStop"
  | "PreCompact";
