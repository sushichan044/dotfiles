import { join } from "pathe";

import { createNoopFormatter, createNoopLinter, type Project } from "./types";

export type GoProject = Project<"go">;

export async function openGoProject(root: string): Promise<GoProject | null> {
  const goMod = join(root, "go.mod");
  const file = Bun.file(goMod);
  if (!(await file.exists())) {
    return null;
  }

  return {
    ecoSystem: "go",
    formatter: createNoopFormatter(),
    linter: createNoopLinter(),
    packageManager: {
      installDependencies: async () => {
        const proc = Bun.spawn({
          cmd: ["go", "mod", "tidy"],
          cwd: root,
        });
        await proc.exited;
      },
    },
  };
}
