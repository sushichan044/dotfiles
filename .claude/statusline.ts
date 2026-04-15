import { Ansis } from "ansis";
import colorNames from "css-color-names";
import "temporal-polyfill-lite/global";
import getStdin from "get-stdin";
import os from "node:os";

import type { GitAheadBehind, GitWorkingTreeChangeSummary } from "../tools/git";
import {
  detectIfInsideWorktree,
  getGitAheadBehind,
  getCurrentGitBranch,
  getCurrentRepositoryName,
  getWorkingTreeChangeSummary,
} from "../tools/git";
import { isNonEmptyString } from "../tools/utils/string";

// 256 colors
const color = new Ansis(2).extend(colorNames);

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
    aheadBehind: GitAheadBehind | null;
    branch: string | null;
    workingTreeChanges: GitWorkingTreeChangeSummary | null;
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
          /**
           * @example 42.3
           */
          remainingTimePercentage: number;
          /**
           * @example 42.3
           */
          remainingTokenPercentage: number;
          resetsAt: Temporal.ZonedDateTime;
        };
        weekly: {
          /**
           * Percentage of the current rate limit window that has elapsed. Calculated based on the resetsAt time and the current time.
           *
           * @example 42.3
           */
          remainingTimePercentage: number;
          /**
           * @example 42.3
           */
          remainingTokenPercentage: number;
          resetsAt: Temporal.ZonedDateTime;
        };
      }
    | undefined;
  remainingContextPercentage: string | undefined;

  username: string;
  version: {
    current: string;
  };
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

function getTokyoTimeFromUnixEpochSec(epochSec: number): Temporal.ZonedDateTime {
  return Temporal.Instant.fromEpochMilliseconds(epochSec * 1000).toZonedDateTimeISO("Asia/Tokyo");
}

function calculateRemainingTimePercentage(
  resetsAt: Temporal.ZonedDateTime,
  windowDuration: Temporal.DurationLike,
  now = Temporal.Now.zonedDateTimeISO("Asia/Tokyo"),
): number {
  const windowStart = resetsAt.subtract(windowDuration);
  const windowMs = resetsAt.epochMilliseconds - windowStart.epochMilliseconds;
  const elapsedMs = now.epochMilliseconds - windowStart.epochMilliseconds;

  return Math.max(0, Math.min(100, ((windowMs - elapsedMs) / windowMs) * 100));
}

function buildRateLimitStatus(rateLimits: InputShape["rate_limits"]): StatusShape["rateLimit"] {
  if (!rateLimits) {
    return undefined;
  }

  const fiveHourResetsAt = getTokyoTimeFromUnixEpochSec(rateLimits.five_hour.resets_at);
  const weeklyResetsAt = getTokyoTimeFromUnixEpochSec(rateLimits.seven_day.resets_at);

  return {
    fiveHour: {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration#iso_8601_duration_format
      remainingTimePercentage: calculateRemainingTimePercentage(fiveHourResetsAt, "PT5H"),
      remainingTokenPercentage: 100 - rateLimits.five_hour.used_percentage,
      resetsAt: fiveHourResetsAt,
    },
    weekly: {
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration#iso_8601_duration_format
      remainingTimePercentage: calculateRemainingTimePercentage(weeklyResetsAt, "P7D"),
      remainingTokenPercentage: 100 - rateLimits.seven_day.used_percentage,
      resetsAt: weeklyResetsAt,
    },
  };
}

async function buildStatus(input: InputShape): Promise<StatusShape> {
  const userInfo = os.userInfo();
  const hostname = os.hostname();
  const [gitAheadBehind, gitBranch, repositoryName, workingTreeChanges, worktree] =
    await Promise.all([
      getGitAheadBehind(input.workspace.current_dir),
      getCurrentGitBranch(input.workspace.current_dir),
      getCurrentRepositoryName(input.workspace.current_dir),
      getWorkingTreeChangeSummary(input.workspace.current_dir),
      detectIfInsideWorktree(input.workspace.current_dir),
    ]);

  return {
    cwd: input.workspace.current_dir,
    git: {
      aheadBehind: gitAheadBehind,
      branch: gitBranch,
      repository: repositoryName,
      workingTreeChanges,
      worktree,
    },
    hostname,
    model: input.model.display_name,
    rateLimit: input.rate_limits ? buildRateLimitStatus(input.rate_limits) : undefined,
    remainingContextPercentage: input.context_window.remaining_percentage?.toLocaleString("ja-JP"),
    username: userInfo.username,
    version: {
      current: input.version,
    },
  };
}

export function formatGitWorkingTreeChanges(
  changes: GitWorkingTreeChangeSummary | null,
): string | null {
  if (!changes) {
    return null;
  }
  if (changes.added === 0 && changes.removed === 0) {
    return null;
  }

  return `${color.green(`+${changes.added}`)} / ${color.red(`-${changes.removed}`)}`;
}

export function formatGitAheadBehind(aheadBehind: GitAheadBehind | null): string | null {
  if (!aheadBehind) {
    return null;
  }
  if (aheadBehind.ahead === 0 && aheadBehind.behind === 0) {
    return null;
  }

  return `↑${aheadBehind.ahead} ↓${aheadBehind.behind}`;
}

function prettyPrint(status: StatusShape): string {
  const makeLineFromParts = (...parts: Array<string | null | undefined>) => {
    if (parts.every((part) => !isNonEmptyString(part))) {
      return null;
    }

    return color.grey(parts.filter(isNonEmptyString).join(" | "));
  };

  const repository = () => {
    const repoName = status.git.worktree.insideLinkedWorktree
      ? status.git.worktree.inferredRepoName
      : status.git.repository;

    if (!isNonEmptyString(repoName)) {
      return null;
    }

    return `${color.bold(NERD_ICONS.GIT_REPO)} ${repoName}`;
  };

  const branch = () => {
    if (!isNonEmptyString(status.git.branch)) {
      return null;
    }

    return `${color.bold(NERD_ICONS.GIT_BRANCH)} ${status.git.branch}`;
  };

  const workingTreeChanges = () => {
    return formatGitWorkingTreeChanges(status.git.workingTreeChanges);
  };

  const aheadBehind = () => {
    return formatGitAheadBehind(status.git.aheadBehind);
  };

  const worktree = () => {
    if (!status.git.worktree.insideLinkedWorktree) {
      return null;
    }

    return `${color.bold(NERD_ICONS.TREE)} worktree detected`;
  };

  const context = () => {
    const remaining = status.remainingContextPercentage;
    if (!isNonEmptyString(remaining)) {
      return null;
    }

    const aboutToAutoCompact = Number(remaining) < 30;
    const highlightedRemaining = aboutToAutoCompact
      ? color.darkkhaki(`${remaining}%`)
      : `${remaining}%`;

    return color.grey(`ctx `) + highlightedRemaining + color.grey(` left`);
  };

  const fiveHourLimit = () => {
    if (!status.rateLimit) {
      return null;
    }

    const remaining = (status.rateLimit.fiveHour.remainingTokenPercentage / 100).toLocaleString(
      "ja-JP",
      {
        style: "percent",
      },
    );
    const burningToken =
      status.rateLimit.fiveHour.remainingTokenPercentage <
      status.rateLimit.fiveHour.remainingTimePercentage;

    const resetsAt = status.rateLimit.fiveHour.resetsAt.toLocaleString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `5h ${burningToken ? color.darkkhaki(remaining) : remaining} left (${NERD_ICONS.REFRESH} ${resetsAt} JST)`;
  };

  const weeklyLimit = () => {
    if (!status.rateLimit) {
      return "";
    }

    const remaining = (status.rateLimit.weekly.remainingTokenPercentage / 100).toLocaleString(
      "ja-JP",
      {
        style: "percent",
      },
    );
    const burningToken =
      status.rateLimit.weekly.remainingTokenPercentage <
      status.rateLimit.weekly.remainingTimePercentage;

    const resetsAt = status.rateLimit.weekly.resetsAt.toLocaleString("ja-JP", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
    });
    return `7d ${burningToken ? color.darkkhaki(remaining) : remaining} left (${NERD_ICONS.REFRESH} ${resetsAt} JST)`;
  };

  const version = () => {
    return `v${status.version.current}`;
  };

  return [
    makeLineFromParts(version(), status.model, context()),
    makeLineFromParts(fiveHourLimit(), weeklyLimit()),
    makeLineFromParts(repository(), branch(), workingTreeChanges(), aheadBehind(), worktree()),
  ].join("\n");
}

if (import.meta.main) {
  const input = JSON.parse(await getStdin()) as InputShape;
  const status = await buildStatus(input);

  console.log("\n");
  console.log(prettyPrint(status));
}
