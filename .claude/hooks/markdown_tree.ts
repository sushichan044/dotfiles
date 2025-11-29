import { $ } from "bun";
import { defineHook } from "cc-hooks-ts";
import { realpath, stat } from "node:fs/promises";

import { headingTreeOfMarkdownFile } from "../../home/ai/scripts/extract-md-heading";

const getLineCount = async (path: string): Promise<number | null> => {
  const realPath = await realpath(path);

  if (!(await stat(realPath)).isFile()) {
    return null;
  }

  const lines = await $`wc -l ${realPath}`.text();

  const numberRegex = /^\s*(\d+)\s/;
  const matches = numberRegex.exec(lines);
  if (matches && matches?.length >= 2) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
      c.input.tool_input.file_path,
    );
    return c.json({
      event: "PreToolUse",
      output: {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: [
            "Warning: The file is too long to read directly.",
            "Instead, I recommend you to read the file in smaller chunks or use a more efficient method.",
            "Here is the heading tree extracted from the file:",
            JSON.stringify(headingTree.root.children, null, 2),
          ].join("\n"),
        },
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
