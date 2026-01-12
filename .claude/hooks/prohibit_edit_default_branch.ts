import { regex } from "arkregex";
import { defineHook } from "cc-hooks-ts";
import path from "pathe";

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

function createIsGitIgnored(cwd: string): (...filePaths: string[]) => Promise<boolean> {
  return async (...filePaths) => {
    const result = await Bun.$`git -C ${cwd} check-ignore ${filePaths.join(" ")}`.nothrow().quiet();
    return result.exitCode === 0;
  };
}

async function isRepositoryPublished(cwd: string): Promise<boolean> {
  const result = await Bun.$`git -C ${cwd} remote`.nothrow().quiet();
  return result.exitCode === 0 && result.text().trim().length > 0;
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

    // Allow if the repository is not published yet
    if (!(await isRepositoryPublished(cwd))) {
      return c.success();
    }

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
