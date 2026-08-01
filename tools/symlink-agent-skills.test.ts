import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readlink, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { symlinkAgentSkills } from "./symlink-agent-skills";

const testDirs: string[] = [];

const createProject = async (): Promise<string> => {
  const project = await mkdtemp(join(tmpdir(), "symlink-agent-skills-"));
  testDirs.push(project);
  await mkdir(join(project, ".agents/skills/example"), { recursive: true });
  await writeFile(join(project, ".agents/skills/example/SKILL.md"), "# Example\n");
  return project;
};

afterEach(async () => {
  await Promise.all(testDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

describe("symlinkAgentSkills", () => {
  test("links each skill into the requested target directory", async () => {
    const project = await createProject();

    const result = await symlinkAgentSkills(project, [".claude/skills"]);
    expect(result).toEqual({
      created: 1,
      unchanged: 0,
    });
    expect(await readlink(join(project, ".claude/skills/example"))).toBe(
      "../../.agents/skills/example",
    );
  });

  test("leaves an existing correct symlink unchanged", async () => {
    const project = await createProject();
    await mkdir(join(project, ".claude/skills"), { recursive: true });
    await symlink("../../.agents/skills/example", join(project, ".claude/skills/example"));

    const result = await symlinkAgentSkills(project, [".claude/skills"]);
    expect(result).toEqual({
      created: 0,
      unchanged: 1,
    });
  });

  test("does not replace an existing real directory", async () => {
    const project = await createProject();
    await mkdir(join(project, ".claude/skills/example"), { recursive: true });

    try {
      await symlinkAgentSkills(project, [".claude/skills"]);
      throw new Error("Expected symlinkAgentSkills to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Refusing to replace existing path");
    }
  });
});
