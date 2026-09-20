import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { Plugin } from "@opencode/plugin";

const execFileAsync = promisify(execFile);

function createNotifier(): (message: string) => Promise<void> {
  return async (message: string) => {
    await execFileAsync("terminal-notifier", [
      "-sound",
      "Funk",
      "-title",
      "Opencode",
      "-message",
      message,
    ]);
  };
}

export default Plugin.define({
  id: "notify",
  async setup(ctx) {
    const notify = createNotifier();
    const controller = new AbortController();

    void (async () => {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        if (event.type === "session.idle") {
          await notify("OpenCode process has completed.");
        }
      }
    })();

    await ctx.permission.hook("evaluate", async (event) => {
      if (event.effect !== "ask") {
        return;
      }
      await notify("Opencode is requesting some permissions.");
    });

    await ctx.tool.hook("execute.before", async (event) => {
      if (event.tool === "question") {
        await notify("Opencode is asking a question.");
      }
    });

    return () => controller.abort();
  },
});
