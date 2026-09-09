---
name: sanitize-artifacts
description: Inspect generated artifacts for prompt leakage or production residue, and revise them when the user requests cleanup or polishing.
---

# Sanitize Artifacts

Make the artifact a coherent standalone deliverable for its intended audience. Conversation context guides its design; audience needs determine its visible content.

## Workflow

1. Identify the artifact, its audience, and the requested operation from the session. Inspection and quality-check requests authorize findings; cleanup, revision, or polishing requests authorize edits. Reuse existing authorization when both are requested.
2. Classify suspect content using the rules below. Preserve technical correctness, necessary assumptions, and user-facing requirements.
3. For authorized edits, remove residue or rewrite it as useful audience-facing content. For inspection, report concrete locations and suggested revisions.
4. Review affected sections and their surrounding context for consistency and completeness. Finish when each identified issue is resolved or reported, and the artifact still meets its original purpose.

## Content Classification

| Content                         | Treatment                                                                   |
| ------------------------------- | --------------------------------------------------------------------------- |
| Information the audience needs  | Keep it visible, including necessary caveats or implementation constraints. |
| Production guidance             | Express it through structure, tone, scope, defaults, naming, or design.     |
| Incidental conversation residue | Remove it during revision.                                                  |

Phrases such as "As requested," "Unlike the previous version," "The prompt says," or "This section was added because" are inspection cues. Judge their purpose in context rather than deleting by keyword. A revision history or operational constraint may itself be part of the requested deliverable.

## Examples and Constraints

Use prompt examples to infer audience, abstraction level, tone, and design intent. Include an example in the artifact when it helps that audience understand the subject.

Translate production constraints into concrete content:

- "Do not use advanced terms" becomes suitable definitions and familiar wording.
- "Avoid CLI black boxes" becomes clear, concrete steps.
- "Use Google Drive, not Git" becomes instructions for sharing the folder through Drive.
- "Beginner-friendly" becomes suitable pacing and examples.

For example, a reader who only needs sharing instructions can use "Share the project folder using Google Drive." A declaration about excluded tools adds value only if it affects that reader's choices.

## Review Criteria

- A reader unfamiliar with the conversation can follow the artifact.
- Tool choices, exclusions, assumptions, and caveats appear where they affect the reader's actions or understanding.
- Prompt examples serve the subject rather than accidentally replacing it.
- Tone, terminology, headings, and assumptions remain consistent across revisions.
- Production commentary has become useful content or has been removed.

## Delivery

For inline revisions, return the revised artifact directly. When editing a file, provide the file link and a brief completion statement. Add a change summary when requested or when a material change affects the user's next step. Keep process commentary outside the artifact.

This presentation rule concerns the deliverable; it does not suppress necessary progress updates or blocker explanations in the conversation.
