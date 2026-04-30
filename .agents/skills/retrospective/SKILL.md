---
name: retrospective
description: "Retrospective based on a 6-stage process (input → interpretation → planning → action → inspection → output). Surfaces problems bottom-up from outputs and applies fixes top-down from upstream. Holes plugged upstream are not plugged again downstream. Use this skill after finishing a task, before creating a PR, or whenever the user says 'retrospective', 'wrap up learnings', 'identify improvements', or similar."
user-invocable: true
---

# Retrospective

Run this skill before a commit or PR is created.

An agent's task execution proceeds through 6 stages:

**Input → Interpretation → Planning → Action → Inspection → Output**

A retrospective lifts **Problems bottom-up** from downstream to upstream, and applies **Tries top-down** from upstream to downstream. **A hole plugged upstream is not plugged again downstream.** Layered defenses are added only when upstream countermeasures are low-confidence.

## The 6 stages

- **Input**: Receiving instructions, context, skills, CLAUDE.md, tool descriptions, and actively collecting information via Read/Grep/Glob/WebFetch, etc.
- **Interpretation**: Reading the meaning, intent, and premises of the input
- **Planning**: Task decomposition, ordering, tool selection, scope definition
- **Action**: Tool invocation, file edits, command execution
- **Inspection**: Verifying results and judging pass/fail
- **Output**: Reporting to the user and deciding what to persist

## Phase 1: Fact recording

Record the facts that occurred at each of the 6 stages, in chronological order. Do not mix in interpretation or evaluation.

- **Input**: Instructions received / information collected and its primacy
- **Interpretation**: Intent read / premises assumed
- **Planning**: Steps broken down / tools selected / scope fixed
- **Action**: Operations executed / side effects that occurred / places redone
- **Inspection**: Verifications performed / acceptance criteria adopted
- **Output**: Content reported / whether it was persisted / user reaction (dissatisfaction, satisfaction)

## Phase 2: Bottom-up Problem surfacing (Output → Input)

From downstream to upstream, surface Problems at each stage. At every stage, ask:

1. What Problem occurred at this stage?
2. Could this stage have detected or corrected the downstream Problem?
3. Is the true cause here, or further upstream?

Order (reverse):

1. **Output**: Excess or missing in the report / missing persistence / specifics of user dissatisfaction
2. **Inspection**: Verification skipped / wrong acceptance criteria / inappropriate verification method
3. **Action**: Tool misuse / wrong arguments / missed side effects / environment misrecognition
4. **Planning**: Wrong decomposition granularity / wrong order / scope drift
5. **Interpretation**: Misreading of intent / swapping of premises / overlooked contradictions
6. **Input**: Insufficient information / contaminated information / insufficient collection / primary source not consulted

### Are existing rules themselves inducing the Problem?

If a description in CLAUDE.md or a skill invites a literal interpretation that causes runaway behavior, the rule itself has a defect in wording or granularity. Do not stop at blaming only your own interpretation.

### Input errors are an independent factor alongside insufficiency

"Insufficient information" and "contaminated information" are different. Countermeasures differ too. Identify the source of contamination (outdated skill, stale CLAUDE.md, tool description divergent from implementation, secondary source treated as primary, hallucinated memory, distorted previous-session summary).

## Phase 3: Extracting Keeps

At each stage, extract the success patterns worth keeping.

- Which stage had what working?
- Can it be abstracted into a reusable form?

Quality bar:

- Not specific to this case; applicable to similar situations
- Not "verified X" but at the level of "did not place a premise without verification"

## Phase 4: Top-down Try rollout (Input → Output)

For the true causes identified in Phase 2, establish Tries from upstream downward. **A hole plugged upstream is not plugged again downstream.**

Before establishing a Try at each stage, ask:

- If the true cause was already cut off upstream, no countermeasure is needed at this stage
- Layered defense is applied only when the upstream countermeasure is low-confidence

Order (forward):

1. **Input**: Define information source priority / discipline active collection / fix stale skills, CLAUDE.md, tool descriptions
2. **Interpretation**: Add confirmation conditions / surface premises / discipline contradiction detection
3. **Planning**: Templatize plans / discipline decomposition granularity / define scope
4. **Action**: Tool selection criteria / turn operation patterns into skills / enumerate side effects in advance
5. **Inspection**: Document inspection items / define acceptance criteria
6. **Output**: Report format / discipline persistence decisions

### Continuously recurring work patterns

Among the Problems from Phase 2, ones that satisfy all of the following are skill candidates:

- Consist of multiple steps
- Will recur in the future
- Not already covered by an existing skill, or can be handled by extending one

Bad example: "Procedure for the specific files edited this time" (too local)
Good example: "Post-merge workflow after a PR is merged (delete branch → retrospective → update handover)"

### Quality bar for principles

Bad example: "Verify Gemini API `oneOf` support in advance"
Good example: "Do not use secondary information as a basis for causal reasoning. Back it up with an actual check or a primary source."

## Phase 5: Improvement implementation flow

Process each Try from Phase 4 via the following flow. **Always judge from Step 1 in order.** At each step ask "can this means address it?" — if yes, apply it and end the flow. If no, proceed to the next step. Do not skip ahead.

### Step 1: Can it be eliminated?

Ask whether the rule or work itself can be prevented from arising: architectural change, automation that removes the step, design that structurally prevents the problem.

- Yes → apply and end the flow
- No → proceed to Step 2. Record why you judged it impossible

### Step 2: Can a deterministic guardrail enforce it?

Ask whether a machine can enforce or detect it: lint, typecheck, CI, pre-commit hooks, `settings.json` hooks, etc.

- Yes → apply and end the flow
- No → proceed to Step 3. Record why you judged it impossible

### Step 3: Can it become a skill?

If it is a continuously recurring work pattern, separate it into a `SKILL.md` as a procedure. If an existing skill covers it, extend that one.

Placement layer:

- Workspace-specific work pattern → workspace `<workspace>/.claude/skills/<name>/SKILL.md`

Judgment:

- Target is a work pattern → must be handled here (no exceptions). End the flow
- Target is a principle that cannot be expressed as a skill → proceed to Step 4

### Step 4: Can it be expressed in an agent prompt?

Ask whether it can be defined as the behavior of a specific agent.

Placement layer:

- Workspace-specific agent behavior → workspace `<workspace>/.claude/agents/<name>.md`

Judgment:

- Yes → apply and end the flow
- No → proceed to Step 5. Record why you judged it impossible

### Step 5: Append to workspace CLAUDE.md (last resort)

Only when Steps 1–4 are all judged impossible. The target is concrete work, problem-solving, workflows, or domain knowledge specific to that workspace.

**Why CLAUDE.md is the worst option: it is not modular and has no separation of concerns.** Steps 1–4 each carry a module boundary (design unit, guardrail unit, skill unit, agent unit). CLAUDE.md piles all responsibilities into a single file, causing bloat, context pollution, and responsibility mixing.

### Handling the global layer

**As a retrospective outcome, do not modify the global layer (everything under `~/.claude/`: CLAUDE.md, skills, agents, settings.json, etc.).** Additions, deletions, and modifications are all forbidden.

Extraction to the global layer is **overreach**. Even if a Phase 4 target is judged to have universal applicability, the retrospective does not write to the global layer. Present it to the user as a "candidate for promotion to global" and execute it as an independent task only after receiving explicit instruction. It is outside the retrospective's scope.

All retrospective outcomes are written to workspace-local locations only. Placements are workspace CLAUDE.md, skills, or agents.

### Discipline (common to CLAUDE.md edits)

- If a Problem recurs that an existing rule should cover, revise that rule's wording, placement, or priority. Do not leave a non-functional rule in place while stacking similar rules on top
- Do not feel you have handled a problem just by adding a rule. Recurrence is evidence of a defect in an existing rule; face the cause (wording, placement, priority)
- One principle per line. Examples minimized
- Merge similar items. Do not let it bloat
- Do not mix layers. Do not write concrete work into the global layer

### Step 6: Retroactively apply new rules to session artifacts

Once Steps 1–5 produce a new rule / skill / guardrail, retroactively check the artifacts already produced in this session (issues, MR descriptions, comments, docs, code, commit messages) against the new rule.

- Establishment and application are separate steps. Creation alone does not improve recent outputs
- When you detect a violation of the new rule, update the original artifact (GitLab / GitHub / file)
- When you confirm no violations, include "confirmed" in the retrospective submission

If artifacts that violate a rule you just established remain as is, the retrospective's outcome is empty.

## Submission

Present the results of Phases 1–5 to the user and apply the improvements. After application, if there are uncommitted changes, autonomously commit and push.
