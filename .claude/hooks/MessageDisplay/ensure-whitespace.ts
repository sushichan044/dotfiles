import { defineHook } from "cc-hooks-ts";

// patterns whose matches should always be surrounded by whitespace
const patterns: RegExp[] = [
  /\b(?:[a-zA-Z][a-zA-Z\d+.-]*:\/\/[^\s]+|mailto:[^\s]+|tel:[^\s]+)/g, // URLs
];

function ensureSurroundingWhitespace(text: string, pattern: RegExp): string {
  return text.replaceAll(pattern, (match, offset) => {
    const before = text[offset - 1];
    const after = text[offset + match.length];
    const prefix = before && !/\s/.test(before) ? " " : "";
    const suffix = after && !/\s/.test(after) ? " " : "";
    return `${prefix}${match}${suffix}`;
  });
}

const hook = defineHook({
  trigger: {
    MessageDisplay: true,
  },

  run: async (c) => {
    const text = c.input.delta;

    const modifiedText = patterns.reduce(
      (acc, pattern) => ensureSurroundingWhitespace(acc, pattern),
      text,
    );

    return c.json({
      event: "MessageDisplay",
      output: {
        hookSpecificOutput: {
          hookEventName: "MessageDisplay",
          displayContent: modifiedText,
        },
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
