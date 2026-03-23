import { describe, expect, it } from "bun:test";

import { preparePrompt } from "./prompt";

describe("preparePrompt", () => {
  it("replaces a single parameter", () => {
    const render = preparePrompt("Hello ${name}!");
    expect(render({ name: "World" })).toBe("Hello World!");
  });

  it("replaces multiple distinct parameters", () => {
    const render = preparePrompt("${greeting}, ${name}!");
    expect(render({ greeting: "Hi", name: "Alice" })).toBe("Hi, Alice!");
  });

  it("replaces the same parameter appearing multiple times", () => {
    const render = preparePrompt("${x} and ${x}");
    expect(render({ x: "foo" })).toBe("foo and foo");
  });

  it("returns the template unchanged when there are no parameters", () => {
    const render = preparePrompt("no placeholders");
    expect(render({})).toBe("no placeholders");
  });

  it("handles adjacent parameters with no separator", () => {
    const render = preparePrompt("${a}${b}");
    expect(render({ a: "hello", b: "world" })).toBe("helloworld");
  });
});
