#! /usr/bin/env node
// @ts-check
/**
 * @fileoverview
 *   Send a macOS notification with the last message content from a Claude transcript.
 *   Requires Claude Code 1.0.43 or later.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * A notification input for Claude Code hooks.
 * https://docs.anthropic.com/en/docs/claude-code/hooks#notification-input
 * @typedef ClaudeNotificationHookInput
 * @property {"Notification"} hook_event_name
 *   The name of the hook event, which is "Notification" for notification hooks.
 * @property {string} session_id
 *   Claude Code session ID.
 * @property {string} transcript_path
 *   Path to the Claude transcript file. May contain `~` for home directory.
 * @property {string} message
 *   The message object containing content.
 * @property {string} title
 *   The title for the notification.
 *
 * A stop hook input for Claude Code hooks.
 * https://docs.anthropic.com/en/docs/claude-code/hooks#stop-and-subagentstop-input
 * @typedef ClaudeStopHookInput
 * @property {"Stop" | "SubagentStop"} hook_event_name
 *   The name of the hook event, which is "Stop" for stop hooks.
 * @property {string} session_id
 *   Claude Code session ID.
 * @property {string} transcript_path
 *   Path to the Claude transcript file. May contain `~` for home directory.
 * @property {boolean} stop_hook_active
 *   Use this value to prevent claude code to run infinite stop hooks.
 *   `true` if the claude code is already running in a stop hook.
 */

/**
 * @param {string} rawInput
 * @returns {ClaudeNotificationHookInput | ClaudeStopHookInput}
 */
function parseInput(rawInput) {
  /**
   * @type {{session_id: string, transcript_path: string, hook_event_name: string}}
   */
  const input = JSON.parse(rawInput);

  if (
    !("session_id" in input) ||
    !("transcript_path" in input) ||
    !("hook_event_name" in input)
  ) {
    throw new Error(
      "Invalid input: session_id, transcript_path, and hook_event_name are required."
    );
  }

  switch (input.hook_event_name) {
    case "Notification": {
      if (
        "title" in input &&
        typeof input.title === "string" &&
        "message" in input &&
        typeof input.message === "string"
      ) {
        return {
          hook_event_name: input.hook_event_name,
          session_id: input.session_id,
          transcript_path: input.transcript_path,
          title: input.title,
          message: input.message,
        };
      }
      break;
    }
    case "Stop":
    case "SubagentStop": {
      if (
        "stop_hook_active" in input &&
        typeof input.stop_hook_active === "boolean"
      ) {
        return {
          hook_event_name: input.hook_event_name,
          session_id: input.session_id,
          transcript_path: input.transcript_path,
          stop_hook_active: input.stop_hook_active,
        };
      }
      break;
    }
  }

  throw new Error(
    "Invalid input: hook_event_name must be 'Notification', 'Stop', or 'SubagentStop'."
  );
}

function isMacOS() {
  return process.platform === "darwin";
}

/**
 * Resolves a given path to an absolute path.
 * @param {string} pathString
 */
function resolvePath(pathString) {
  let resolvedPath = pathString;
  if (pathString.startsWith("~/")) {
    resolvedPath = path.join(os.homedir(), pathString.slice(2));
  }

  return path.resolve(resolvedPath);
}

/**
 * @typedef NotificationParams
 * @property {string} title
 *   The title of the notification.
 * @property {string} message
 *   The message content of the notification.
 */

/**
 * Builds a notification from a Claude notification hook input.
 * @param {ClaudeNotificationHookInput} input
 * @returns {NotificationParams}
 */
function buildNotificationFromNotificationHook(input) {
  return {
    title: input.title,
    message: input.message,
  };
}

/**
 * Builds a notification from a Claude stop hook input.
 * This function reads the last line of the transcript file and extracts the last message content.
 * If the transcript file is not found or is invalid, it returns a default notification.
 * @param {ClaudeStopHookInput} input
 * @returns {NotificationParams}
 */
function buildNotificationFromStopHook(input) {
  const transcriptPath = resolvePath(input.transcript_path);
  const lines = readFileSync(transcriptPath, "utf-8")
    .split("\n")
    .filter((line) => line.trim());

  const lastLine = lines.at(-1);
  const transcript = JSON.parse(lastLine ?? "{}");
  /**
   * @type {string | undefined}
   */
  const lastMessageContent = transcript?.message?.content?.[0]?.text;

  return {
    title: "Claude Code",
    message: lastMessageContent ?? "Claude Code has stopped.",
  };
}

try {
  if (!isMacOS()) {
    process.exit(0);
  }

  const rawInput = readFileSync(process.stdin.fd, "utf8");
  const input = parseInput(rawInput);

  if ((input.hook_event_name === "Stop" || input.hook_event_name === "SubagentStop") && input.stop_hook_active) {
    // If the stop hook is already active, we do not send a notification.
    process.exit(0);
  }

  const notification =
    input.hook_event_name === "Notification"
      ? buildNotificationFromNotificationHook(input)
      : buildNotificationFromStopHook(input);

  const script = `
          try
            set notificationTitle to system attribute "CLAUDE_NOTIFICATION_TITLE"
            set notificationMessage to system attribute "CLAUDE_NOTIFICATION_MESSAGE"
            set notificationSound to system attribute "CLAUDE_NOTIFICATION_SOUND"
            display notification notificationMessage with title notificationTitle sound name notificationSound
          end try
        `;
  execFileSync("osascript", ["-e", script], {
    env: {
      ...process.env,
      CLAUDE_NOTIFICATION_TITLE: notification.title,
      CLAUDE_NOTIFICATION_MESSAGE: notification.message,
      CLAUDE_NOTIFICATION_SOUND: "Funk",
    },
    stdio: "ignore",
  });
} catch (error) {
  console.error("Error processing transcript or sending notification.");
  console.error(error);
  process.exit(1);
}
