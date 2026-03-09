import { join } from "pathe";

export type GoProject = {
  installDeps: () => Promise<void>;
};

export async function openGoProject(root: string): Promise<GoProject | null> {
  const goMod = join(root, "go.mod");
  const file = Bun.file(goMod);
  if (!(await file.exists())) {
    return null;
  }

  return {
    installDeps: async () => {
      const proc = Bun.spawn({
        cmd: ["go", "mod", "tidy"],
        cwd: root,
      });
      await proc.exited;
    },
  };
}
