import { defineHook } from "cc-hooks-ts";
import { format } from "oxfmt";

import type { Shell } from "../../../tools/utils/bun-sh";

import { prepareShell } from "../../../tools/utils/bun-sh";

async function dumpPlanToNote(sh: Shell, plan: string): Promise<string> {
  const result = await sh`sidetable memo claude-plan`;
  if (result.exitCode !== 0) {
    const stderrText = result.stderr.toString("utf-8");

    return `Failed to create a new memo note. Exit code: ${result.exitCode}. Stderr: ${stderrText}`;
  }

  const filepath = result.text().trim();
  try {
    await Bun.write(filepath, plan);
  } catch (error) {
    return `Failed to write plan to memo note at ${filepath}. Error: ${String(error)}`;
  }

  return `Plan dumped to note file at ${filepath}`;
}

async function formatPlan(plan: string): Promise<string> {
  try {
    const pretty = await format("dummy.md", plan);
    return pretty.code;
  } catch {
    return plan;
  }
}

const hook = defineHook({
  trigger: {
    PreToolUse: {
      ExitPlanMode: true,
    },
  },

  run: (c) =>
    c.defer(async () => {
      const plan = c.input.tool_input["plan"] as string;
      const sh = prepareShell({ cwd: c.input.cwd });

      const prettyPlan = await formatPlan(plan);
      const message = await dumpPlanToNote(sh, prettyPlan);

      return {
        event: "PreToolUse",
        output: {
          systemMessage: message,
        },
      };
    }),
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
