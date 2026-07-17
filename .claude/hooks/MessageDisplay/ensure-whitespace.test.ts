import { describe, expect, it } from "bun:test";

import { ensureUrlWhitespace } from "./ensure-whitespace";

describe("ensureUrlWhitespace", () => {
  it("adds spaces around a URL glued to CJK text", () => {
    expect(ensureUrlWhitespace("見てhttps://example.com今")).toBe("見て https://example.com 今");
  });

  it("leaves a URL already surrounded by whitespace untouched", () => {
    expect(ensureUrlWhitespace("visit https://example.com now")).toBe(
      "visit https://example.com now",
    );
  });

  it("keeps a markdown link intact", () => {
    expect(ensureUrlWhitespace("see [docs](https://example.com/path) here")).toBe(
      "see [docs](https://example.com/path) here",
    );
  });

  it("keeps an inline-code URL intact", () => {
    expect(ensureUrlWhitespace("`https://example.com`")).toBe("`https://example.com`");
  });

  it("keeps an autolink intact", () => {
    expect(ensureUrlWhitespace("wrap in <https://example.com>")).toBe(
      "wrap in <https://example.com>",
    );
  });

  it("does not touch a quoted file path without a scheme", () => {
    const path = '"/Users/sushichan044/workspace/github.com/heyinc/stcli/docs/usage/root.md" とか';
    expect(ensureUrlWhitespace(path)).toBe(path);
  });

  it("stops the URL body at CJK instead of swallowing it", () => {
    expect(ensureUrlWhitespace("メールmailto:foo@example.com送信")).toBe(
      "メール mailto:foo@example.com 送信",
    );
  });
});
