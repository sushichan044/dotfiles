#!/usr/bin/env -S deno run --allow-env --allow-read

import { readFileSync } from "node:fs";
import process from "node:process";
import { headingTreeOfMarkdownFile } from "../../../../ai/scripts/extract-md-heading.ts";
import $ from "jsr:@david/dax";
import * as v from "jsr:@valibot/valibot";
import {
  exitHook,
  PreToolUseOutput,
} from "../../../../ai/scripts/claude-code-hooks/output.ts";
import { preToolUseInputSchema } from "../../../../ai/scripts/claude-code-hooks/input.ts";

const getLineCount = async (path: string): Promise<number | null> => {
  const realPath = await Deno.realPath(path);

  if (!(await Deno.stat(realPath)).isFile) {
    return null;
  }

  const lines = await $`wc -l ${realPath}`.text();

  const numberRegex = /^\s*(\d+)\s/;
  const matches = lines.match(numberRegex);
  if (matches && matches?.length >= 2) {
    return parseInt(matches[1]!, 10);
  }

  return null;
};

const DO_NOT_READ_DIRECTLY_IF_LINES_OVER = 750;

const main = async () => {
  try {
    const rawInput = readFileSync(process.stdin.fd, "utf-8");

    const input = JSON.parse(rawInput);
    const parsed = v.parse(preToolUseInputSchema.Read, input);

    if (!parsed.tool_input.file_path.endsWith(".md")) {
      return exitHook.success();
    }

    const lines = await getLineCount(parsed.tool_input.file_path);
    if (lines == null || lines < DO_NOT_READ_DIRECTLY_IF_LINES_OVER) {
      return exitHook.success();
    }

    const headingTree = await headingTreeOfMarkdownFile(
      parsed.tool_input.file_path
    );

    return exitHook.errorForClaude<PreToolUseOutput>({
      continue: true,
      decision: "block",
      reason: [
        "Warning: The file is too long to read directly.",
        "Instead, I recommend you to read the file in smaller chunks or use a more efficient method.",
        "Here is the heading tree extracted from the file:",
        JSON.stringify(headingTree.root.children, null, 2),
      ].join("\n"),
    });
  } catch (error) {
    return exitHook.warnForUser(
      `Error reading file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

await main();
