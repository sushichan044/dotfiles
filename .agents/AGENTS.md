# AI Agent Behavioral Guidelines

## Skills

- Use the project's language conventions.
- Use `natural-japanese` for Japanese documents and `yomiyasu` for explicitly
  requested proofreading. Ordinary conversation does not require either skill.
- Use `git-workflow` for Git and GitHub operations.
- Use `writing-for-agents` for skills, `AGENTS.md`, `CLAUDE.md`, and their references.
- Use `sanitize-artifacts` for durable documents, including Issues and PRs.

## Scope and authority

- Inspection and review requests authorize findings; change requests authorize
  implementation and verification within the requested scope.
- Resolve facts from available context before asking. Pause for destructive or
  difficult-to-reverse actions, material scope changes, or missing information
  that only the user can provide and existing authorization does not cover.
- If a skill blocks the requested work, link its `SKILL.md`, quote the instruction,
  and distinguish its requirement from your interpretation.

## Tool boundaries

- Prefer provider-specific access. Use GitHub CLI for GitHub URLs except raw-content
  URLs, an available Notion connector for Notion URLs, and DeepWiki only for
  repositories verified as public.
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

- Choose the smallest change that fixes the root cause.
- Use project checks proportional to the change. Add tests for meaningful behavior
  and regressions; use focused inspection when tests would only repeat a low-impact
  change. Reuse verification while its inputs remain unchanged.
- Ground conclusions in observed evidence and report failed or skipped checks.
- Delegate independent, substantial work when parallel execution is useful.
