import { regex } from "arkregex";
import { defineHook } from "cc-hooks-ts";

import { isNonEmptyString } from "../../tools/utils/string";

async function getCurrentGitBranch(cwd: string): Promise<string | null> {
  const result = await Bun.$`git -C ${cwd} symbolic-ref --short HEAD`.nothrow().quiet();
  if (result.exitCode === 0) {
    return result.text().trim();
  }
  return null;
}

const headBranchRegex = regex("HEAD branch: (.+)");
async function getDefaultGitBranch(cwd: string): Promise<string | null> {
  const result = await Bun.$`git -C ${cwd} remote show origin`.nothrow().quiet();
  if (result.exitCode === 0) {
    const output = result.text();
    const match = headBranchRegex.exec(output);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
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

    const defaultBranch = await getDefaultGitBranch(cwd);
    const currentBranch = await getCurrentGitBranch(cwd);
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
