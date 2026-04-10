import { defineHook } from "cc-hooks-ts";

import { createShell } from "../../tools/utils/bun-sh";

const hook = defineHook({
  trigger: {
    WorktreeCreate: true,
    WorktreeRemove: true,
  },

  run: async (c) => {
    const sh = createShell({ cwd: c.input.cwd });

    switch (c.input.hook_event_name) {
      case "WorktreeCreate": {
        const wtName = c.input.name;

        // git wt --nocd prints the absolute path of the worktree
        const out = await sh`git wt ${wtName} --nocd`;
        const wtAbsPath = out.text().trim();
        console.log(wtAbsPath);
        return c.success();
      }
      case "WorktreeRemove": {
        const wtPath = c.input.worktree_path;

        // force delete
        const out = await sh`git wt -D ${wtPath}`;
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
