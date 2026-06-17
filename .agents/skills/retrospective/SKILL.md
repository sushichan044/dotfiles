---
name: retrospective
description: "Retrospective based on a 6-stage process (input → interpretation → planning → action → inspection → output). Surfaces problems and opportunities bottom-up from outputs and applies fixes top-down from upstream. Use this skill after finishing a task, before creating a PR, or whenever the user says 'retrospective', 'wrap up learnings', or similar."
user-invocable: true
---

# Retrospective

Run before a commit or PR is created.

An agent's task execution proceeds through 6 stages.

## On the limits of self-report

Same-context self-reflection is documented to fail via "degeneration of thought" (Reflexion, Multi-Agent Reflexion): the reflecting model reinforces its original bias rather than finding a new angle.

This skill mitigates that by ending the Submission with one mandatory `retrospective-critic` invocation that audits six bias surfaces in one fresh-context pass.

Critics shift the probability away from append-only failure modes; they do not eliminate it. A low-finding verdict is not proof of thoroughness — only that the critic did not catch the main agent.

## The 6 stages

- **Input**: Receiving instructions, context, skills, CLAUDE.md, tool descriptions, and actively collecting information.
- **Interpretation**: Reading the meaning, intent, and premises of the input.
- **Planning**: Task decomposition, ordering, tool selection, scope definition.
- **Action**: Tool invocation, file edits, command execution.
- **Inspection**: Verifying results and judging pass/fail.
- **Output**: Reporting to the user and deciding what to persist.

## Phase 1: Fact recording

Record what occurred at each stage in chronological order. Do not mix in interpretation.

For Output, include the user's reaction (dissatisfaction or satisfaction) — this is the downstream signal Phase 2 lifts upstream.

## Phase 2: Bottom-up Problem and Opportunity surfacing

Walk from Output back to Input. At each stage, surface both axes:

- **Problems** — failures that occurred. Could this stage have caught the downstream Problem? Is the true cause here, or further upstream?
- **Opportunities** — no failure occurred, but a better outcome was possible: a faster path, a newly available tool, an unmet ideal.

A retrospective that surfaces only Problems is a defensive workflow. A hole plugged upstream is not plugged again downstream.

## Phase 3: Keeps

At each stage, name a success pattern worth keeping.

Quality bar: applicable to similar future situations, phrased as a principle, not as a single verified fact.

## Phase 4: Top-down Try rollout

For each true cause from Problems and each gap from Opportunities, write a Try from Input downward.

If the cause is cut off upstream, no downstream countermeasure is needed. Layered defense only when the upstream countermeasure is low-confidence.

## Phase 5: Improvement implementation flow

For each Try, judge from Step 1 in order, and stop at the first step that applies.

1. **Eliminate** — architectural change, automation that removes the work.
2. **Deterministic guardrail** — lint, typecheck, CI, hook.
3. **Skill** — multi-step recurring workflow.
4. **Agent prompt** — specific agent behavior.
5. **Operate on the existing rule library** — prefer **delete** (rule no longer needed), **move** (wrong placement), **fix** (rule content is wrong) over **append** (new rule). Re-wording is explicitly out of scope: if a rule fails to fire, the defect is structural, not rhetorical.

As a retrospective outcome, do not modify the global layer (everything under `~/.claude/`). Present global candidates to the user as a separate task.

## Submission

Invoke `retrospective-critic` (bundled at `agents/retrospective-critic.md`) once. Pass it:

- the workspace rule library entry points
- the Keeps and Opportunities from Phase 2 / 3
- the Step 5 search log
- the proposed Submission text
- the workspace writing-style source

Action the verdict's findings this retrospective wherever possible:

- `delete`, `move`, or `fix` workspace-local rules immediately
- queue plugin-PR-scoped findings as separate PRs
- report items requiring external coordination as `needs explicit follow-up`

Present the result to the user as a single readable headline plus a list of actions taken, followed by counters (problems surfaced, opportunities surfaced, deleted, moved, fixed, appended). If uncommitted changes remain, commit and push.
