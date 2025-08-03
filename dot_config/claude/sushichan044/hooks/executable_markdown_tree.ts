#!/usr/bin/env -S deno run --allow-env --allow-read --allow-run

import { headingTreeOfMarkdownFile } from "../../../../ai/scripts/extract-md-heading.ts";
import $ from "jsr:@david/dax";
import { defineHook } from "../../../../ai/scripts/claude-code-hooks/define.ts";
import { runHook } from "../../../../ai/scripts/claude-code-hooks/run.ts";

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

const hook = defineHook({
  trigger: {
    PreToolUse: {
      Read: true,
    },
  },
  run: async (c) => {
    if (!c.input.tool_input.file_path.endsWith(".md")) {
      return c.success();
    }

    const lines = await getLineCount(c.input.tool_input.file_path);
    if (lines == null || lines < DO_NOT_READ_DIRECTLY_IF_LINES_OVER) {
      return c.success();
    }

    const headingTree = await headingTreeOfMarkdownFile(
      c.input.tool_input.file_path
    );

    return c.blockingError({
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: [
        "Warning: The file is too long to read directly.",
        "Instead, I recommend you to read the file in smaller chunks or use a more efficient method.",
        "Here is the heading tree extracted from the file:",
        JSON.stringify(headingTree.root.children, null, 2),
      ].join("\n"),
    });
  },
});

await runHook(hook);
