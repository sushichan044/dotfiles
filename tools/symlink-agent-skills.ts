#!/usr/bin/env -S bun run --silent

import { lstat, mkdir, readdir, readlink, realpath, stat, symlink, unlink } from "node:fs/promises";
import { relative, resolve } from "node:path";

import { $ } from "bun";

const SOURCE_DIR = ".agents/skills";

const exists = (path: string, follow = false): Promise<boolean> =>
  (follow ? stat : lstat)(path).then(
    () => true,
    () => false,
  );

/** True if git ignores `path`. Outside a git repository nothing is ignored. */
const isGitIgnored = async (root: string, path: string): Promise<boolean> =>
  (await $`git check-ignore -q ${relative(root, path)}`.cwd(root).nothrow().quiet()).exitCode === 0;

export const symlinkAgentSkills = async (
  cwd: string,
  targetDirs: string[],
): Promise<{ created: number; removed: number; unchanged: number }> => {
  const root = await realpath(cwd);
  const sourceDir = resolve(root, SOURCE_DIR);

  const dirs = targetDirs.map((targetDir) => {
    const dir = resolve(root, targetDir);
    if (relative(root, dir).startsWith("..") || dir === sourceDir) {
      throw new Error(`Target must be inside the current directory: ${targetDir}`);
    }
    return dir;
  });

  const names = await readdir(sourceDir);
  const skills = (
    await Promise.all(
      names.map(async (name) =>
        (await exists(resolve(sourceDir, name, "SKILL.md"), true)) ? name : undefined,
      ),
    )
  ).filter((name) => name !== undefined);

  const removeOrphan = async (path: string): Promise<boolean> => {
    if (!(await lstat(path)).isSymbolicLink() || (await exists(path, true))) {
      return false;
    }
    if (await isGitIgnored(root, path)) {
      return false;
    }
    await unlink(path);
    return true;
  };

  const linkSkill = async (
    dir: string,
    name: string,
  ): Promise<"created" | "unchanged" | "ignored"> => {
    const source = resolve(sourceDir, name);
    const target = resolve(dir, name);
    if (await isGitIgnored(root, target)) {
      return "ignored";
    }

    if (await exists(target)) {
      if (!(await lstat(target)).isSymbolicLink()) {
        throw new Error(`Refusing to replace existing path: ${target}`);
      }
      if (resolve(dir, await readlink(target)) === source) {
        return "unchanged";
      }
      await unlink(target);
    }

    await symlink(relative(dir, source), target);
    return "created";
  };

  const perDir = await Promise.all(
    dirs.map(async (dir) => {
      await mkdir(dir, { recursive: true });
      const orphans = await Promise.all(
        (await readdir(dir)).map((name) => removeOrphan(resolve(dir, name))),
      );
      const links = await Promise.all(skills.map((name) => linkSkill(dir, name)));
      return { links, removed: orphans.filter(Boolean).length };
    }),
  );

  const links = perDir.flatMap((entry) => entry.links);
  return {
    created: links.filter((link) => link === "created").length,
    removed: perDir.reduce((sum, entry) => sum + entry.removed, 0),
    unchanged: links.filter((link) => link === "unchanged").length,
  };
};

if (import.meta.main) {
  const targets = process.argv.slice(2);
  if (targets.length === 0) {
    throw new Error("Specify at least one target directory.");
  }

  const { created, removed, unchanged } = await symlinkAgentSkills(process.cwd(), targets);
  console.log(`Created ${created}, unchanged ${unchanged}, removed ${removed} orphan(s).`);
}
