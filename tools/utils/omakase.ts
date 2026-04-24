import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { createShell } from "./bun-sh";

const sh = createShell();

const stateFile = join(
  process.env["XDG_CACHE_HOME"] ?? join(homedir(), ".cache"),
  "sushichan044",
  "omakase",
  "state.json",
);

export type Omakase = {
  isEnabled: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => Promise<void>;
};

async function readState(): Promise<Record<string, boolean>> {
  const file = Bun.file(stateFile);
  if (!(await file.exists())) return {};

  const raw = (await file.json()) as unknown;
  if (typeof raw !== "object" || raw === null) return {};

  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

async function writeState(state: Record<string, boolean>): Promise<void> {
  await mkdir(dirname(stateFile), { recursive: true });
  await Bun.write(stateFile, JSON.stringify(state, null, 2) + "\n");
}

/**
 * Resolve the storage key for a given path. Binds omakase state to the closest
 * git worktree root so toggling anywhere inside a repo (or a linked worktree)
 * applies to the whole tree. `git rev-parse --show-toplevel` returns the
 * current worktree's top — the main repo root from inside the main worktree,
 * or the linked worktree root from inside one.
 *
 * Falls back to the input path when not inside a git worktree.
 */
export async function resolveOmakaseKey(cwd: string): Promise<string> {
  const result = await sh`git -C ${cwd} rev-parse --show-toplevel`;
  if (result.exitCode === 0) {
    const top = result.text().trim();
    if (top.length > 0) return top;
  }
  return cwd;
}

export function createOmakase(cwd: string): Omakase {
  return {
    async isEnabled() {
      const key = await resolveOmakaseKey(cwd);
      const state = await readState();
      return state[key] === true;
    },

    async setEnabled(enabled) {
      const key = await resolveOmakaseKey(cwd);
      const state = await readState();
      state[key] = enabled;
      await writeState(state);
    },
  };
}
