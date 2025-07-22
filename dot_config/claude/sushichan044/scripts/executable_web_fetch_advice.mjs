#! /usr/bin/env node
// @ts-check
/**
 * @fileoverview
 *   Send tips when using web fetch in Claude Code.
 *
 * @see {@link https://docs.anthropic.com/en/docs/claude-code/hooks}
 */

import { readFileSync } from "node:fs";

/**
 * Params for WebFetch tool.
 *
 * JSON Schema:
 * ```json
 * {
 *   "type": "object",
 *   "additionalProperties": false,
 *   "properties": {
 *     "url": {
 *       "description": "The URL to fetch content from",
 *       "type": "string",
 *       "format": "uri"
 *     },
 *     "prompt": {
 *       "description": "The prompt to run on the fetched content",
 *       "type": "string"
 *     }
 *   },
 *   "required": ["url", "prompt"]
 * }
 * ```
 * @typedef {Object} ClaudePreToolUseHookWebFetchToolInput
 * @property {string} url   The URL to fetch.
 * @property {string} prompt The prompt to use for fetching the URL.
 */

/**
 * A pre-tool use hook input for Claude Code hooks.
 * @see https://docs.anthropic.com/en/docs/claude-code/hooks#pretooluse-input
 * @typedef {Object} ClaudePreToolUseHookWebFetchInput
 * @property {"PreToolUse"} hook_event_name The name of the hook event, which is "PreToolUse" for pre-tool use hooks.
 * @property {string} session_id Claude Code session ID.
 * @property {string} transcript_path Path to the Claude transcript file. May contain `~` for home directory.
 * @property {string} tool_name The name of the tool being used, which is "WebFetch" for web fetch hooks.
 * @property {ClaudePreToolUseHookWebFetchToolInput} tool_input
 */

/**
 * Builds a notification from a pre-tool use hook input.
 * @param {string} rawInput
 * @returns {ClaudePreToolUseHookWebFetchInput}
 */
function parseInput(rawInput) {
  /**
   * @type {{}}
   */
  const input = JSON.parse(rawInput);
  if (
    !("session_id" in input && typeof input.session_id === "string") ||
    !(
      "transcript_path" in input && typeof input.transcript_path === "string"
    ) ||
    !(
      "hook_event_name" in input &&
      typeof input.hook_event_name === "string" &&
      input.hook_event_name === "PreToolUse"
    ) ||
    !("tool_name" in input && typeof input.tool_name === "string") ||
    !("tool_input" in input && typeof input.tool_input === "object") ||
    !(
      input.tool_input != null &&
      "url" in input.tool_input &&
      typeof input.tool_input.url === "string"
    ) ||
    !(
      input.tool_input != null &&
      "prompt" in input.tool_input &&
      typeof input.tool_input.prompt === "string"
    )
  ) {
    throw new Error(
      "Invalid input: session_id, transcript_path, hook_event_name, tool_name, and tool_input are required."
    );
  }

  if (!("url" in input["tool_input"]) || !("prompt" in input["tool_input"])) {
    throw new Error(
      "Invalid input: url and prompt are required in tool_input."
    );
  }

  return {
    hook_event_name: input.hook_event_name,
    session_id: input.session_id,
    transcript_path: input.transcript_path,
    tool_name: input.tool_name,
    tool_input: {
      url: input.tool_input.url,
      prompt: input.tool_input.prompt,
    },
  };
}

/**
 * Success. Claude Code does not see stdout.
 *
 * @param {string} [messageForUser=undefined]
 */
function exitSuccess(messageForUser = undefined) {
  if (messageForUser != null && messageForUser !== "") {
    console.log(messageForUser);
  }
  process.exit(0);
}

/**
 * Non-blocking error. Show stderr to the user but not to Claude.
 * This is a warning for the user, not for Claude.
 *
 * @param {string} [messageForUser=undefined]
 */
function exitWithWarningForUser(messageForUser = undefined) {
  if (messageForUser != null && messageForUser !== "") {
    // This is a warning for the user, not for Claude.
    console.error(messageForUser);
  }
  // Non-blocking error. Show stderr to the user but not to Claude.
  process.exit(1);
}

/**
 * Blocking error.
 * `stderr` is fed back to Claude to process automatically.
 *
 * @param {PreToolUseHookOutput} output
 */
function exitWithBlockingError(output) {
  console.log(JSON.stringify(output));
  process.exit(2);
}

/**
 * @typedef {Object} PreToolUseHookOutput
 * @property {boolean} [continue=true]
 *   Whether Claude should continue after hook execution.
 * @property {string} [stopReason]
 *   Message shown when continue is false. This is for the user, not for Claude.
 * @property {boolean} [suppressOutput=false]
 *   Hide stdout from transcript mode.
 * @property {"approve" | "block"} [decision=undefined]
 *  - `approve` bypasses the permission system. reason is shown to the user but not to Claude.
 *  - `block` prevents the tool call from executing. reason is shown to Claude.
 *  - `undefined` leads to the existing permission flow. reason is ignored.
 * @property {string} [reason]
 *   Reason for the decision. Shown to Claude and the user.
 */

/**
 * @param {ClaudePreToolUseHookWebFetchInput} input
 * @returns {void}
 */
function doWarnIfFetchingFromGitHub(input) {
  const rawUrl = input.tool_input.url;
  const url = new URL(rawUrl);
  const hostname = url.hostname.toLowerCase();

  if (hostname === "github.com") {
    // WIP: If Anthropic added a way to feedback non-blocking errors to Claude,
    // we can stop using HACK with internal_proceed.
    if (url.searchParams.get("internal_proceed") === "true") {
      return exitWithWarningForUser(
        "Agent requested to fetch from GitHub. Proceeding with the fetch."
      );
    }

    const messages = [
      `Fetching from ${hostname} is not recommended.`,
      "Try to use the GitHub CLI instead.",
      "If you still need to fetch from GitHub after considering this warning, ADD ?internal_proceed=true to the URL.",
    ];

    return exitWithBlockingError({
      decision: "block",
      reason: messages.join(" "),
      continue: true, // Continue execution
    });
  }
}

try {
  const rawInput = readFileSync(process.stdin.fd, "utf8");
  const input = parseInput(rawInput);

  doWarnIfFetchingFromGitHub(input);
} catch (error) {
  exitWithWarningForUser(
    "An error occurred while processing the web fetch request. Please check the input format and try again."
  );
}
