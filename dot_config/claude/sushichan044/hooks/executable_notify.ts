#!/usr/bin/env -S deno run --allow-env --allow-read --allow-run
// @ts-check
/**
 * @fileoverview
 *   Send a macOS notification with the last message content from a Claude transcript.
 *   Requires Claude Code 1.0.43 or later.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import process from "node:process";

import { isNonEmptyString } from "../../../../ai/scripts/utils/string.ts";
import $ from "jsr:@david/dax";
import { defineHook } from "../../../../ai/scripts/claude-code-hooks/define.ts";
import { runHook } from "../../../../ai/scripts/claude-code-hooks/run.ts";
import type { ExtractInputSchema } from "../../../../ai/scripts/claude-code-hooks/types.ts";

function resolvePath(pathString: string): string {
  let resolvedPath = pathString;
  if (pathString.startsWith("~/")) {
    resolvedPath = path.join(os.homedir(), pathString.slice(2));
  }

  return path.resolve(resolvedPath);
}

type NotificationPayload = {
  title: string;
  message: string;
};

function buildNotificationFromNotificationHook(
  input: ExtractInputSchema<"Notification">
): NotificationPayload {
  return {
    title: "Claude Code",
    message: input.message ?? "Claude sent you a message.",
  };
}

function buildNotificationFromStopHook(
  input: ExtractInputSchema<"Stop">
): NotificationPayload {
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

const hook = defineHook({
  trigger: {
    Stop: true,
    Notification: true,
  },
  shouldRun: () => process.platform === "darwin",
  run: async (c) => {
    if (c.input.hook_event_name === "Stop" && c.input.stop_hook_active) {
      return c.success();
    }

    const notification =
      c.input.hook_event_name === "Notification"
        ? buildNotificationFromNotificationHook(c.input)
        : buildNotificationFromStopHook(c.input);

    await $`terminal-notifier -sound Funk -title ${notification.title} -message ${notification.message}`;
    return c.success();
  },
});

await runHook(hook);
