# PR Granularity Guidelines

How to decide the right size and scope for a pull request — especially when working with stacked PRs.

## Why Granularity Matters

A well-scoped PR is easy to review, safe to deploy, and simple to revert. When PRs are too large, reviewers lose focus, bugs hide in the noise, and rollbacks become risky. When PRs are too small, the overhead of context-switching and CI runs outweighs the benefit.

The goal is not "small PRs" — it's **PRs that are independently meaningful and safely releasable**.

## Splitting Strategy: Logical First, Then Mechanical

### Step 1: Logical Split (by responsibility)

Group changes by what they do, not by when they were written.

Common logical boundaries:

- **Data layer** — schema migrations, model definitions, data access
- **Domain / business logic** — core functions, services, use cases
- **API / interface layer** — endpoints, handlers, serialization
- **UI / presentation** — components, views, styling
- **Infrastructure** — CI config, deployment, tooling
- **Tests** — when tests are substantial enough to warrant their own PR

A single logical unit should be cohesive: if you removed this PR from the stack, the remaining PRs would still make conceptual sense (even if they wouldn't compile).

### Step 2: Mechanical Constraint Ordering (by dependency)

After logical grouping, order the groups based on technical constraints:

1. **Schema / migration first** — database changes must land before code that uses new columns or tables
2. **Type definitions / interfaces** — shared types, protobuf definitions, API contracts
3. **Core logic** — business logic that depends on the types/schema above
4. **Consumers** — API handlers, UI components, CLI commands that use the core logic
5. **Integration glue** — wiring, configuration, feature flags
6. **Tests and docs** — can often go in parallel with their subject, or after

Within the same dependency level, prefer the ordering that minimizes the diff between adjacent PRs in the stack.

### Step 3: Validate the Split

For each PR in the proposed split, check:

- [ ] **Builds independently** — when stacked on its parent, does CI pass?
- [ ] **Has a clear "what and why"** — can you write a one-sentence summary of what this PR does and why it exists?
- [ ] **Reviewable in isolation** — can a reviewer understand this PR without reading the entire stack?
- [ ] **Safely deployable** — if this PR were merged and the rest of the stack abandoned, would the system be in a valid state? (Ideal, not always possible — but strive for it.)

## Sizing Heuristics

These are guidelines, not hard rules:

| Signal              | Likely too big  | Good range | Likely too small    |
| ------------------- | --------------- | ---------- | ------------------- |
| Changed files       | 20+             | 3–15       | 1                   |
| Lines changed       | 500+            | 50–300     | <20                 |
| Review time         | >1 hour         | 15–45 min  | <5 min              |
| Concepts introduced | 3+ new concepts | 1–2        | 0 (pure mechanical) |

A PR that touches 30 files but only renames a symbol is fine. A PR that touches 5 files but introduces 4 intertwined features is too big. Use judgment.

## Special Cases

### Database Migrations

- Always separate migration PRs from the code that uses the new schema
- Migration PRs should be deployable independently (additive changes: new columns, new tables)
- Destructive changes (drop column, rename) go in a later PR after all consumers are updated

### Type Definitions and API Contracts

- Shared types (protobuf, GraphQL schema, TypeScript interfaces used across packages) often deserve their own PR
- This PR becomes the foundation that other PRs in the stack build on

### Feature Flags

- If the feature is behind a flag, the PR that adds the flag can be merged early
- Subsequent PRs build the feature behind the flag
- Final PR enables the flag (or removes it)

### Refactoring Mixed with Feature Work

- Separate refactoring from feature changes — different PRs
- Refactoring PR comes first in the stack, feature PR builds on top
- This makes both PRs easier to review and safer to revert independently

## Anti-Patterns

### The Mega PR

Everything in one PR. Hard to review, risky to deploy, impossible to revert partially. Split it.

### The Scatter PR

Changes spread across unrelated areas with no cohesive theme. Each logical change should be its own PR.

### The Premature Split

Splitting into PRs so small that each one is meaningless without the others. If a PR can't be understood or reviewed on its own, it's too small.

### The Sequential Trap

Forcing a linear stack when parts of the work are independent. Use a tree structure: multiple child PRs branching from the same parent when there's no dependency between siblings.

## Stacked PR Topology

Not all stacked PRs must be linear. Consider the dependency graph:

```
Linear (A depends on B depends on C):
main ← C ← B ← A

Tree (B and C are independent, both depend on A):
main ← A ← B
           ← C

Diamond (D depends on both B and C — avoid if possible):
main ← A ← B ← D
           ← C ↗
```

Prefer linear or tree structures. Diamond dependencies create complex merge scenarios — reorganize to avoid them.
