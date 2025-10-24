# Library-Specific Tips

This directory contains library and framework-specific tips, best practices, and usage patterns.

## Directory Structure

**Principle**: Top-level directories under `libraries/` correspond to library names.

Each library directory contains topic-specific files with descriptive names. For example:

```
libraries/
├── vitest/
│   └── table-tests.md
├-- ... other libraries ...
```

To find tips for a specific library, look for its directory under `libraries/`.

## Adding Library Tips

### Create New Library Directory

1. Create directory named after the library (e.g., `react-query/`, `zod/`, `prisma/`)
2. Add topic-specific files with descriptive names:
   - `query-basics.md` (not `README.md` or `react-query.md`)
   - `mutations.md`
   - `cache-optimization.md`

### File Naming Guidelines

**DO**: Use descriptive topic names

- `table-tests.md`
- `validation-patterns.md`
- `query-basics.md`
- `cache-optimization.md`

**DON'T**: Use generic names

- ❌ `README.md` (reserved for directory indexes only)
- ❌ `vitest.md` (redundant with directory name)
- ❌ `patterns.md` (too vague)

## Coverage Areas

Tips focus on:

- Library-specific recommended patterns
- Common mistakes and how to avoid them
- Performance optimization
- Type definition usage
- Integration considerations

## Tips Writing Best Practices

### DO

- **Practical examples**: Real-world, usable code
- **Reference official docs**: Note when deviating from official recommendations
- **Version info**: Include when relevant
- **Type safety**: Emphasize TypeScript type usage
- **Error handling**: Library-specific error handling patterns
- **Descriptive file names**: Make file purpose clear from name alone

### DON'T

- **Copy official docs**: Avoid duplicating basic usage
- **Overly personal config**: Focus on team-usable patterns
- **Outdated versions**: Remove or mark deprecated features
- **Over-dependency**: Avoid patterns that create tight coupling
- **Generic file names**: Don't use `README.md` or library name as file name

## Maintenance

- Update on library major version changes
- Replace patterns when better approaches emerge
- Remove or mark deprecated features
- Add new libraries as they are adopted
- Keep file names descriptive and topic-focused

## Usage

Claude Code references tips in this directory when working with specific libraries. Library-specific best practices are automatically applied when generating code.
