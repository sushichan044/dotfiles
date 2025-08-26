#!/usr/bin/env -S bun run --silent -i
// @ts-check
/**
 * @fileoverview
 *   Send a macOS notification with the last message content from a Claude transcript.
 *   Requires Claude Code 1.0.43 or later.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { $ } from "bun";
import {
  defineHook,
  type ExtractAllHookInputsForEvent,
  runHook,
} from "cc-hooks-ts";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { isNonEmptyString } from "../../../ai/scripts/utils/string";

function resolvePath(pathString: string): string {
  let resolvedPath = pathString;
  if (pathString.startsWith("~/")) {
    resolvedPath = path.join(os.homedir(), pathString.slice(2));
  }

  return path.resolve(resolvedPath);
}

type NotificationPayload = {
  message: string;
  title: string;
};

function buildNotificationFromNotificationHook(
  input: ExtractAllHookInputsForEvent<"Notification">,
): NotificationPayload {
  return {
    message: input.message ?? "Claude sent you a message.",
    title: "Claude Code",
  };
}

function buildNotificationFromStopHook(
  input: ExtractAllHookInputsForEvent<"Stop">,
): NotificationPayload {
  const fallbackMessage = "Claude Code process has completed.";
  const transcriptPath = resolvePath(input.transcript_path);

  // ファイルが存在しない場合はフォールバックメッセージを返す
  if (!existsSync(transcriptPath)) {
    return {
      message: fallbackMessage,
      title: "Claude Code",
    };
  }

  try {
    const lines = readFileSync(transcriptPath, "utf-8")
      .split("\n")
      .filter((line) => line.trim());

    const lastLine = lines.at(-1);
    if (!isNonEmptyString(lastLine)) {
      return {
        message: fallbackMessage,
        title: "Claude Code",
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const transcript = JSON.parse(lastLine);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
      message,
      title: "Claude Code",
    };
  } catch {
    // Maybe JSON parsing failed or file is not a valid transcript
    return {
      message: fallbackMessage,
      title: "Claude Code",
    };
  }
}

const hook = defineHook({
  trigger: {
    Notification: true,
    Stop: true,
  },

  run: async (c) => {
    if (
      c.input.hook_event_name === "Stop" &&
      c.input.stop_hook_active === true
    ) {
      return c.success();
    }

    const notification =
      c.input.hook_event_name === "Notification"
        ? buildNotificationFromNotificationHook(c.input)
        : buildNotificationFromStopHook(c.input);

    await $`terminal-notifier -sound Funk -title ${notification.title} -message ${notification.message}`;
    return c.success();
  },
  shouldRun: () => process.platform === "darwin",
});

await runHook(hook);
