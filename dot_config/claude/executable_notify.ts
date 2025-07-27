#!/usr/bin/env -S deno run --allow-env --allow-read
// @ts-check
/**
 * @fileoverview
 *   Send a macOS notification with the last message content from a Claude transcript.
 *   Requires Claude Code 1.0.43 or later.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";

import {
  NotificationInput,
  notificationInputSchema,
  StopOrSubAgentStopInput,
  stopOrSubAgentStopInputSchema,
} from "../../ai/scripts/claude-code-hooks/input.ts";

import * as v from "jsr:@valibot/valibot";
import { isNonEmptyString } from "../../ai/scripts/utils/string.ts";
import $ from "jsr:@david/dax";

function isMacOS(): boolean {
  return process.platform === "darwin";
}

function resolvePath(pathString: string): string {
  let resolvedPath = pathString;
  if (pathString.startsWith("~/")) {
    resolvedPath = path.join(os.homedir(), pathString.slice(2));
  }

  return path.resolve(resolvedPath);
}

function buildNotificationFromNotificationHook(input: NotificationInput) {
  return {
    title: "Claude Code",
    message: input.message ?? "Claude sent you a message.",
  };
}

function buildNotificationFromStopHook(input: StopOrSubAgentStopInput) {
  const fallbackMessage = "Claude Code process has completed.";
  const transcriptPath = resolvePath(input.transcript_path);

  // ファイルが存在しない場合はフォールバックメッセージを返す
  if (!existsSync(transcriptPath)) {
    return {
      title: "Claude Code",
      message: fallbackMessage,
    };
  }

  try {
    const lines = readFileSync(transcriptPath, "utf-8")
      .split("\n")
      .filter((line) => line.trim());

    const lastLine = lines.at(-1);
    if (!lastLine) {
      return {
        title: "Claude Code",
        message: fallbackMessage,
      };
    }

    const transcript = JSON.parse(lastLine);

    const lastMessageContent = transcript?.message?.content?.[0]?.text as
      | string
      | undefined;

    // Get the first 100 characters in first line of the last message
    const truncatedMessage = lastMessageContent
      ?.split("\n")
      .at(0)
      ?.trim()
      .substring(0, 100);

    const message = isNonEmptyString(truncatedMessage)
      ? `${truncatedMessage}...`
      : fallbackMessage;

    return {
      title: "Claude Code",
      message,
    };
  } catch (_error) {
    // Maybe JSON parsing failed or file is not a valid transcript
    return {
      title: "Claude Code",
      message: fallbackMessage,
    };
  }
}

type NotificationPayload = {
  title: string;
  message: string;
};

try {
  if (!isMacOS()) {
    process.exit(0);
  }

  const rawInput = readFileSync(process.stdin.fd, "utf8");
  const raw = JSON.parse(rawInput);

  const input = v.parse(
    v.union([notificationInputSchema, stopOrSubAgentStopInputSchema]),
    raw
  );

  if (
    (input.hook_event_name === "Stop" ||
      input.hook_event_name === "SubagentStop") &&
    input.stop_hook_active
  ) {
    // If the stop hook is already active, we do not send a notification.
    process.exit(0);
  }

  const notification: NotificationPayload =
    input.hook_event_name === "Notification"
      ? buildNotificationFromNotificationHook(input)
      : buildNotificationFromStopHook(input);

  await $`terminal-notifier -sound Funk -title ${notification.title} -message ${notification.message}`;
} catch (error) {
  console.error("Error processing transcript or sending notification.");
  console.error(error);
  process.exit(1);
}
