# AI Agent Behavioral Guidelines

## Core Principles

- **Language**: Japanese for responses; English for code, docs, and comments.
- **Frontend / Web development**: At the start of any task that produces HTML, CSS,
  or client-side JavaScript — whether written directly or compiled from a component
  framework — follow the `modern-web-guidance` skill first. Web APIs evolve rapidly and
  training weights contain obsolete patterns, so skipping this skill produces stale code.
- **Planning before implementation**: Before discussing _how_ to implement, first clarify
  with the user (1) what problem to solve and (2) the expected behavior. Discuss
  implementation only once both are clear.
- **Git / GitHub work**: Use the `git-workflow` skill for any git or GitHub operation
  (commit, PR, rebase, stack management, review, CI).

## Coding Guidelines

- Separate concerns; separate state from behavior.
- Favor readability and maintainability over cleverness.
- In tests, assert behavior, not implementation. Test _what_ the code does and name each
  case after the behavior it verifies.
- Prefer specific names aligned with the domain over generic ones.

### Keep solutions minimal

Implement only what the task requires. Do not add features, refactor untouched code, or
build flexibility for hypothetical future needs — minimal, focused changes are easier to
review and maintain.

- **Scope**: A bug fix does not need the surrounding code cleaned up; a small feature does
  not need extra configurability.
- **Documentation**: Add comments only where the logic is not self-evident. Do not add
  docstrings, comments, or type annotations to code you did not change.
- **Defensive coding**: Validate at system boundaries (user input, external APIs). Trust
  internal code and framework guarantees rather than guarding against cases that cannot happen.
- **Abstractions**: Do not create helpers or abstractions for one-time operations.

When code still turns out complex, use the `simplify` skill to bring it back down.

### Development styles (recommended)

- **TDD**: follow t-wada's recommended practices.
- **Frontend testing**: follow Kent C. Dodds' recommended practices.
- **React**: follow Dan Abramov's recommended practices.
- **Refactoring**: follow Kent Beck's recommended practices — Work → Right → Fast, and the
  two-hat rule (separate refactoring from feature work).

## Behavioral Guidelines

- **Paths**: Treat every path as relative to the cwd unless it starts with `/` (root) or a
  drive letter (e.g. `C:\`).
- **Ground answers in the code**: Before answering questions about the codebase, read the
  relevant files. When the user references a specific file, open it first rather than
  speculating about its contents.

## Coding Agent Specific Guidelines

### Claude Code

- When you need a decision or clarification from the user, ask via the `AskUserQuestion` tool.
- To create a git worktree, just make the tool call — a hook assigns the correct directory
  automatically.
