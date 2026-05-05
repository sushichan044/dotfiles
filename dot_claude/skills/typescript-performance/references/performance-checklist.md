# TypeScript Performance Optimization Checklist

## Code-Level Optimizations

### ✅ Prefer Interface Extension Over Type Intersections

**Bad:**

```typescript
type Foo = Bar &
  Baz & {
    someProp: string;
  };
```

**Good:**

```typescript
interface Foo extends Bar, Baz {
  someProp: string;
}
```

**Why:** Interfaces create single flat object types with better caching and display. Type intersections recursively merge properties and can't be cached as effectively.

### ✅ Add Explicit Return Type Annotations

**Bad:**

```typescript
export function func() {
  return otherFunc();
}
```

**Good:**

```typescript
import { OtherType } from "other";

export function func(): OtherType {
  return otherFunc();
}
```

**Why:** Reduces compiler work, especially if .d.ts emit contains `import("./path").Type` or very large inferred types.

### ✅ Use Subtypes Instead of Large Unions

**Bad:**

```typescript
declare function process(item: TypeA | TypeB | TypeC | ... | TypeZ);
```

**Good:**

```typescript
interface BaseType {
  /* common properties */
}
interface TypeA extends BaseType {
  /* ... */
}
interface TypeB extends BaseType {
  /* ... */
}
declare function process(item: BaseType);
```

**Why:** Union checks are quadratic when reducing/eliminating redundant members. Subtypes are more efficient.

### ✅ Extract Complex Conditional Types

**Bad:**

```typescript
interface SomeType<T> {
  foo<U>(
    x: U,
  ): U extends TypeA<T>
    ? ProcessTypeA<U, T>
    : U extends TypeB<T>
      ? ProcessTypeB<U, T>
      : U extends TypeC<T>
        ? ProcessTypeC<U, T>
        : U;
}
```

**Good:**

```typescript
type FooResult<U, T> =
  U extends TypeA<T>
    ? ProcessTypeA<U, T>
    : U extends TypeB<T>
      ? ProcessTypeB<U, T>
      : U extends TypeC<T>
        ? ProcessTypeC<U, T>
        : U;

interface SomeType<T> {
  foo<U>(x: U): FooResult<U, T>;
}
```

**Why:** Extracted types can be cached. Inline conditional types are re-evaluated every time.

## Configuration Optimizations

### ✅ Configure include/exclude Properly

**Good tsconfig.json:**

```json
{
  "compilerOptions": {
    /* ... */
  },
  "include": ["src"],
  "exclude": ["**/node_modules", "**/.*/"]
}
```

**Check:**

- Only include source directories
- Explicitly exclude `node_modules` and hidden folders
- Don't mix source files from different projects
- Keep test files separate or make them easily excludable

### ✅ Limit @types Package Auto-Inclusion

**Global packages not needed:**

```json
{
  "compilerOptions": {
    "types": []
  }
}
```

**Only specific packages needed:**

```json
{
  "compilerOptions": {
    "types": ["node", "jest"]
  }
}
```

**Why:** TypeScript auto-includes all @types packages, which can slow compilation and cause conflicts.

### ✅ Enable Incremental Compilation

```json
{
  "compilerOptions": {
    "incremental": true
  }
}
```

**Why:** Saves state in .tsbuildinfo for faster subsequent builds.

### ✅ Skip Library Type Checking

```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

**Why:** Skips type-checking .d.ts files, which are usually already correct. Significant speedup for large projects.

### ✅ Enable Strict Function Types

```json
{
  "compilerOptions": {
    "strictFunctionTypes": true
  }
}
```

**Why:** Allows variance optimizations for assignability checks.

## Project Structure Optimizations

### ✅ Use Project References for Large Codebases

Split monolithic projects into multiple projects:

```
project/
├── shared/
│   └── tsconfig.json
├── client/
│   └── tsconfig.json (references shared)
├── server/
│   └── tsconfig.json (references shared)
└── tsconfig.json (root)
```

**When to use:**

- Monorepo with multiple packages
- Codebase >500 files
- Editor becomes slow/runs out of memory
- Different parts need different compiler settings

**Guidelines:**

- Aim for 5-20 projects
- Keep projects evenly sized
- Group files edited together
- Separate test code from production code

## Build Tool Optimizations

### ✅ Use Isolated Modules for Faster Transpilation

```json
{
  "compilerOptions": {
    "isolatedModules": true
  }
}
```

**Enables:**

- Babel/SWC for faster transpilation
- Parallel processing
- Tools: babel-loader, ts-loader with transpileOnly, esbuild

**Note:** Errors on features requiring cross-file information (const enums, namespaces).

### ✅ Separate Type-Checking from Build

Run type-checking in parallel, not blocking:

- fork-ts-checker-webpack-plugin (Webpack)
- tsc --noEmit in separate process

**Why:** Faster dev server rebuilds while still getting type errors.

## Diagnostic Commands

### Quick Checks

```bash
# See what files are included
tsc --listFilesOnly

# Understand why files are included
tsc --explainFiles > explanations.txt

# See resolved configuration
tsc --showConfig

# Get performance metrics
tsc --extendedDiagnostics

# Trace module resolution
tsc --traceResolution > resolutions.txt
```

### Performance Tracing

```bash
# Generate trace
tsc -p . --generateTrace ./trace --incremental false

# Analyze trace
npx @typescript/analyze-trace ./trace

# Visual analysis
# Open about://tracing in Chrome/Edge and load trace.*.json
```
