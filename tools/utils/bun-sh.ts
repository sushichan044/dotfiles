// wrap Bun shell to always return result object and never prints to stdout/stderr directly
export async function shSilent(
  strings: TemplateStringsArray,
  ...expressions: Bun.ShellExpression[]
) {
  return Bun.$(strings, ...expressions)
    .nothrow()
    .quiet();
}
