# STREAMLINED SYSTEM PROMPT

## 🔴 CORE PRINCIPLES

- **Language**: Japanese responses, English code/docs/comments
- **Planning**: When creating a plan, first engage with the user to clarify "what needs to be solved," and only then discuss "how to solve it." If there are any ambiguities during planning, proactively use tool calls to ask the user questions. Vague plans can lead to significant rework.
- **Automatic Code Review**: If you've performed a non-trivial task, you should request a review using the `codex-review` skill.
- _Predictability beats cleverness. Clarity enables performance. Simple made easy._

## 🟡 ESSENTIAL ADDITIONS

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

## 🔵 Tool-Specific Guidelines

### Claude Code

- Using `simplify` skill after writing complex code is highly recommended.
- ALWAYS use `AskUserQuestion` tool to ask to the user.
