// @ts-check
/**
 * @fileoverview
 *   Utility functions for GitHub URL parsing and gh CLI command generation.
 */

import { regex } from "arkregex";
import { check as isReservedNameByGitHub } from "github-reserved-names";

export type GitHubPathType =
  | { filename: string; type: "workflow" }
  | { isLatest: true; type: "release" }
  | { isList: true; type: "release" }
  | { runId: string; type: "run" }
  | { tag: string; type: "release" };

export interface GitHubRepoInfo {
  name: string;
  owner: string;
  restPaths: string[];
}

export interface GitHubIssueOrPR {
  number: number;
  subpath?: string;
  type: "issue" | "pr";
}

export interface GistInfo {
  filename?: string;
  gistId: string;
}

export type GhCommandResult = {
  /**
   * @example
   * `gh pr view 123 --repo owner/repo`
   */
  command: string;
  type:
    | "gist"
    | "issue"
    | "pr"
    | "pr-diff"
    | "release"
    | "repo"
    | "run"
    | "workflow";
};

export function extractGitHubRepo(url: URL): GitHubRepoInfo | null {
  const [owner, name, ...rest] = url.pathname
    .split("/")
    .map((part) => decodeURIComponent(part).trim())
    .filter((part) => part.length > 0);
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!owner || !name) return null;
  if (isReservedNameByGitHub(owner)) {
    return null;
  }

  return { name, owner, restPaths: rest };
}

const issueRegex = regex(
  "/(?<type>issues|pull)/(?<number>\\d+)(?<subpath>/.*)?$",
);

export function extractGitHubIssueOrPRNumber(url: URL): GitHubIssueOrPR | null {
  const match = issueRegex.exec(url.pathname);
  if (!match?.groups) {
    return null;
  }

  return {
    number: parseInt(match.groups.number, 10),
    subpath: match.groups.subpath,
    type: match.groups.type === "issues" ? "issue" : "pr",
  };
}

export function matchGitHubPath(pathSegments: string[]): GitHubPathType | null {
  const [first, second, ...rest] = pathSegments;

  // Handle releases
  if (first === "releases") {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (second === "tag" && rest[0]) {
      return { tag: rest[0], type: "release" };
    }
    if (second === "latest") {
      return { isLatest: true, type: "release" };
    }
    // /releases or /releases/ case
    return { isList: true, type: "release" };
  }

  // Handle actions (workflows and runs)
  if (first === "actions") {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (second === "workflows" && rest[0]) {
      return { filename: rest[0], type: "workflow" };
    }
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (second === "runs" && rest[0]) {
      return { runId: rest[0], type: "run" };
    }
  }

  return null;
}

export function generateGhCommand(
  pathMatch: GitHubPathType,
  repo: { name: string; owner: string },
): string {
  switch (pathMatch.type) {
    case "release": {
      if ("tag" in pathMatch) {
        return `gh release view ${pathMatch.tag} --repo ${repo.owner}/${repo.name}`;
      }
      if ("isLatest" in pathMatch) {
        return `gh release view --repo ${repo.owner}/${repo.name}`;
      }
      // isList
      return `gh release list --repo ${repo.owner}/${repo.name}`;
    }

    case "run":
      return `gh run view ${pathMatch.runId} --repo ${repo.owner}/${repo.name}`;

    case "workflow":
      return `gh workflow view ${pathMatch.filename} --repo ${repo.owner}/${repo.name}`;
  }
}

export function extractGistInfo(url: URL): GistInfo | null {
  const parts = url.pathname.split("/").filter((part) => part.length > 0);
  if (parts.length < 2) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const gistId = parts[1]!;

  let filename: string | undefined;
  if (url.hash?.startsWith("#file-")) {
    filename = url.hash.slice(6).replace(/-/g, ".");
  }

  return { filename, gistId };
}

export function isRawContentURL(url: URL): boolean {
  if (
    url.hostname === "raw.githubusercontent.com" ||
    url.hostname === "gist.githubusercontent.com"
  ) {
    return true;
  }

  return false;
}

export function parseGitHubUrlToGhCommand(url: URL): GhCommandResult | null {
  if (isRawContentURL(url)) {
    return null;
  }

  if (url.hostname === "gist.github.com") {
    const gistInfo = extractGistInfo(url);
    if (!gistInfo) {
      return null;
    }

    const cmd: string[] = ["gh", "gist", "view", gistInfo.gistId];
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (gistInfo.filename) {
      cmd.push("--filename", gistInfo.filename);
    }

    return {
      command: cmd.join(" "),
      type: "gist",
    };
  }

  if (url.hostname === "github.com") {
    const repo = extractGitHubRepo(url);
    if (!repo) {
      return null;
    }

    if (repo.restPaths.length === 0) {
      const command = `gh repo view ${repo.owner}/${repo.name}`;
      return {
        command,
        type: "repo",
      };
    }

    const issueOrPR = extractGitHubIssueOrPRNumber(url);
    if (issueOrPR) {
      let command: string;
      let type: GhCommandResult["type"];

      if (issueOrPR.type === "pr") {
        if (issueOrPR.subpath === "/files") {
          command = `gh pr diff ${issueOrPR.number} --repo ${repo.owner}/${repo.name}`;
          type = "pr-diff";
        } else {
          command = `gh pr view ${issueOrPR.number} --repo ${repo.owner}/${repo.name}`;
          type = "pr";
        }
      } else {
        command = `gh issue view ${issueOrPR.number} --repo ${repo.owner}/${repo.name}`;
        type = "issue";
      }

      return {
        command,
        type,
      };
    }

    const pathMatch = matchGitHubPath(repo.restPaths);
    if (pathMatch) {
      const command = generateGhCommand(pathMatch, repo);
      return {
        command,
        type: pathMatch.type,
      };
    }
  }

  return null;
}
