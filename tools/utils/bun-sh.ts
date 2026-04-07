import { isNonEmptyString } from "./string";

type ShellOptions = {
  cwd: string;
};

export type Shell = (
  strings: TemplateStringsArray,
  ...expressions: Bun.ShellExpression[]
) => Promise<Bun.$.ShellOutput>;

export function prepareShell(options?: Partial<ShellOptions>): Shell {
  let sh = Bun.$;
  if (isNonEmptyString(options?.cwd)) {
    sh = sh.cwd(options.cwd);
  }

  return async (strings: TemplateStringsArray, ...expressions: Bun.ShellExpression[]) => {
    return sh(strings, ...expressions)
      .nothrow()
      .quiet();
  };
}
