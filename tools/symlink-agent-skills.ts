#!/usr/bin/env -S bun run --silent

import { lstat, mkdir, readlink, readdir, realpath, stat, symlink, unlink } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const SOURCE_DIR = ".agents/skills";

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
};

const isWithin = (parent: string, child: string): boolean => {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
};

const linkSkill = async (source: string, target: string): Promise<"created" | "unchanged"> => {
  if (await pathExists(target)) {
    const targetStat = await lstat(target);
    if (!targetStat.isSymbolicLink()) {
      throw new Error(`Refusing to replace existing path: ${target}`);
    }

    const currentSource = resolve(dirname(target), await readlink(target));
    if (currentSource === source) {
      return "unchanged";
    }

    await unlink(target);
  }

  await symlink(relative(dirname(target), source), target);
  return "created";
};

export const symlinkAgentSkills = async (
  cwd: string,
  targetDirs: string[],
): Promise<{ created: number; unchanged: number }> => {
  const root = await realpath(cwd);
  const sourceDir = resolve(root, SOURCE_DIR);

  if (!(await stat(sourceDir)).isDirectory()) {
    throw new Error(`Source directory is not a directory: ${SOURCE_DIR}`);
  }

  const targets = targetDirs.map((targetDir) => {
    const target = resolve(root, targetDir);
    if (!isWithin(root, target) || target === sourceDir) {
      throw new Error(`Target must be inside the current directory: ${targetDir}`);
    }
    return target;
  });

  const skills = (
    await Promise.all(
      (
        await readdir(sourceDir, { withFileTypes: true })
      ).map(async (entry) => {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) {
          return undefined;
        }

        const skillDir = resolve(sourceDir, entry.name);
        try {
          return (await stat(resolve(skillDir, "SKILL.md"))).isFile() ? entry.name : undefined;
        } catch {
          return undefined;
        }
      }),
    )
  ).filter((skill): skill is string => skill !== undefined);

  await Promise.all(targets.map((targetDir) => mkdir(targetDir, { recursive: true })));
  const results = await Promise.all(
    targets.flatMap((targetDir) =>
      skills.map((skill) => linkSkill(resolve(sourceDir, skill), resolve(targetDir, skill))),
    ),
  );

  return {
    created: results.filter((result) => result === "created").length,
    unchanged: results.filter((result) => result === "unchanged").length,
  };
};

if (import.meta.main) {
  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    throw new Error("Specify at least one target directory.");
  }

  const result = await symlinkAgentSkills(process.cwd(), targets);
  console.log(`Created ${result.created} symlink(s); ${result.unchanged} unchanged.`);
}
