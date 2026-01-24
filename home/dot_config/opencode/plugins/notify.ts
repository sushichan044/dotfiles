import type { Plugin, PluginInput } from "@opencode-ai/plugin";

type OpenCodeShell = PluginInput["$"];

function createNotifier(shell: OpenCodeShell): (message: string) => Promise<void> {
  return async (message: string) => {
    await shell`terminal-notifier -sound Funk -title "Opencode" -message ${message}`;
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
export const notifierPlugin: Plugin = async ({ $ }) => {
  const notify = createNotifier($);

  return {
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        await notify("OpenCode process has completed.");
        return;
      }
    },
    "permission.ask": async () => {
      await notify("Opencode is requesting some permissions.");
    },
    "tool.execute.before": async ({ tool }) => {
      if (tool === "question") {
        await notify("Opencode is asking a question.");
      }
    },
  };
};
