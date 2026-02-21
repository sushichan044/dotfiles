import { defineHook } from "cc-hooks-ts";

const hook = defineHook({
  trigger: {
    WorktreeCreate: true,
    WorktreeRemove: true,
  },

  run: async (c) => {
    switch (c.input.hook_event_name) {
      case "WorktreeCreate": {
        const wtName = c.input.name;

        // Preparing worktree (new branch 'this-is-a-test')
        // HEAD is now at d2b2210 2.1.50
        // /{workspaceRoot}/.wt/this-is-a-test
        const out = await Bun.$`git wt ${wtName} --no-cd`.nothrow().quiet();

        const wtAbsPath = getLastLine(out.text()).trim();
        console.log(wtAbsPath);
        return c.success();
      }
      case "WorktreeRemove": {
        const wtPath = c.input.worktree_path;

        await Bun.$`git wt -d ${wtPath}`.nothrow().quiet();
        return c.success();
      }
    }
  },
});

function getLastLine(text: string): string {
  const lines = text.trim().split(/\r?\n/);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return lines[lines.length - 1]!;
}

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
