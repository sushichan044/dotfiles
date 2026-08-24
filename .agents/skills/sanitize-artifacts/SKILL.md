---
name: sanitize-artifacts
description: Inspect and revise generated artifacts so they read as natural, standalone deliverables, without leaking prompt instructions, conversation history, implementation constraints, or production process artifacts into user-facing content.
---

# sanitize-artifacts

Use this skill when the user asks you to inspect, clean up, sanitize, revise, polish, or quality-check artifacts produced during the current work session.

This skill is especially important when the artifact was produced through iterative prompting, corrective instructions, examples, constraints, or vibe-coding-style collaboration.

## Goal

Revise the artifact so that it stands on its own as a coherent final deliverable.

The artifact must not expose unnecessary traces of:

- the user's prompts
- conversation history
- intermediate reasoning
- implementation constraints
- tool choices
- avoided approaches
- prompt-engineering instructions
- scaffolding used during production
- examples that were provided only to guide intent
- corrective feedback given during the conversation

The final artifact should look like it was intentionally designed for its real audience, not assembled from the conversation that produced it.

## Core Principle

Treat the conversation as production context, not automatically as artifact content.

Before preserving any statement in the artifact, classify it as one of the following:

1. User-facing content that the artifact's audience genuinely needs
2. Production guidance that should influence the artifact but should not be visible
3. Incidental conversation residue that should be removed

Only category 1 should appear directly in the artifact.

Category 2 should be reflected indirectly through structure, tone, scope, assumptions, defaults, examples, naming, or design choices.

Category 3 should be removed.

## What to Remove or Rewrite

Look for and remove or rewrite content that unnecessarily says or implies:

- "As requested..."
- "Based on your instruction..."
- "We will not use..."
- "This avoids..."
- "Unlike the previous version..."
- "The user wanted..."
- "This document assumes..."
- "Because of the constraint..."
- "No Git/Homebrew/CLI/etc. is used..."
- "This was changed to..."
- "The prompt says..."
- "The conversation so far..."
- "This section was added because..."
- "To satisfy the requirement..."

Do not remove such content mechanically. Keep it only when the intended audience genuinely needs to know it.

## Examples vs. Intent

If the user gave an example to communicate intent, do not copy that example into the artifact unless the artifact itself specifically needs it.

Examples from the conversation are usually diagnostic material, not final content.

Use examples to infer:

- the desired level of abstraction
- the audience
- the tone
- what kinds of leakage to avoid
- what kinds of unnatural wording to remove
- what design constraints matter

Do not let examples accidentally become the topic of the artifact.

## Constraints Are Usually Invisible

User constraints should normally affect the artifact's design, not appear as explicit disclaimers.

For example:

Bad:

> This guide does not use Git, Homebrew, or additional CLI tools.

Better:

> Share the project folder using Google Drive.

The better version applies the constraint without exposing it as a production rule.

## Inspection Checklist

When sanitizing an artifact, check:

1. Does the artifact read naturally to someone who never saw the conversation?
2. Are there any sentences that explain why the artifact was written this way?
3. Are there any unnecessary mentions of tools, exclusions, constraints, or avoided alternatives?
4. Did a prompt example accidentally become part of the deliverable?
5. Are there signs of patchwork from multiple rounds of feedback?
6. Are tone, terminology, and assumptions consistent throughout?
7. Are headings and notes written for the artifact's audience rather than for the creator?
8. Is any meta-commentary present that belongs only in the production process?
9. Are disclaimers or caveats included only when the audience truly needs them?
10. Does the artifact have a single coherent voice?

## Revision Strategy

Prefer rewriting over explaining.

Do not add a report about what you sanitized unless the user asks for one.

When editing, preserve the artifact's intended purpose, technical correctness, and necessary user-facing requirements.

Remove production residue by converting it into natural artifact design.

For example:

- Convert "Do not use advanced terms" into simpler wording.
- Convert "Avoid CLI black boxes" into clear, concrete steps.
- Convert "Use Google Drive, not Git" into Drive-based workflow instructions.
- Convert "Beginner-friendly" into pacing, definitions, and examples.
- Convert "Do not mention X" into omission of X, not a statement that X is omitted.

## Output Rules

When asked to sanitize an artifact, output the revised artifact itself.

Do not preface the artifact with process commentary such as:

- "I removed the meta instructions."
- "I cleaned up the prompt leakage."
- "Here is the sanitized version."

A brief label is acceptable only if needed for clarity.

If the user asks for both the sanitized artifact and a change summary, put the artifact first and the summary after it.

## Quality Bar

The sanitized artifact should feel intentional, unified, and audience-native.

A reader should not be able to infer the prompting history, internal constraints, or corrective conversation unless those details are genuinely part of the deliverable.
