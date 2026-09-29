import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    jsdoc: true,
    sortImports: true,
  },
  lint: {
    jsPlugins: ["vite-plus/oxlint-plugin"],
    ignorePatterns: [".agents/skills/**"],
    categories: {
      correctness: "error",
      nursery: "error",
      perf: "error",
    },
    env: {
      node: true,
      es2026: true,
    },
    globals: {
      Bun: "readonly",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  },
  test: {
    benchmark: {
      include: ["**/*.{bench,benchmark}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    },
    passWithNoTests: true,
    typecheck: {
      enabled: true,
    },
  },
});
