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

        // git wt --nocd prints the absolute path of the worktree
        const out = await Bun.$`git wt ${wtName} --nocd`.nothrow().quiet();
        const wtAbsPath = out.text().trim();

        return c.json({
          event: "WorktreeCreate",
          output: {
            hookSpecificOutput: {
              hookEventName: "WorktreeCreate",
              worktreePath: wtAbsPath,
            },
          },
        });
      }
      case "WorktreeRemove": {
        const wtPath = c.input.worktree_path;

        // force delete
        const out = await Bun.$`git wt -D ${wtPath}`.nothrow().quiet();
        if (out.exitCode !== 0) {
          return c.nonBlockingError(
            `Failed to remove worktree at ${wtPath}: ${out.stderr.toString()}`,
          );
        }

        return c.success();
      }
    }
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
