import { defineHook } from "cc-hooks-ts";

// Patterns whose matches should be separated from glued neighbors by whitespace.
// WHY [!-~] (printable ASCII) instead of [^\s]+: a "non-space" body greedily
// swallows adjacent CJK text (e.g. "https://example.com今") and any trailing
// characters, so the real end of the URL can no longer be located. URLs are
// ASCII by spec, so stopping at the first non-ASCII byte keeps the boundary intact.
const patterns: RegExp[] = [
  /\b(?:[a-zA-Z][a-zA-Z\d+.-]*:\/\/[!-~]+|mailto:[!-~]+|tel:[!-~]+)/g, // URLs
];

// A neighboring character "glues" to a URL only when it is a letter or number
// (including CJK). Terminals fail to auto-link a URL that touches such a
// character, so a separating space is warranted.
// WHY NOT space out every non-space neighbor: ASCII punctuation such as
// "(", ")", "<", ">", '"', "`" already delimits the URL and is frequently
// markdown syntax — "[text](url)", "<url>", "`url`". Inserting a space there
// breaks the rendered link, which is exactly the failure this guard prevents.
function gluesToUrl(char: string | undefined): boolean {
  return char !== undefined && /[\p{L}\p{N}]/u.test(char);
}

function ensureSurroundingWhitespace(text: string, pattern: RegExp): string {
  return text.replaceAll(pattern, (match: string, offset: number) => {
    const prefix = gluesToUrl(text[offset - 1]) ? " " : "";
    const suffix = gluesToUrl(text[offset + match.length]) ? " " : "";
    return `${prefix}${match}${suffix}`;
  });
}

export function ensureUrlWhitespace(text: string): string {
  return patterns.reduce((acc, pattern) => ensureSurroundingWhitespace(acc, pattern), text);
}

const hook = defineHook({
  trigger: {
    MessageDisplay: true,
  },

  run: async (c) => {
    return c.json({
      event: "MessageDisplay",
      output: {
        hookSpecificOutput: {
          hookEventName: "MessageDisplay",
          displayContent: ensureUrlWhitespace(c.input.delta),
        },
      },
    });
  },
});

if (import.meta.main) {
  const { runHook } = await import("cc-hooks-ts");
  await runHook(hook);
}
