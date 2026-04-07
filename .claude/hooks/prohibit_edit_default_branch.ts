import { defineHook } from "cc-hooks-ts";
import path from "pathe";

import {
  createIsGitIgnored,
  getCurrentGitBranch,
  getDefaultGitBranch,
  isRepositoryPublished,
} from "../../tools/git";
import { isNonEmptyString } from "../../tools/utils/string";

type GitRepoInfo = {
  currentBranch: string | null;
  defaultBranch: string | null;
  isPublished: boolean;
};

async function getGitRepoInfo(cwd: string): Promise<GitRepoInfo> {
  const [currentBranch, defaultBranch, isPublished] = await Promise.all([
    getCurrentGitBranch(cwd),
    getDefaultGitBranch(cwd),
    isRepositoryPublished(cwd),
  ]);
  return {
    currentBranch,
    defaultBranch,
    isPublished,
  };
}

const hook = defineHook({
  trigger: {
    PreToolUse: {
      Edit: true,
      Write: true,
    },
  },

  run: async (c) => {
    const cwd = c.input.cwd;
    const dest = c.input.tool_input.file_path;

    // If dest is not under cwd, skip
    const isDestOutside = !path.resolve(dest).startsWith(path.resolve(cwd));
    if (isDestOutside) {
      return c.success();
    }

    const isGitIgnored = createIsGitIgnored(cwd);
    if (await isGitIgnored(c.input.tool_input.file_path)) {
      return c.success();
    }

    const { currentBranch, defaultBranch, isPublished } = await getGitRepoInfo(cwd);
    if (!isPublished) {
      return c.success();
    }
    if (!isNonEmptyString(defaultBranch) || !isNonEmptyString(currentBranch)) {
      return c.success();
    }

    if (currentBranch === defaultBranch) {
      return c.json({
        event: "PreToolUse",
        output: {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason:
              "Editing on the default branch is prohibited. Switch to a new branch with `git switch -c <new-branch-name>` before making edits.",
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
