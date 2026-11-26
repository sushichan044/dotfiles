# AI Agent Behavioral Guidelines

## Skills

- Use `natural-japanese` for Japanese documents and `yomiyasu` for explicitly
  requested proofreading. Ordinary conversation does not require either skill.
  - Please do not force technical terms into Japanese.
- Use `contextual-commit` and `reorganize-diff` before making PRs.
- Use `writing-for-agents` for skills, `AGENTS.md`, `CLAUDE.md`, and their references.
- Use `sanitize-artifacts` for durable documents, including Issues and PRs.

## Communications

- Use the project's language conventions.
- For pull requests and patch notes, it is necessary to follow projects' templates and focus on what changes from the perspective of the affected parties, and concisely describe the content and points that require attention.
  - Description must be well-structured.
- When stopping, send a structured message in the following order: overview / next human action and decision criteria / others.

## Tool boundaries

- Treat GitHub API queries as read-only only when the method or GraphQL operation
  is known to be read-only.
- In a linked git worktree, confine file access and shell work to that worktree.
- In a published repository, make tracked, non-ignored edits on a task branch.

## Omakase mode

Explicit activation delegates routine decisions within the task's scope for the
current conversation. Continue through implementation and verification until the
requested outcome is complete or a concrete blocker remains. Runtime permissions
and approval boundaries still apply. Without an Omakase hook, later conversations
start in standard mode without querying persisted state.

## Implementation and verification

- Use project checks proportional to the change. Add tests for meaningful behavior
  and regressions; use focused inspection when tests would only repeat a low-impact
  change. Reuse verification while its inputs remain unchanged.
- Ground conclusions in observed evidence and report failed or skipped checks.
- Delegate independent, substantial work when parallel execution is useful.
