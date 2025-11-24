import { defineHook } from "cc-hooks-ts";
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

    const edits = [
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
              "Do not use type assertion or type annotation with 'any' or 'unknown' to suppress type checking. Remove type assertion / annotation and get diagnostics from IDE or tsc, then use correct types.",
          },
        },
      });
    }

    return c.success();
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
