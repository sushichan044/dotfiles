import { describe, expect, it } from "bun:test";

import type { GitHubPathType } from "./github";

import {
  extractGistInfo,
  extractGitHubRepo,
  generateGhCommand,
  matchGitHubPath,
} from "./github";

describe("extractGitHubRepo", () => {
  it("should extract repo info from GitHub URL", () => {
    const url = new URL("https://github.com/owner/repo/issues/123");
    const result = extractGitHubRepo(url);

    expect(result).toEqual({
      name: "repo",
      owner: "owner",
      restPaths: ["issues", "123"],
    });
  });

  it("should return null for reserved owner names", () => {
    const url = new URL("https://github.com/features/repo");
    const result = extractGitHubRepo(url);

    expect(result).toBeNull();
  });

  it("should return null if owner or name is missing", () => {
    const url = new URL("https://github.com/owner");
    const result = extractGitHubRepo(url);

    expect(result).toBeNull();
  });

  it("should handle URL-encoded paths", () => {
    const url = new URL("https://github.com/my%20owner/my%20repo");
    const result = extractGitHubRepo(url);

    expect(result).toEqual({
      name: "my repo",
      owner: "my owner",
      restPaths: [],
    });
  });
});

describe("matchGitHubPath", () => {
  it("should match release with tag", () => {
    const result = matchGitHubPath(["releases", "tag", "v1.0.0"]);

    expect(result).toEqual({
      tag: "v1.0.0",
      type: "release",
    });
  });

  it("should match latest release", () => {
    const result = matchGitHubPath(["releases", "latest"]);

    expect(result).toEqual({
      isLatest: true,
      type: "release",
    });
  });

  it("should match releases list", () => {
    const result = matchGitHubPath(["releases"]);

    expect(result).toEqual({
      isList: true,
      type: "release",
    });
  });

  it("should match workflow", () => {
    const result = matchGitHubPath(["actions", "workflows", "ci.yml"]);

    expect(result).toEqual({
      filename: "ci.yml",
      type: "workflow",
    });
  });

  it("should match run", () => {
    const result = matchGitHubPath(["actions", "runs", "123456"]);

    expect(result).toEqual({
      runId: "123456",
      type: "run",
    });
  });

  it("should return null if no match", () => {
    const result = matchGitHubPath(["unknown"]);

    expect(result).toBeNull();
  });

  it("should return null for workflow without filename", () => {
    const result = matchGitHubPath(["actions", "workflows"]);

    expect(result).toBeNull();
  });

  it("should return null for run without id", () => {
    const result = matchGitHubPath(["actions", "runs"]);

    expect(result).toBeNull();
  });
});

describe("generateGhCommand", () => {
  const repo = { name: "repo", owner: "owner" };

  it("should generate release view command for tag", () => {
    const pathMatch: GitHubPathType = { tag: "v1.0.0", type: "release" };
    const result = generateGhCommand(pathMatch, repo);

    expect(result).toBe("gh release view v1.0.0 --repo owner/repo");
  });

  it("should generate release view command for latest", () => {
    const pathMatch: GitHubPathType = { isLatest: true, type: "release" };
    const result = generateGhCommand(pathMatch, repo);

    expect(result).toBe("gh release view --repo owner/repo");
  });

  it("should generate release list command", () => {
    const pathMatch: GitHubPathType = { isList: true, type: "release" };
    const result = generateGhCommand(pathMatch, repo);

    expect(result).toBe("gh release list --repo owner/repo");
  });

  it("should generate workflow view command", () => {
    const pathMatch: GitHubPathType = { filename: "ci.yml", type: "workflow" };
    const result = generateGhCommand(pathMatch, repo);

    expect(result).toBe("gh workflow view ci.yml --repo owner/repo");
  });

  it("should generate run view command", () => {
    const pathMatch: GitHubPathType = { runId: "123456", type: "run" };
    const result = generateGhCommand(pathMatch, repo);

    expect(result).toBe("gh run view 123456 --repo owner/repo");
  });
});

describe("extractGistInfo", () => {
  it("should extract gist id", () => {
    const url = new URL("https://gist.github.com/user/abc123");
    const result = extractGistInfo(url);

    expect(result).toEqual({
      gistId: "abc123",
    });
  });

  it("should extract gist id with filename", () => {
    const url = new URL("https://gist.github.com/user/abc123#file-example-txt");
    const result = extractGistInfo(url);

    expect(result).toEqual({
      filename: "example.txt",
      gistId: "abc123",
    });
  });

  it("should handle hyphens in filename", () => {
    const url = new URL("https://gist.github.com/user/abc123#file-my-file-js");
    const result = extractGistInfo(url);

    expect(result).toEqual({
      filename: "my.file.js",
      gistId: "abc123",
    });
  });

  it("should return null if path is too short", () => {
    const url = new URL("https://gist.github.com/user");
    const result = extractGistInfo(url);

    expect(result).toBeNull();
  });
});
