import { regex } from "arkregex";
import { defineHook } from "cc-hooks-ts";

/**
 * $ claude plugin marketplace update
 *
 * Updating 3 marketplace(s)...
 * ✔ Successfully updated 3 marketplace(s)
 */
const extractMarketplaceAmount = regex("(?<amount>[0-9]+) marketplace");

const hook = defineHook({
  trigger: {
    SessionStart: true,
  },

  run: (c) =>
    c.defer(async () => {
      // stdout will break claude code
      const result = await Bun.$`claude plugin marketplace update`.nothrow().quiet();
      const amount = extractMarketplaceAmount.exec(result.text())?.groups?.amount ?? "-1";

      return {
        event: "SessionStart",
        output: {
          systemMessage: `Updated ${amount} plugin marketplaces.`,
        },
      };
    }),
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
