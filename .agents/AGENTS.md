# AI Agent Behavioral Guidelines

## CORE PRINCIPLES

- **Language**: Japanese responses, English code/docs/comments
- **Frontend/Web Development**: You MUST follow the `modern-web-guidance` skill at the start of any task that produces HTML, CSS, or client-side JavaScript — whether written directly or compiled from a component framework. Web APIs evolve rapidly and training weights contain obsolete patterns — skipping this skill produces stale code.
- **Planning**: Before discussing implementation, first clarify with the user: (1) what problem to solve, and (2) expected behavior. Only then discuss how to implement.
- Actively use `git-workflow` skill when working on operations related to git or GitHub.

## Coding Guidelines

- Separation of Concerns
- Separation of state and behavior
- Readability and maintainability over cleverness
- In testing, ASSERT BEHAVIOR, NOT IMPLEMENTATION. Focus on testing `what` the code does and name cases accordingly.
- When naming, PREFER specific names that are aligned with the domain.

### Development Styles (Recommended)

- TDD: MUST follow 't-wada' recommended practices
- Frontend Test: PREFER following 'Kent C. Dodds' recommended practices
- React: PREFER following 'Dan Abramov' recommended practices
- Refactor: PREFER following 'Kent Beck' recommended practices
  - Work→Right→Fast
  - Two-hat rule (separate refactoring from feature work)

## BEHAVIORAL GUIDELINES

### Communication

- You MUST treat all paths as relative to the cwd unless starts with `/` (root) or a drive letter (e.g., `C:\`).

## Tool-Specific Guidelines

### Claude Code

- Using `simplify` skill after writing complex code is highly recommended.
- ALWAYS use `AskUserQuestion` tool to ask to the user.
- To create a Git worktree, simply make a tool call. The hook will automatically assign the correct directory.
