import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import * as v from "valibot";

import { createShell } from "./bun-sh";

const sh = createShell();

const STATE_FILE = join(
  process.env["XDG_CACHE_HOME"] ?? join(homedir(), ".cache"),
  "sushichan044",
  "omakase",
  "state.json",
);

const DirectoryStateSchema = v.object({
  enabled: v.boolean(),
});

const SessionStateSchema = v.object({
  prompt: v.string(),
  cwd: v.string(),
  savedAt: v.string(),
});

const OmakaseStateSchema = v.object({
  directories: v.record(v.string(), DirectoryStateSchema),
  sessions: v.record(v.string(), SessionStateSchema),
});

type OmakaseState = v.InferOutput<typeof OmakaseStateSchema>;
type SessionState = v.InferOutput<typeof SessionStateSchema>;

const EMPTY_STATE: OmakaseState = { directories: {}, sessions: {} };

async function readState(): Promise<OmakaseState> {
  const file = Bun.file(STATE_FILE);
  if (!(await file.exists())) return structuredClone(EMPTY_STATE);

  const raw = await file.json().catch(() => null);
  const result = v.safeParse(OmakaseStateSchema, raw);
  return result.success ? result.output : structuredClone(EMPTY_STATE);
}

async function writeState(state: OmakaseState): Promise<void> {
  v.parse(OmakaseStateSchema, state);
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await Bun.write(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
}

async function resolveKey(cwd: string): Promise<string> {
  const result = await sh`git -C ${cwd} rev-parse --show-toplevel`;
  if (result.exitCode === 0) {
    const top = result.text().trim();
    if (top.length > 0) return top;
  }
  return cwd;
}

export type OmakaseDirectoryContext = {
  isEnabled: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => Promise<void>;
};

export type OmakaseSessionContext = OmakaseDirectoryContext & {
  setLastPrompt: (prompt: string) => Promise<void>;
  getLastPrompt: () => Promise<string | null>;
  clearLastPrompt: () => Promise<void>;
};

export function createOmakaseContext(cwd: string): OmakaseDirectoryContext;
export function createOmakaseContext(cwd: string, sessionId: string): OmakaseSessionContext;

export function createOmakaseContext(
  cwd: string,
  sessionId?: string,
): OmakaseDirectoryContext | OmakaseSessionContext {
  const directoryCtx: OmakaseDirectoryContext = {
    isEnabled: async () => {
      const key = await resolveKey(cwd);
      const state = await readState();
      return state.directories[key]?.enabled === true;
    },

    setEnabled: async (enabled: boolean) => {
      const key = await resolveKey(cwd);
      const state = await readState();
      state.directories[key] = { enabled };
      await writeState(state);
    },
  };

  if (sessionId === undefined) return directoryCtx;

  const sid = sessionId;
  return {
    ...directoryCtx,

    setLastPrompt: async (prompt: string) => {
      const state = await readState();
      state.sessions[sid] = {
        prompt,
        cwd,
        savedAt: new Date().toISOString(),
      } satisfies SessionState;
      await writeState(state);
    },

    getLastPrompt: async () => {
      const state = await readState();
      return state.sessions[sid]?.prompt ?? null;
    },

    clearLastPrompt: async () => {
      const state = await readState();
      delete state.sessions[sid];
      await writeState(state);
    },
  };
}
