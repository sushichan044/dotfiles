import type { Plugin } from "@opencode-ai/plugin";

// eslint-disable-next-line @typescript-eslint/require-await
export const injectAIAgentEnvPlugin: Plugin = async () => {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    "shell.env": async (_, output) => {
      // https://github.com/unjs/std-env/blob/2b364bdb44d7e56e0fe2070758dd42fec55c6144/src/agents.ts#L70-L90
      output.env["AI_AGENT"] = "opencode";
    },
  };
};
