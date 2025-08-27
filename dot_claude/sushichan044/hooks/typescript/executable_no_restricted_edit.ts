import { defineHook, runHook } from "cc-hooks-ts";
import { extname } from "pathe";

type Edit = {
  new_string: string;
  old_string: string;
  replace_all?: boolean;
};

type Rule = {
  restrictedSyntax: string[];
};

const includesRestrictedEdit = (edits: Edit[], rule: Rule) => {
  return edits.some((edit) =>
    rule.restrictedSyntax.some((restrictedEdit) =>
      edit.new_string.includes(restrictedEdit),
    ),
  );
};

const isExtension = (path: string, patterns: string[]) => {
  return patterns.includes(extname(path));
};

const hook = defineHook({
  trigger: {
    PreToolUse: {
      Edit: true,
      MultiEdit: true,
    },
  },

  run: (c) => {
    const toolInput = c.input.tool_input;

    if (
      !isExtension(toolInput.file_path, [
        ".ts",
        ".cts",
        ".mts",
        ".tsx",
        ".vue",
        ".svelte",
        ".astro",
      ])
    ) {
      return c.success();
    }

    const edits =
      "edits" in toolInput
        ? toolInput.edits
        : [
            {
              new_string: toolInput.new_string,
              old_string: toolInput.old_string,
              replace_all: toolInput.replace_all,
            },
          ];

    if (
      includesRestrictedEdit(edits, {
        restrictedSyntax: [
          // type assertion
          "as any",
          "as unknown",
          // type annotation
          ": any",
          ": unknown",
        ],
      })
    ) {
      return c.json({
        event: "PreToolUse",
        output: {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason:
              "Do not use 'as any' or 'as unknown' to suppress type checking. Get diagnostics from IDE and use correct types.",
          },
        },
      });
    }

    return c.success();
  },
});

await runHook(hook);
