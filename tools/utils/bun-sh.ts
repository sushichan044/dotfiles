import { isNonEmptyString } from "./string";

type ShellOptions = {
  cwd: string;
};

export function prepareShell(options?: Partial<ShellOptions>) {
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
