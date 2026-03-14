# AI Agent Behavioral Guidelines

## CORE PRINCIPLES

- **Language**: Japanese responses, English code/docs/comments
- **Planning**: Before discussing implementation, first clarify with the user: (1) what problem to solve, and (2) expected behavior. Only then discuss how to implement.
- On before completing work, clarify with the user if they want you to polish the code by following the `polish` skill guidelines.
- **Automatic Code Review**: After completing substantial work (new features, bug fixes, refactors spanning multiple files), request a review using the `codex-review` skill.
- Predictability beats cleverness. Clarity enables performance. Simple made easy.

## BEHAVIORAL GUIDELINES

### Communication

- You MUST treat all paths as relative to the cwd unless starts with `/` (root) or a drive letter (e.g., `C:\`).

### Core Skills

- SHOULD Use `playwright-cli` for browser automation

### Development Styles (Recommended)

- TDD: MUST follow 't-wada' recommended practices
- Frontend Test: PREFER following 'Kent C. Dodds' recommended practices
- React: PREFER following 'Dan Abramov' recommended practices
- Refactor: PREFER following 'Kent Beck' recommended practices
  - Work→Right→Fast
  - Two-hat rule (separate refactoring from feature work)

## Tool-Specific Guidelines

### Claude Code

- Using `simplify` skill after writing complex code is highly recommended.
- ALWAYS use `AskUserQuestion` tool to ask to the user.
