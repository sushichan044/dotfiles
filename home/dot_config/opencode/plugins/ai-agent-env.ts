import { Plugin } from "@opencode/plugin";

export default Plugin.define({
  id: "ai-agent-env",
  async setup(ctx) {
    await ctx.shell.hook("create.before", (event) => {
      // https://github.com/unjs/std-env/blob/2b364bdb44d7e56e0fe2070758dd42fec55c6144/src/agents.ts#L70-L90
      event.env["AI_AGENT"] = "opencode";
    });
  },
});
