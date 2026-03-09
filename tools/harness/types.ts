export type Project<EcoSystem extends string> = {
  ecoSystem: EcoSystem;

  packageManager: PackageManager;

  formatter: Formatter;
  linter: Linter;
};

export interface Linter {
  lintFiles: (files: string[]) => Promise<void>;
}

export interface Formatter {
  formatAll: () => Promise<void>;
  formatFiles: (files: string[]) => Promise<void>;
}

export interface PackageManager {
  installDependencies: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/require-await
const noop = async (): Promise<void> => {
  return undefined;
};

export function createNoopFormatter(): Formatter {
  return {
    formatAll: noop,
    formatFiles: noop,
  };
}

export function createNoopLinter(): Linter {
  return {
    lintFiles: noop,
  };
}
