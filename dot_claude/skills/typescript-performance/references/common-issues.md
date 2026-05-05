# Common TypeScript Performance Issues and Solutions

## Issue: Slow Build Times

### Symptom

`tsc` takes a long time to complete compilation.

### Diagnosis

```bash
tsc --extendedDiagnostics
```

Look for:

- High "Check time" (>70% of total) → Type-checking issue
- High "I/O Read time" (>30% of total) → File system issue
- High file count (>2000) → Include/exclude configuration issue

### Solutions

**High Check Time:**

1. Generate and analyze trace: `tsc --generateTrace ./trace`
2. Identify slow files/expressions in trace
3. Apply code-level optimizations (see performance-checklist.md)

**High I/O Time:**

1. Review `include`/`exclude` in tsconfig.json
2. Ensure `node_modules` is excluded
3. Check if unnecessary directories are being scanned
4. Use `tsc --listFilesOnly` to see what's included

**High File Count:**

1. Use project references to split the project
2. Narrow include patterns
3. Add more specific exclude patterns

## Issue: Slow Editor (VS Code) Experience

### Symptom

- Autocomplete is slow
- Type information takes time to appear
- Editor becomes unresponsive

### Diagnosis

**Step 1: Get TS Server log**

1. Command Palette → "TypeScript: Open TS Server log"
2. Enable logging if not already enabled
3. Reproduce the issue
4. Check log for errors or slow operations

**Step 2: Check memory usage**

- High memory in TS Server → Project too large for single process

### Solutions

**Large Project:**

1. Enable project references with editor-specific settings:

   ```json
   {
     "disableReferencedProjectLoad": true,
     "disableSolutionSearching": true
   }
   ```

**3rd Party Plugins:**

1. Disable all non-essential VS Code extensions
2. Re-enable one by one to identify culprit

**Outdated TypeScript:**

1. Update to latest TypeScript version
2. Update @types packages

## Issue: node_modules Being Scanned

### Symptom

`--listFilesOnly` or `--explainFiles` shows many node_modules files.

### Diagnosis

```bash
tsc --listFilesOnly | grep node_modules | head -20
```

### Cause

`exclude` was customized and doesn't include `node_modules`, or `node_modules` exists in unexpected locations.

### Solution

```json
{
  "exclude": ["**/node_modules", "**/.*/"]
}
```

Note: `**/` prefix ensures all node_modules folders are excluded, even nested ones.

## Issue: Too Many @types Packages

### Symptom

- Compilation includes types from unused packages
- Errors like "Duplicate identifier 'IteratorResult'"

### Diagnosis

```bash
tsc --listFilesOnly | grep "@types"
```

### Solution

**No global types needed:**

```json
{
  "compilerOptions": {
    "types": []
  }
}
```

**Specific types only:**

```json
{
  "compilerOptions": {
    "types": ["node", "jest"]
  }
}
```

## Issue: Slow Type-Checking of Specific Code

### Symptom

Trace shows specific expressions/files taking excessive time.

### Diagnosis

1. Generate trace: `tsc --generateTrace ./trace`
2. Load in about://tracing
3. Identify wide checkExpression or checkVariableDeclaration boxes
4. Note file path and position from metadata

### Common Causes & Solutions

**Large Union Types:**

- **Problem:** `type Result = TypeA | TypeB | ... | TypeZ` (many members)
- **Solution:** Use base type with subtypes instead

**Complex Conditional Types:**

- **Problem:** Nested conditional types in function signatures
- **Solution:** Extract to type alias

**Deep Type Instantiation:**

- **Problem:** Generic types with many levels of nesting
- **Solution:** Add intermediate type annotations to limit depth

**Circular Type References:**

- **Problem:** Types that reference each other recursively
- **Solution:** Add explicit type annotations to break cycles

## Issue: Build Tool Integration Slow

### Symptom

Webpack/Vite/other bundler is slow when using TypeScript.

### Diagnosis

Compare `tsc` time with build tool time:

```bash
time tsc --noEmit
# vs
time npm run build
```

If build tool is significantly slower → Issue is with tool, not TypeScript.

### Solutions

**Use Faster Transpilation:**

- Enable `isolatedModules`
- Use esbuild/swc instead of tsc for transpilation
- Keep tsc for type-checking only

**Separate Type-Checking:**

- Run type-checking in separate process
- Use fork-ts-checker-webpack-plugin or similar
- Don't block hot reload on type errors

**Webpack-specific:**

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true, // Disable type-checking
          },
        },
      },
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(), // Type-check in parallel
  ],
};
```

## Issue: Memory Usage Too High

### Symptom

- TypeScript process uses >2GB memory
- Editor crashes or becomes very slow
- "JavaScript heap out of memory" errors

### Solutions

**Immediate:**

```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=8192 tsc
```

**Long-term:**

1. Split project using project references
2. Reduce number of files per project
3. Check for memory leaks in .d.ts files (extremely large generated types)

## Issue: Incremental Builds Not Helping

### Symptom

Builds are slow even with `--incremental` enabled.

### Diagnosis

Check if .tsbuildinfo is being generated and used:

```bash
ls -la tsconfig.tsbuildinfo
```

### Possible Causes

**tsbuildinfo being deleted:**

- Check if clean script removes it
- Ensure it's in .gitignore but not in clean script

**Too many files changing:**

- If most files change, incremental build can't help much
- Consider smaller projects with project references

**Different output location:**

- Ensure tsbuildinfo location matches build output
- Set explicitly: `"tsBuildInfoFile": "./path/to/.tsbuildinfo"`

## When to File an Issue

After trying the above solutions, file an issue if:

1. You have a minimal reproduction case
2. You've collected diagnostics (--extendedDiagnostics)
3. You've generated a performance trace
4. The issue persists on latest TypeScript version

Include in issue:

- TypeScript version (`npx tsc -v`)
- Node version (`node -v`)
- Minimal repro or trace files
- Output of `--extendedDiagnostics`
