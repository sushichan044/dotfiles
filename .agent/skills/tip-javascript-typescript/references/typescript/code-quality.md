# Code Quality Tools

## Overview

Automated code quality checks help maintain consistency and identify issues before they become problems.

## similarity-ts

AST-based code similarity detection tool for TypeScript/JavaScript.

**Basic Usage**:

```bash
similarity-ts .                           # Scan entire project
similarity-ts . --cross-file              # Detect duplicates across files
similarity-ts . --print --cross-file      # Show detailed analysis
```

**Key Options**:

- `--cross-file`: Enable cross-file duplicate detection
- `--print`: Show detailed similarity analysis
- `--threshold <0.0-1.0>`: Set similarity threshold (default is usually sufficient)

**When to Use**:

- Before refactoring to identify consolidation opportunities
- During code review to catch duplicate logic
- Periodic health checks for technical debt monitoring

---

<!-- Additional code quality tools can be added below -->
