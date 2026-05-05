# TypeScript Performance Trace Analysis Guide

## Viewing Traces

### Using @typescript/analyze-trace (Quick Analysis)

```bash
npx @typescript/analyze-trace <trace-directory>
```

Provides automated summary of performance hotspots.

### Using Chrome/Edge (Visual Analysis)

1. Navigate to `about://tracing` in Chrome or Edge
2. Click "Load" button
3. Select `trace.*.json` file from trace output
4. For large traces, use process-tracing to downsample:

   ```bash
   npx process-tracing --sample=5 --close trace.1.json trace.1.json.gz
   ```

## Understanding the Trace Timeline

### Four Major Compilation Phases

1. **Program Construction** (findSourceFile boxes)
   - File parsing and module resolution
   - Look for largest findSourceFile boxes
   - Follow dependency chains to identify slow libraries

2. **Binding Phase**
   - Rarely an issue, can usually be ignored

3. **Checking Phase** (Most Important)
   - Type-checking work happens here
   - Focus analysis on this phase

4. **Emit Phase**
   - Code generation
   - Usually not the bottleneck

### Key Box Types in Checking Phase

#### checkSourceFile

- Shows time spent checking a specific file
- Metadata contains file path
- Look for files with high "Wall Duration"

#### checkExpression

- Time spent checking a particular expression
- Usually within the file from containing checkSourceFile
- High wall duration indicates complex type inference

#### checkVariableDeclaration

- Time spent on variable declaration
- Metadata fields:
  - `kind`: Member of SyntaxKind enum
  - `pos`: Zero-indexed character offset (start)
  - `end`: Zero-indexed character offset (end)
- Note: `pos` includes trivia (whitespace, comments) before the code

### Analyzing Performance Hotspots

1. **Identify wide boxes** with high "Wall Duration"
2. **Check "Self Time"** - time not accounted for by children
3. **Low self time** → problem is in child operations
4. **High self time** → this operation itself is slow

## Using types.json for Deep Analysis

When you need to understand why specific type checking is slow:

1. Find the type ID from trace metadata
2. Locate corresponding entry in `types.json` (line N contains type ID N)
3. Entry contains:
   - `symbolName`: Type name
   - `instantiatedType`: Base type being instantiated
   - `typeArguments`: Type arguments used
   - `firstDeclaration`: Source location
   - `flags`: Type flags

4. Recursively look up referenced types to understand the full type structure

## Common Patterns to Look For

### Repeated Type Instantiations

- Same type instantiated many times with different arguments
- Solution: Cache the instantiation or simplify the type

### Deep Call Stacks

- Many nested boxes in checking phase
- Indicates complex type relationships
- Solution: Break down into simpler types

### Wide Boxes Without Children

- High self time on a single operation
- Check if this is a known TypeScript performance issue
- May need to restructure code

## Reducing a Repro

Once you've identified slow code sections:

1. Extract minimal code that reproduces the slowdown
2. Remove unrelated code while keeping the performance issue
3. Test that the extracted code still shows the problem
4. File an issue with the minimal repro
