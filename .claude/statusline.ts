import getStdin from "get-stdin";
import os from "node:os";
import pc from "picocolors";

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
  model: {
    display_name: string;
    id: string;
  };
  output_style: {
    name: string;
  };
  session_id: string;
  /**
   * Absolute path to the transcript file where the full conversation is logged.
   */
  transcript_path: string;
  version: string;
  workspace: {
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
  hostname: string;
  username: string;

  remainingContextPercentage: string | undefined;
};

function buildStatus(input: InputShape): StatusShape {
  const userInfo = os.userInfo();
  const cwdFromHome = input.cwd.replace(userInfo.homedir, "");
  const hostname = os.hostname();

  return {
    cwd: cwdFromHome,
    hostname,
    remainingContextPercentage: input.context_window.remaining_percentage?.toLocaleString("ja-JP"),
    username: userInfo.username,
  };
}

function formatCwd(cwd: string, maxLength: number): string {
  if (cwd.length <= maxLength) {
    return cwd;
  }

  const trimmedCwd = cwd.startsWith("/") ? cwd.slice(1) : cwd;
  const [first, ...rest] = trimmedCwd.split("/");
  if (!isNonEmptyString(first)) {
    return cwd;
  }

  const parts: string[] = [];
  let budget = maxLength - first.length - 7; // 7 for "~/" and "/.../"

  const fragments = rest.toReversed();
  while (budget > 0) {
    const next = fragments.shift();

    if (isNonEmptyString(next)) {
      parts.push(next);
      budget -= next.length + 1; // 1 for "/"
    }
  }

  return `~/${first}/.../${parts.toReversed().join("/")}`;
}

function prettyPrint(status: StatusShape): string {
  const formattedCwd = formatCwd(status.cwd, 35);

  const user = pc.dim(`${status.username}@${status.hostname}`);
  const path = pc.dim(formattedCwd);

  const delimiter = pc.dim("|");

  const remaining = isNonEmptyString(status.remainingContextPercentage)
    ? pc.dim(`${status.remainingContextPercentage}% ctx left`)
    : "";

  const parts = [user, path, remaining].filter(isNonEmptyString);

  return parts.join(` ${delimiter} `);
}

if (import.meta.main) {
  const input = JSON.parse(await getStdin()) as InputShape;
  const status = buildStatus(input);

  console.log("\n");
  console.log(prettyPrint(status));
}
