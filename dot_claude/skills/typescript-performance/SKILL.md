---
name: typescript-performance
description: Comprehensive TypeScript performance analysis and optimization. Use when users report slow TypeScript compilation, slow editor experience, or want to investigate TypeScript performance issues. This skill provides diagnostic tools, trace analysis workflows, and optimization strategies. Key triggers include mentions of slow builds, type-checking delays, tsc performance, editor lag with TypeScript, or requests to analyze/improve TypeScript performance. Always prioritize data-driven analysis using --extendedDiagnostics, --generateTrace, and TS Server logs before making optimization recommendations.
---

# TypeScript Performance Analysis and Optimization

This skill provides a systematic approach to diagnosing and resolving TypeScript performance issues through data-driven analysis.

## Core Principle: Always Start with Diagnostics

Never guess at performance issues. Always collect diagnostic data first:

1. **For build performance**: Run `--extendedDiagnostics` or generate a performance trace
2. **For editor performance**: Collect TS Server logs
3. **For configuration issues**: Use `--listFilesOnly` and `--explainFiles`

## Quick Start Workflow

### 1. Identify the Problem Type

Ask user to clarify:

- **Build performance**: `tsc` or bundler compilation is slow
- **Editor performance**: VS Code autocomplete/type-checking is slow
- **Both**: Likely a fundamental type-checking issue

### 2. Collect Diagnostic Data

#### For Build Performance Issues

**Quick Diagnostics:**

```bash
npx tsc -p . --extendedDiagnostics
```

Use `scripts/analyze_diagnostics.py` to parse and interpret the output:

```bash
npx tsc -p . --extendedDiagnostics 2>&1 | python scripts/analyze_diagnostics.py -
```

**Detailed Analysis (if needed):**

```bash
# Generate comprehensive trace
bash scripts/generate_trace.sh . ./trace_output

# Quick automated analysis
npx @typescript/analyze-trace ./trace_output

# Visual analysis in Chrome/Edge
# Open about://tracing and load trace_output/trace.*.json
```

#### For Editor Performance Issues

**Get TS Server log in VS Code:**

1. Command Palette → `TypeScript: Open TS Server log`
2. Enable logging if prompted
3. Reproduce the slow behavior
4. Return to get the log file

**Check for common issues:**

- High memory usage → Project too large
- Slow responses → Specific file/operation issue
- Frequent errors → Configuration problem

### 3. Analyze the Data

#### Interpreting extendedDiagnostics

Use `analyze_diagnostics.py` output to identify:

- **High Check time** (>70% of total): Type-checking bottleneck
  → Generate trace for detailed analysis

- **High I/O Read time** (>30% of total): File system issue
  → Check include/exclude configuration

- **High file count** (>2000): Configuration problem
  → Review tsconfig.json patterns

- **High memory usage** (>2GB): Project size issue
  → Consider project references

#### Interpreting Performance Traces

For detailed trace analysis guidance, read `references/trace-analysis-guide.md`.

Key steps:

1. Load trace in about://tracing or use `@typescript/analyze-trace`
2. Focus on the Checking phase (usually the bottleneck)
3. Identify wide boxes with high "Wall Duration"
4. Look for patterns:
   - Specific files taking excessive time
   - Repeated type instantiations
   - Deep call stacks in type-checking

### 4. Apply Optimizations

Based on diagnostic findings, consult `references/performance-checklist.md` for specific optimizations.

#### Common Fix Patterns

**Configuration Issues** (High I/O time, high file count):

- Fix include/exclude patterns
- Limit @types auto-inclusion
- Enable skipLibCheck

**Type-Checking Issues** (High Check time):

- Prefer interfaces over type intersections
- Add explicit return types
- Extract complex conditional types
- Use subtypes instead of large unions

**Project Structure Issues** (High memory, very large projects):

- Implement project references
- Split monolithic projects
- Separate test code

**Build Tool Issues**:

- Enable isolatedModules
- Use faster transpilers (esbuild/swc)
- Separate type-checking from transpilation

### 5. Verify Improvements

After applying fixes:

1. Re-run diagnostics to measure improvement
2. Compare before/after metrics
3. Ensure functionality is unchanged

## Common Issues Reference

For specific problem patterns and solutions, read `references/common-issues.md`.

Common issues covered:

- node_modules being scanned
- Too many @types packages included
- Slow type-checking of specific code patterns
- Build tool integration slowness
- Memory usage problems
- Incremental builds not helping

## Using the Scripts

### generate_trace.sh

Generates a complete performance trace with diagnostics:

```bash
bash scripts/generate_trace.sh [project-path] [output-dir]
```

Default: current directory, output to `./trace_output`

Output includes:

- trace.\*.json files (load in about://tracing)
- types.\*.json files (type information)
- diagnostics.txt (extendedDiagnostics output)

### analyze_diagnostics.py

Parses and analyzes extendedDiagnostics output:

```bash
# From file
python scripts/analyze_diagnostics.py diagnostics.txt

# From pipe
tsc --extendedDiagnostics 2>&1 | python scripts/analyze_diagnostics.py -
```

Provides:

- Key metrics summary
- Time breakdown with percentages
- Automated issue detection
- Specific recommendations

## Advanced Analysis

For complex cases requiring deep investigation:

1. **Review trace-analysis-guide.md** for detailed trace interpretation
2. **Cross-reference with types.json** to understand type structures
3. **Use Chrome DevTools Performance tab** as alternative to about://tracing
4. **Generate CPU profiles** with --generateCpuProfile for compiler profiling

## When to File an Issue

File a TypeScript issue if:

- Minimal reproduction case exists
- Diagnostics and trace data collected
- Issue persists on latest TypeScript version
- Solutions in this skill don't resolve the problem

Include:

- TypeScript version (`npx tsc -v`)
- Node version (`node -v`)
- extendedDiagnostics output
- Performance trace files (if applicable)
- Minimal reproduction code
