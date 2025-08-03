export const SUPPORTED_HOOK_EVENTS = [
  "PreToolUse",
  "PostToolUse",
  "Notification",
  "UserPromptSubmit",
  "Stop",
  "SubagentStop",
  "PreCompact",
  "SessionStart",
] as const;

export type SupportedHookEvent = (typeof SUPPORTED_HOOK_EVENTS)[number];
