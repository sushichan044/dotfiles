// @ts-check
/**
 * @fileoverview
 *   Utility functions for GitHub URL parsing and gh CLI command generation.
 */

import { parse } from "args-tokens";
import { check as isReservedNameByGitHub } from "github-reserved-names";
import { parse as parseIntoArray } from "shell-quote";

import type { MaybeLiteral } from "./utils/types";

import { isRawContentURL } from "./url";
import { isNonEmptyString } from "./utils/string";

export type GitHubPathType =
  | { filename: string; type: "workflow" }
  | { isLatest: true; type: "release" }
  | { isList: true; type: "release" }
  | { number: number; subpath?: string; type: "issue" | "pr" }
  | { runId: string; type: "run" }
  | { tag: string; type: "release" };

interface GitHubRepoInfo {
  name: string;
  owner: string;
  restPaths: string[];
}

interface GistInfo {
  filename?: string;
  gistId: string;
}

type GhCommandResult = {
  /**
   * @example
   * `gh pr view 123 --repo owner/repo`
   */
  command: string;

  additionalInformation?: string;
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

export function matchGitHubPath(pathSegments: string[]): GitHubPathType | null {
  const [first, second, ...rest] = pathSegments;
  // Handle issues / PRs
  if (first === "issues" || first === "pull") {
    if (typeof second !== "string") return null;
    const num = Number.parseInt(second, 10);
    if (Number.isNaN(num)) return null;
    const subpath = rest.length > 0 ? `/${rest.join("/")}` : undefined;
    return {
      number: num,
      subpath,
      type: first === "issues" ? "issue" : "pr",
    };
  }

  // Handle releases
  if (first === "releases") {
    if (second === "tag" && typeof rest[0] === "string") {
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
    if (second === "workflows" && typeof rest[0] === "string") {
      return { filename: rest[0], type: "workflow" };
    }
    if (second === "runs" && typeof rest[0] === "string") {
      return { runId: rest[0], type: "run" };
    }
  }

  return null;
}

export function generateGhCommand(
  pathMatch: GitHubPathType,
  repo: { name: string; owner: string },
): GhCommandResult {
  switch (pathMatch.type) {
    case "issue":
      return {
        command: `gh issue view ${pathMatch.number} --repo ${repo.owner}/${repo.name}`,
      };

    case "pr": {
      if (
        pathMatch.subpath === "/files" ||
        // new PR diff viewer
        pathMatch.subpath === "/changes"
      ) {
        return {
          additionalInformation: [
            "- Add `--patch` to get whole diff content",
            "- Add `--name-only` to get changed file names only",
          ].join("\n"),
          command: `gh pr diff ${pathMatch.number} --repo ${repo.owner}/${repo.name}`,
        };
      }
      // include PR comments
      return {
        command: `gh pr view -c ${pathMatch.number} --repo ${repo.owner}/${repo.name}`,
      };
    }

    case "release": {
      if ("tag" in pathMatch) {
        return {
          command: `gh release view ${pathMatch.tag} --repo ${repo.owner}/${repo.name}`,
        };
      }
      if ("isLatest" in pathMatch) {
        return {
          command: `gh release view --repo ${repo.owner}/${repo.name}`,
        };
      }
      return {
        command: `gh release list --repo ${repo.owner}/${repo.name}`,
      };
    }

    case "run":
      return {
        command: `gh run view ${pathMatch.runId} --repo ${repo.owner}/${repo.name}`,
      };
    case "workflow":
      return {
        command: `gh workflow view ${pathMatch.filename} --repo ${repo.owner}/${repo.name}`,
      };
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

function isGitHubURL(url: URL): boolean {
  // Add custom domains if needed
  return url.hostname === "github.com";
}

function isGistURL(url: URL): boolean {
  // Add custom domains if needed
  return url.hostname === "gist.github.com";
}

export function parseGitHubUrlToGhCommand(url: URL): GhCommandResult | null {
  if (isRawContentURL(url)) {
    return null;
  }

  if (isGistURL(url)) {
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
    };
  }

  if (isGitHubURL(url)) {
    const repo = extractGitHubRepo(url);
    if (!repo) {
      return null;
    }

    if (repo.restPaths.length === 0) {
      const command = `gh repo view ${repo.owner}/${repo.name}`;
      return {
        command,
      };
    }

    const pathMatch = matchGitHubPath(repo.restPaths);
    if (pathMatch) {
      const result = generateGhCommand(pathMatch, repo);
      return {
        additionalInformation: result.additionalInformation,
        command: result.command,
      };
    }
  }

  return null;
}

type GhApiResult = GhApiGraphQL | GhApiREST;

type GhApiREST = {
  method: MaybeLiteral<"GET" | "POST">;
  pathComponents: string[];
  type: "rest";
};

type GhApiGraphQL = {
  type: "graphql";
};

export function parseGhApiCommand(command: string): GhApiResult | null {
  if (!command.startsWith("gh api ")) {
    return null;
  }

  const rest = command.slice("gh api ".length).trim();
  const args = parseIntoArray(rest).filter((arg) => typeof arg === "string");

  const parsed = parse(args, {
    args: {
      endpoint: {
        type: "positional",
      },
      field: {
        short: "F",
        type: "string",
      },
      // Inject file as request body. Auto-switches method to POST
      input: {
        type: "string",
      },
      method: {
        short: "X",
        type: "string",
      },
      "raw-field": {
        short: "f",
        type: "string",
      },
    },
  });

  const endpoint = parsed.values.endpoint;
  if (endpoint === "graphql") {
    return {
      type: "graphql",
    };
  }

  const requestParamsExists =
    isNonEmptyString(parsed.values["raw-field"]) ||
    isNonEmptyString(parsed.values.field) ||
    isNonEmptyString(parsed.values.input);

  const resolveMethod = () => {
    if (isNonEmptyString(parsed.values.method)) {
      return parsed.values.method;
    }

    // gh determines default method based on presence of request body
    return requestParamsExists ? "POST" : "GET";
  };

  return {
    method: resolveMethod().toUpperCase(),
    pathComponents: endpoint.split("/").filter((part) => part.length > 0),
    type: "rest",
  };
}
