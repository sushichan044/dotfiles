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
  gitBranch: string | null;
  hostname: string;
  model: string;
  username: string;

  remainingContextPercentage: string | undefined;
};

function osc8Hyperlink(url: string, text: string): string {
  const OSC = "\u001B]";
  const ST = "\u001B\\";
  return `${OSC}8;;${url}${ST}${text}${OSC}8;;${ST}`;
}

async function getCurrentGitBranch(cwd: string): Promise<string | null> {
  const result = await Bun.$`git -C ${cwd} branch --show-current`.nothrow().quiet();
  if (result.exitCode === 0) {
    return result.text().trim();
  }
  return null;
}

async function buildStatus(input: InputShape): Promise<StatusShape> {
  const userInfo = os.userInfo();
  const hostname = os.hostname();
  const gitBranch = await getCurrentGitBranch(input.workspace.current_dir);

  return {
    cwd: input.workspace.current_dir,
    gitBranch,
    hostname,
    model: input.model.display_name,
    remainingContextPercentage: input.context_window.remaining_percentage?.toLocaleString("ja-JP"),
    username: userInfo.username,
  };
}

function prettyPrint(status: StatusShape): string {
  const delimiter = pc.dim("|");
  const model = pc.dim(status.model);

  const branch = () => {
    // https://www.nerdfonts.com/cheat-sheet
    const branchIcon = pc.bold(pc.dim("\uf418"));
    return pc.dim(
      isNonEmptyString(status.gitBranch)
        ? `${branchIcon} ${status.gitBranch}`
        : `${branchIcon} no git`,
    );
  };

  const pathname = () => {
    const lastPath = status.cwd.split("/").at(-1) ?? "";
    return osc8Hyperlink(status.cwd, lastPath);
  };

  const context = () => {
    const remaining = status.remainingContextPercentage;
    if (!isNonEmptyString(remaining)) {
      return "";
    }

    const left = pc.dim(`${remaining}% ctx left`);
    const aboutToAutoCompact = Number(remaining) < 30;
    return aboutToAutoCompact ? `${left} ${pc.yellow(`auto-compact soon`)}` : left;
  };

  const parts = [model, context()].filter(isNonEmptyString);
  const secondLine = [pathname(), branch()];

  return [parts.join(` ${delimiter} `), secondLine.join(` ${delimiter} `)].join("\n");
}

if (import.meta.main) {
  const input = JSON.parse(await getStdin()) as InputShape;
  const status = await buildStatus(input);

  console.log("\n");
  console.log(prettyPrint(status));
}
