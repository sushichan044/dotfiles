import { regex } from "arkregex";

import { createShell } from "./utils/bun-sh";
import { isNonEmptyString } from "./utils/string";

const sh = createShell();

export async function getCurrentGitBranch(cwd: string): Promise<string | null> {
  const result = await sh`git -C ${cwd} branch --show-current`;
  if (result.exitCode === 0) {
    return result.text().trim();
  }
  return null;
}

const headBranchRegex = regex("HEAD branch: (.+)");
export async function getDefaultGitBranch(cwd: string): Promise<string | null> {
  const result = await sh`git -C ${cwd} remote show origin`;
  if (result.exitCode === 0) {
    const output = result.text();
    const match = headBranchRegex.exec(output);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

export async function getCurrentRepositoryName(cwd: string): Promise<string | null> {
  const result = await sh`git -C ${cwd} rev-parse --show-toplevel`;
  if (result.exitCode === 0) {
    const repoPath = result.text().trim();
    return repoPath.split("/").at(-1) ?? null;
  }
  return null;
}

export async function isRepositoryPublished(cwd: string): Promise<boolean> {
  const result = await sh`git -C ${cwd} remote`;
  return result.exitCode === 0 && result.text().trim().length > 0;
}

export type GitWorkingTreeChangeSummary = {
  added: number;
  removed: number;
};

export type GitAheadBehind = {
  ahead: number;
  behind: number;
};

export async function getWorkingTreeChangeSummary(
  cwd: string,
): Promise<GitWorkingTreeChangeSummary | null> {
  const result = await sh`git -C ${cwd} diff --numstat HEAD`;
  if (result.exitCode !== 0) {
    return null;
  }

  return parseGitNumstatOutput(result.text());
}

export async function getGitAheadBehind(cwd: string): Promise<GitAheadBehind | null> {
  const result = await sh`git -C ${cwd} rev-list --left-right --count @{upstream}...HEAD`;
  if (result.exitCode !== 0) {
    return null;
  }

  return parseGitAheadBehindOutput(result.text());
}

export function parseGitNumstatOutput(output: string): GitWorkingTreeChangeSummary {
  let added = 0;
  let removed = 0;

  for (const line of output.split("\n")) {
    const [addedText, removedText] = line.trim().split(/\s+/, 3);
    const parsedAdded = Number.parseInt(addedText ?? "", 10);
    const parsedRemoved = Number.parseInt(removedText ?? "", 10);

    if (Number.isNaN(parsedAdded) || Number.isNaN(parsedRemoved)) {
      continue;
    }

    added += parsedAdded;
    removed += parsedRemoved;
  }

  return { added, removed };
}

export function parseGitAheadBehindOutput(output: string): GitAheadBehind | null {
  const [behindText, aheadText] = output.trim().split(/\s+/, 2);
  const behind = Number.parseInt(behindText ?? "", 10);
  const ahead = Number.parseInt(aheadText ?? "", 10);

  if (Number.isNaN(behind) || Number.isNaN(ahead)) {
    return null;
  }

  return { ahead, behind };
}

export function createIsGitIgnored(cwd: string): (...filePaths: string[]) => Promise<boolean> {
  return async (...filePaths) => {
    const result = await sh`git -C ${cwd} check-ignore ${filePaths.join(" ")}`;
    return result.exitCode === 0;
  };
}

type WorktreeInfo =
  | {
      /**
       * In a linked worktree, `git rev-parse --show-toplevel` points at the top of the linked worktree, so we cannot get the repo name.
       *
       * Instead, we can infer the repo name by looking at the common git dir, which still points to the main worktree.
       */
      inferredRepoName: string | null;
      insideLinkedWorktree: true;
      /**
       * The root of the main worktree, which is where the .git directory lives. This is used for tools that need to access git metadata, like the Git tool or the ProhibitEditDefaultBranch hook.
       */
      mainRepoRoot: string;
      /**
       * The root of the linked worktree, which is where the worktree-specific files live. This is used for tools that need to access files within the worktree.
       */
      worktreeRoot: string;
    }
  | { insideLinkedWorktree: false };

export async function detectIfInsideWorktree(cwd: string): Promise<WorktreeInfo> {
  const [gitDir, commonGitDir, currentBranch] = await Promise.all([
    sh`git -C ${cwd} rev-parse --git-dir`,
    sh`git -C ${cwd} rev-parse --git-common-dir`,
    getCurrentGitBranch(cwd),
  ]);

  if (gitDir.exitCode === 0 && commonGitDir.exitCode === 0) {
    const gitDirText = gitDir.text().trim();
    const commonGitDirText = commonGitDir.text().trim();
    // get `repo` from /path/to/repo/.git
    const mainRepoRoot = commonGitDirText.split("/").slice(0, -1).join("/");
    const inferredRepoName = mainRepoRoot.split("/").at(-1) ?? null;

    const worktreeRoot = await getWorktreeRootFromName(cwd, currentBranch ?? "");
    if (!isNonEmptyString(worktreeRoot)) {
      throw new Error(`Failed to get worktree root for branch ${currentBranch}`);
    }

    return {
      inferredRepoName,
      insideLinkedWorktree: gitDirText !== commonGitDirText,
      mainRepoRoot,
      worktreeRoot,
    };
  }

  return { insideLinkedWorktree: false };
}

/**
 * Get the absolute path of the worktree root for a given branch name. This is used to determine the correct worktree root when inside a linked worktree, since `git rev-parse --show-toplevel` will point to the linked worktree root instead of the main worktree root.
 */
async function getWorktreeRootFromName(cwd: string, branch: string): Promise<string | null> {
  const result = await sh`git -C ${cwd} wt ${branch} --nocd`;
  if (result.exitCode === 0) {
    return result.text().trim();
  }
  return null;
}
