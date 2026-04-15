# Diff Granularity Guidelines

How to decide the right size and scope for a logical change, whether the output will become stacked PRs or a cleaned-up commit series.

## Why Granularity Matters

A well-scoped logical change is easier to review, safer to revert, and easier to reason about later. Oversized units hide risk. Over-splitting creates process overhead and destroys narrative coherence.

The goal is not "small units." The goal is **units that each tell one meaningful story**.

## Splitting Strategy: Logical First, Mechanical Second

### Step 1: Logical Split (by change intent)

Group changes by what they accomplish, not by when they were written and not by which file they happen to touch.

Common logical boundaries:

- **Data layer** — schema migrations, model changes, persistence behavior
- **Contracts** — types, schemas, interfaces, protocol definitions
- **Domain logic** — services, use cases, business rules
- **Consumers** — API handlers, UI screens, CLI commands
- **Infrastructure** — build, CI, deployment, tooling, configuration
- **Refactors** — structure cleanup with no behavior change
- **Tests / docs** — when large enough to stand as their own unit

A logical unit is good when you can describe it in one sentence:

- What changed
- Why it exists

If you need "and also" repeatedly, it is probably still multiple units.

### Step 2: Order by dependency

After logical grouping, order by what must exist first:

1. **Schema / migration**
2. **Contracts / shared types**
3. **Core logic**
4. **Consumers**
5. **Integration / wiring / rollout**
6. **Tests / docs**

For PR output, dependency can produce a tree. For commit output, keep a linear order that preserves readability.

### Step 3: Keep mechanical fallout with its cause

Some changes are not meaningful on their own:

- Renamed imports
- Updated snapshots
- Regenerated files
- Small adapter tweaks caused by an earlier refactor

These belong with the logical change that caused them. Do not promote mechanical fallout into its own unit.

## Validation Checklist

For each proposed unit, check:

- [ ] **Single purpose** — one clear story, no mixed concerns
- [ ] **Readable in isolation** — a reviewer or future maintainer can understand it without replaying the entire diff
- [ ] **Clean dependency boundary** — prerequisites are explicit
- [ ] **Reasonable size** — not so large that multiple concepts blur together
- [ ] **Reasonable independence** — reverting it would be conceptually clear

## Sizing Heuristics

These are signals, not hard limits:

| Signal             | Likely too big  | Good range | Likely too small |
| ------------------ | --------------- | ---------- | ---------------- |
| Changed files      | 20+             | 3-15       | 1 with no story  |
| Lines changed      | 500+            | 50-300     | <20              |
| New concepts       | 3+              | 1-2        | 0                |
| Explanation needed | Multi-paragraph | 1 sentence | "rename only"    |

Context matters. A 10-file refactor may still be one logical change. A 3-file diff may still be too broad.

## Output-Specific Guidance

### If the output is stacked PRs

- Prefer units that are independently reviewable
- Favor additive, safe-to-merge foundations early
- Separate refactors from behavior changes
- Avoid diamond dependencies when possible

### If the output is a commit series

- Prefer units that create a readable history
- Keep each commit bisect-friendly when practical
- Separate pure refactors from behavior changes
- Avoid microscopic commits whose only meaning is extraction mechanics

## Special Cases

### Database Migrations

- Separate additive schema changes from consumers that depend on them
- Put destructive migrations later, after all consumers are updated

### Refactor Mixed with Feature Work

- Split the refactor first if it clarifies the feature
- If the refactor only exists to support one tiny behavior change and is inseparable, keep them together and note why

### Feature Flags

- Flag introduction can be its own foundational unit
- Feature implementation follows behind the flag
- Flag enablement or cleanup belongs later

### Tests

- Keep small test updates with the behavior they validate
- Split tests only when they are substantial and easier to review separately

## Anti-Patterns

### The Mega Unit

Multiple concepts bundled together because they happened in one burst of work.

### The Scatter Unit

Unrelated edits grouped only because they touch similar layers or were edited together.

### The Premature Split

Units so small that they have no meaning beyond "part 3 of extraction."

### The Mechanical Commit Trap

History that reflects extraction steps instead of logical changes:

- "fix import"
- "move file"
- "address lint"

These are not meaningful units unless they are the point of the change.

### The Fake Independence Trap

Pretending two units are independent when one cannot be understood without the other. Merge them.
