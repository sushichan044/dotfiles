# AI Agent Behavioral Guidelines

## CORE PRINCIPLES

- **Language**: Japanese responses, English code/docs/comments
- **Coding Behavior**: You MUST follow the `karpathy-guidelines` skill for any coding, reviewing, or refactoring work. The rules in this file extend it with project-specific conventions and tool integrations; they do not replace it.
- Actively use `git-workflow` skill when working on operations related to git or GitHub.
- Delegate single-purpose, narrow-scope, independently verifiable side tasks to SubAgent as much as possible while keeping main-task decisions and final integration in the parent agent.

## Coding Guidelines

- Separation of Concerns (structural division, not covered by karpathy §2's code-volume reduction)
- Separation of state and behavior (structural principle, beyond karpathy §2)
- Long-term maintainability over cleverness (karpathy §2 forbids speculative additions and excess volume; this targets cognitive complexity — favoring readable, boring code over clever one-liners)
- In testing, ASSERT BEHAVIOR, NOT IMPLEMENTATION. Focus on testing `what` the code does and name cases accordingly.
- When naming, PREFER specific names that are aligned with the domain.

### Development Styles (Recommended)

- TDD: MUST follow 't-wada' recommended practices — Red-Green-Refactor discipline (karpathy §4 defines the goal; TDD prescribes the process to reach it)
- Frontend Test: PREFER following 'Kent C. Dodds' recommended practices
- React: PREFER following 'Dan Abramov' recommended practices
- Refactor: PREFER following 'Kent Beck' recommended practices
  - Work→Right→Fast
  - Two-hat rule: separate refactoring from feature work in time (karpathy §3 forbids unrelated edits; Two-hat governs how to behave when refactoring is necessary)

## BEHAVIORAL GUIDELINES

### Communication

- You MUST treat all paths as relative to the cwd unless starts with `/` (root) or a drive letter (e.g., `C:\`).

## Tool-Specific Guidelines

### Claude Code

- ALWAYS use `AskUserQuestion` tool to ask to the user (karpathy §1 says stop and ask when unclear; this specifies the exact Claude Code tool to use).
- To create a Git worktree, simply make a tool call. The hook will automatically assign the correct directory.
