---
name: review-plan
description: "Review a plan against the current codebase, focusing on problem framing, expected behavior, and architecture decisions"
disable-model-invocation: true
---

# Review Plan

Review the plan passed in arguments against the current codebase.

This skill can be invoked directly by the user or indirectly from Claude Code hooks through `codex exec`.
Hook-driven invocations may reuse a Claude-session-specific Codex thread via `codex exec resume <thread_id>`.
When invoked from a hook, `$ARGUMENTS` should be treated as the current full plan.
If the same Codex thread includes a previous review of an older plan revision, you may use that thread context to understand what changed, but you must still review the current full plan.

This command is diagnostic only.

- Do not edit files.
- Do not rewrite the plan.
- Do not drift into implementation details unless they expose a missing architectural decision.

Start with repository exploration, then review the plan.

## Workflow

1. Treat `$ARGUMENTS` as the current full plan to review.
2. If argument is empty, warn and exit with no findings.
3. Explore the repository to find the code, configuration, docs, and conventions that the plan touches.
4. Review the plan using the priorities below.
5. Return exactly one JSON object matching the configured output schema.

## Review Priorities

Prioritize these questions in order:

1. Is the problem being solved clear?
2. Is the reason for solving it clear and justified?
3. Is the expected behavior or success criteria concrete?
4. Are the architecture decisions clear, coherent, and aligned with the current codebase?
5. Are boundaries, responsibilities, dependencies, risks, and non-goals explicit enough?
6. Are there unresolved decisions or ambiguities that would likely cause rework?

Focus more on `what to solve`, `why solve it`, and `architecture decisions` than on `how to implement it`.

Only flag implementation-detail gaps when they make the plan unsafe, contradictory, or impossible to execute confidently.

## Evidence Rules

- Ground every substantial finding in repository evidence when possible.
- Cite concrete files, symbols, directories, or established patterns.
- If the repo does not provide enough evidence, say that explicitly instead of guessing.
- Do not reject a plan for being different from the current codebase unless you can explain the concrete mismatch or migration cost.
- Ignore style nits, wording polish, and task-granularity preferences unless they obscure a decision.
- Do not limit the verdict to changes since the last review. Review the current full plan.

## Asking Questions

Do not start an interview by default.

Use `AskUserQuestion` only when:

- one critical ambiguity prevents any meaningful verdict even after repository exploration.

Otherwise, reflect missing information through findings or `reason`.

## Severity

- `P1`: Blocking issue. Resolve before implementation starts.
- `P2`: Important ambiguity or mismatch. Clarify before implementation.
- `P3`: Useful improvement or missing context. Not immediately blocking.

## Output Format

Return exactly one JSON object and nothing else.

Use this shape:

```json
{
  "decision": "allow | deny",
  "reason": "Short summary suitable for a hook permission message",
  "findings": [
    {
      "severity": "P1 | P2 | P3",
      "title": "Short finding title",
      "why": "Why this matters",
      "repoEvidence": "Concrete repo evidence or an explicit statement that the repo lacked evidence",
      "suggestion": "What to clarify or change"
    }
  ]
}
```

Decision rules:

- Return `"deny"` when any unresolved `P1` or `P2` finding exists.
- Return `"allow"` when there are no unresolved `P1` or `P2` findings.
- `P3` findings may coexist with `"allow"`.
- When there are no findings, return an empty `findings` array.

Keep `reason` concise and high-signal because hooks may surface it directly to the user.
