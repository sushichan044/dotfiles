import getStdin from "get-stdin";
import os from "node:os";
import pc from "picocolors";
import "temporal-polyfill-lite/global";

import { isNonEmptyString } from "../tools/utils/string";

type InputShape = {
  context_window: {
    context_window_size: number;
    current_usage: {
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
      input_tokens: number;
      output_tokens: number;
    } | null;

    total_input_tokens: number;
    total_output_tokens: number;

    remaining_percentage: number | null;
    used_percentage: number | null;
  };
  cost: {
    total_api_duration_ms: number;
    total_cost_usd: number;
    total_duration_ms: number;
    total_lines_added: number;
    total_lines_removed: number;
  };
  cwd: string;
  exceeds_200k_tokens: boolean;
  model: {
    display_name: string;
    id: string;
  };
  output_style: {
    name: string;
  };
  rate_limits?: {
    five_hour: {
      /**
       * @example 1774029600
       */
      resets_at: number;
      /**
       * @example 42.3
       */
      used_percentage: number;
    };
    seven_day: {
      /**
       * @example 1774029600
       */
      resets_at: number;
      /**
       * @example 42.3
       */
      used_percentage: number;
    };
  };
  session_id: string;
  /**
   * Absolute path to the transcript file where the full conversation is logged.
   */
  transcript_path: string;
  version: string;
  workspace: {
    added_dirs: string[];
    /**
     * Absolute path to the current working directory where Claude is running.
     */
    current_dir: string;
    /**
     * Absolute path to the root directory of the project Claude is operating in.
     */
    project_dir: string;
  };
};

type StatusShape = {
  cwd: string;
  git: {
    branch: string | null;
    /**
     * @example "dotfiles"
     */
    repository: string | null;

    worktree: WorktreeStatus;
  };
  hostname: string;
  model: string;
  rateLimit:
    | {
        fiveHour: {
          remainingPercentage: number;
          resetsAt: Temporal.ZonedDateTime;
        };
        weekly: {
          remainingPercentage: number;
          resetsAt: Temporal.ZonedDateTime;
        };
      }
    | undefined;
  remainingContextPercentage: string | undefined;
  username: string;
};

type WorktreeStatus =
  | {
      /**
       * In a linked worktree, `git rev-parse --show-toplevel` points at the top of the linked worktree, so we cannot get the repo name.
       *
       * Instead, we can infer the repo name by looking at the common git dir, which still points to the main worktree.
       */
      inferredRepoName: string | null;
      insideLinkedWorktree: true;
    }
  | { insideLinkedWorktree: false };

/**
 * @see https://www.nerdfonts.com/cheat-sheet for icons to use in the status line.
 */
const NERD_ICONS = {
  GIT_BRANCH: "\uf418",
  GIT_REPO: "\uf401",
  REFRESH: "\ue348",
  TREE: "\uf1bb",
} as const;

// wrap Bun shell to always return result object and never prints to stdout/stderr directly
const sh = async (strings: TemplateStringsArray, ...expressions: Bun.ShellExpression[]) =>
  Bun.$(strings, ...expressions)
    .nothrow()
    .quiet();

async function getCurrentGitBranch(cwd: string): Promise<string | null> {
  const result = await sh`git -C ${cwd} branch --show-current`;
  if (result.exitCode === 0) {
    return result.text().trim();
  }
  return null;
}

async function getCurrentRepositoryName(cwd: string): Promise<string | null> {
  const result = await sh`git -C ${cwd} rev-parse --show-toplevel`;
  if (result.exitCode === 0) {
    const repoPath = result.text().trim();
    return repoPath.split("/").at(-1) ?? null;
  }
  return null;
}

async function detectWorktree(cwd: string): Promise<WorktreeStatus> {
  const [gitDir, commonGitDir] = await Promise.all([
    sh`git -C ${cwd} rev-parse --git-dir`,
    sh`git -C ${cwd} rev-parse --git-common-dir`,
  ]);

  if (gitDir.exitCode === 0 && commonGitDir.exitCode === 0) {
    const gitDirText = gitDir.text().trim();
    const commonGitDirText = commonGitDir.text().trim();
    // get `repo` from /path/to/repo/.git
    const inferredRepoName = commonGitDirText.split("/").at(-2) ?? null;

    return { inferredRepoName, insideLinkedWorktree: gitDirText !== commonGitDirText };
  }

  return { insideLinkedWorktree: false };
}

function getTokyoTimeFromUnixEpochSec(epochSec: number): Temporal.ZonedDateTime {
  return Temporal.Instant.fromEpochMilliseconds(epochSec * 1000).toZonedDateTimeISO("Asia/Tokyo");
}

async function buildStatus(input: InputShape): Promise<StatusShape> {
  const userInfo = os.userInfo();
  const hostname = os.hostname();
  const [gitBranch, repositoryName, worktree] = await Promise.all([
    getCurrentGitBranch(input.workspace.current_dir),
    getCurrentRepositoryName(input.workspace.current_dir),
    detectWorktree(input.workspace.current_dir),
  ]);

  return {
    cwd: input.workspace.current_dir,
    git: {
      branch: gitBranch,

      repository: repositoryName,
      worktree,
    },
    hostname,
    model: input.model.display_name,
    rateLimit: input.rate_limits
      ? {
          fiveHour: {
            remainingPercentage: 100 - input.rate_limits.five_hour.used_percentage,
            resetsAt: getTokyoTimeFromUnixEpochSec(input.rate_limits.five_hour.resets_at),
          },
          weekly: {
            remainingPercentage: 100 - input.rate_limits.seven_day.used_percentage,
            resetsAt: getTokyoTimeFromUnixEpochSec(input.rate_limits.seven_day.resets_at),
          },
        }
      : undefined,
    remainingContextPercentage: input.context_window.remaining_percentage?.toLocaleString("ja-JP"),
    username: userInfo.username,
  };
}

function prettyPrint(status: StatusShape): string {
  const delimiter = pc.dim("|");
  const model = pc.dim(status.model);

  const repository = () => {
    const repoIcon = pc.bold(pc.dim(NERD_ICONS.GIT_REPO));
    const repoName = status.git.worktree.insideLinkedWorktree
      ? status.git.worktree.inferredRepoName
      : status.git.repository;

    if (!isNonEmptyString(repoName)) {
      return null;
    }

    return pc.dim(`${repoIcon} ${repoName}`);
  };

  const branch = () => {
    const branchIcon = pc.bold(pc.dim(NERD_ICONS.GIT_BRANCH));
    if (!isNonEmptyString(status.git.branch)) {
      return null;
    }
    return pc.dim(`${branchIcon} ${status.git.branch}`);
  };

  const worktree = () => {
    if (!status.git.worktree.insideLinkedWorktree) {
      return null;
    }
    const treeIcon = pc.bold(pc.dim(NERD_ICONS.TREE));
    return pc.dim(`${treeIcon} worktree detected`);
  };

  const context = () => {
    const remaining = status.remainingContextPercentage;
    if (!isNonEmptyString(remaining)) {
      return "";
    }

    const left = pc.dim(`ctx ${remaining}% left`);
    const aboutToAutoCompact = Number(remaining) < 30;
    return aboutToAutoCompact ? `${left} ${pc.yellow(`auto-compact soon`)}` : left;
  };

  const fiveHourLimit = () => {
    if (!status.rateLimit) {
      return "";
    }

    const remaining = status.rateLimit.fiveHour.remainingPercentage.toLocaleString("ja-JP");
    const resetsAt = status.rateLimit.fiveHour.resetsAt.toLocaleString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const text = `5h ${remaining}% left (${NERD_ICONS.REFRESH} ${resetsAt} JST)`;
    if (status.rateLimit.fiveHour.remainingPercentage < 20) {
      return pc.red(text);
    }
    if (status.rateLimit.fiveHour.remainingPercentage < 50) {
      return pc.yellow(text);
    }
    return pc.dim(text);
  };

  const weeklyLimit = () => {
    if (!status.rateLimit) {
      return "";
    }

    const remaining = status.rateLimit.weekly.remainingPercentage.toLocaleString("ja-JP");
    const resetsAt = status.rateLimit.weekly.resetsAt.toLocaleString("ja-JP", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
    });
    const text = `7d ${remaining}% left (${NERD_ICONS.REFRESH} ${resetsAt} JST)`;
    if (status.rateLimit.weekly.remainingPercentage < 20) {
      return pc.red(text);
    }
    if (status.rateLimit.weekly.remainingPercentage < 50) {
      return pc.yellow(text);
    }
    return pc.dim(text);
  };

  const parts = [model, context()].filter(isNonEmptyString);
  const limitParts = [fiveHourLimit(), weeklyLimit()].filter(isNonEmptyString);
  const fsAndGitStatus = [repository(), branch(), worktree()].filter(isNonEmptyString);

  return [
    parts.join(` ${delimiter} `),
    limitParts.length > 0 ? limitParts.join(` ${delimiter} `) : null,
    fsAndGitStatus.join(` ${delimiter} `),
  ].join("\n");
}

if (import.meta.main) {
  const input = JSON.parse(await getStdin()) as InputShape;
  const status = await buildStatus(input);

  console.log("\n");
  console.log(prettyPrint(status));
}
