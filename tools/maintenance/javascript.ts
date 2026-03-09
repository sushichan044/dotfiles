import type { Agent } from "package-manager-detector";

import { spawn } from "bun";
import { isPackageExists } from "local-pkg";
import { resolveCommand } from "package-manager-detector/commands";
import { detect } from "package-manager-detector/detect";

type Params = {
  cwd?: string;
};

export type JavaScriptProject = Formatter & {
  installDeps: () => Promise<void>;
};

const NO_OP_JAVASCRIPT_PROJECT: JavaScriptProject = {
  // eslint-disable-next-line @typescript-eslint/require-await
  formatAll: async () => {
    console.warn("No JavaScript project detected. Skipping formatting.");
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  formatFiles: async () => {
    console.warn("No JavaScript project detected. Skipping formatting.");
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  installDeps: async () => {
    console.warn("No JavaScript project detected. Skipping dependency installation.");
  },
};

export async function openJavaScriptProject(root: string): Promise<JavaScriptProject | null> {
  const pm = await detectPackageManager({ cwd: root });
  if (!pm) {
    return null;
  }

  const pj = NO_OP_JAVASCRIPT_PROJECT;
  if (pm.agent) {
    pj.installDeps = async () => installDependencies(pm.agent, { cwd: root });
  }
  const formatter = detectFormatter();
  if (formatter) {
    const resolvedFormatter = resolveFormatter(pm.agent, formatter, { cwd: root });
    if (resolvedFormatter) {
      pj.formatAll = resolvedFormatter.formatAll;
      pj.formatFiles = resolvedFormatter.formatFiles;
    }
  }

  return pj;
}

async function detectPackageManager(params: Params = {}) {
  return await detect({
    cwd: params.cwd,
    strategies: ["packageManager-field", "lockfile"],
  });
}

async function installDependencies(pm: Agent, params: Params = {}) {
  const resolved = resolveCommand(pm, "install", []);
  if (!resolved) {
    throw new Error(`Unsupported package manager: ${pm}`);
  }

  const { args, command } = resolved;
  const proc = spawn({
    cmd: [command, ...args],
    cwd: params.cwd,
  });
  await proc.exited;
}

interface Formatter {
  formatAll: () => Promise<void>;
  formatFiles: (files: string[]) => Promise<void>;
}

// type SupportedFormatter = "biome" | "oxfmt" | "prettier";
const FORMATTERS = {
  biome: {
    npm: "@biomejs/biome",
  },
  oxfmt: {
    npm: "oxfmt",
  },
  prettier: {
    npm: "prettier",
  },
} as const;
type FormatterBin = keyof typeof FORMATTERS;

function detectFormatter(): FormatterBin | null {
  if (isPackageExists(FORMATTERS.oxfmt.npm)) {
    return "oxfmt";
  }
  if (isPackageExists(FORMATTERS.biome.npm)) {
    return "biome";
  }
  if (isPackageExists(FORMATTERS.prettier.npm)) {
    return "prettier";
  }
  return null;
}

function resolveFormatter(pm: Agent, bin: FormatterBin, params: Params = {}): Formatter | null {
  const localExec = async (...args: string[]): Promise<void> => {
    const resolved = resolveCommand(pm, "execute-local", args);
    if (!resolved) {
      return;
    }
    const proc = spawn({
      cmd: [resolved.command, ...resolved.args],
      cwd: params.cwd,
    });
    await proc.exited;
  };

  switch (bin) {
    case "biome": {
      return {
        formatAll: async () => localExec("biome", "format", "--write"),
        formatFiles: async (files: string[]) => localExec("biome", "format", "--write", ...files),
      };
    }
    case "oxfmt": {
      return {
        formatAll: async () => localExec("oxfmt"),
        formatFiles: async (files: string[]) => localExec("oxfmt", ...files),
      };
    }
    case "prettier": {
      return {
        formatAll: async () => localExec("prettier", "--write", "."),
        formatFiles: async (files: string[]) => localExec("prettier", "--write", ...files),
      };
    }
    default: {
      return null;
    }
  }
}
