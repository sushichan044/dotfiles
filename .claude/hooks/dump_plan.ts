import { defineHook } from "cc-hooks-ts";
import { format } from "oxfmt";

async function dumpPlanToNote(plan: string): Promise<string> {
  const result = await Bun.$`memo new claude-plan`.nothrow().quiet(); // stdout will break claude code
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

  run: async (c) => {
    const plan = c.input.tool_input["plan"] as string;
    const prettyPlan = await formatPlan(plan);
    const message = await dumpPlanToNote(prettyPlan);

    return c.success({ messageForUser: message });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
