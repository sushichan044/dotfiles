# TypeScript Language-Level Patterns

This directory contains language-level coding techniques for TypeScript/JavaScript.

## Directory Structure

**Principle**: This directory contains topic-specific files with descriptive names for TypeScript/JavaScript language-level patterns.

Each file focuses on a specific aspect of the language. For example:

```tree
typescript/
├── type-safety.md
├── async-patterns.md
├── functional.md
└── code-quality.md
```

Create subdirectories when patterns need hierarchical organization (e.g., `advanced/`, `patterns/`).

## File Naming Guidelines

**DO**: Use descriptive topic names

- `type-safety.md`
- `async-patterns.md`
- `error-handling.md`
- `performance-optimization.md`

**DON'T**: Use generic names

- ❌ `README.md` (reserved for this directory index)
- ❌ `typescript.md` (redundant with directory name)
- ❌ `patterns.md` (too vague)

## Adding New Patterns

### Add to Existing File

1. Open the relevant file
2. Find the appropriate section

### Create New Category

If existing files don't fit:

1. Create new `.md` file or subdirectory in this directory
2. Follow the "File Naming Guidelines" above for naming
3. Use consistent pattern format for content
4. No need to update this README or SKILL.md (patterns are discovered automatically)

## Pattern Writing Best Practices

### DO

- **Use concrete examples**: Include working code
- **Clarify context**: Explain when and why to use
- **Show contrast**: Provide both good and bad examples
- **Stay concise**: Focus on essentials, avoid verbosity
- **Include types**: Explicit TypeScript type definitions

### DON'T

- **Abstract theory only**: Patterns must be practical
- **Over-explain**: Focus on pattern essence, not implementation details
- **Keep outdated patterns**: Remove or mark deprecated patterns
- **Over-comment code**: Prefer self-explanatory code

## Maintenance Guidelines

### Regular Review

- Update when TypeScript/JavaScript versions change
- Replace patterns when better approaches emerge
- Remove or mark deprecated patterns

### Pattern Priority

1. **Frequently used**: Daily patterns take priority
2. **Error prevention**: Bug-preventing patterns are high priority
3. **Readability**: Patterns that improve team understanding
4. **Performance**: Only when necessary; avoid premature optimization

## Usage

Claude Code automatically references patterns in this directory when writing TypeScript/JavaScript code. These techniques are applied without explicit user requests.
