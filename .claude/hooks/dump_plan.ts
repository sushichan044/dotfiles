import { defineHook } from "cc-hooks-ts";
import * as prettier from "prettier";

type DumpResult = {
  isError: boolean;
  message: string;
};

async function dumpPlanToNote(plan: string): Promise<DumpResult> {
  const result = await Bun.$`memo new claude-plan`.nothrow().quiet(); // stdout will break claude code
  if (result.exitCode !== 0) {
    const stderrText = result.stderr.toString("utf-8");

    return {
      isError: true,
      message: `Failed to create a new memo note. Exit code: ${result.exitCode}. Stderr: ${stderrText}`,
    };
  }

  const filepath = result.text().trim();
  try {
    await Bun.write(filepath, plan);
  } catch (error) {
    return {
      isError: true,
      message: `Failed to write plan to memo note at ${filepath}. Error: ${String(error)}`,
    };
  }

  return {
    isError: false,
    message: `Plan dumped to note file at ${filepath}`,
  };
}

async function formatPlan(plan: string): Promise<string> {
  try {
    return await prettier.format(plan, {
      parser: "markdown",
    });
  } catch {
    return plan;
  }
}

const hook = defineHook({
  run: async (c) => {
    const plan = c.input.tool_input["plan"] as string;
    const formattedPlan = await formatPlan(plan);
    const result = await dumpPlanToNote(formattedPlan);

    return c.success({
      messageForUser: result.message,
    });
  },
  trigger: {
    PreToolUse: {
      ExitPlanMode: true,
    },
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
