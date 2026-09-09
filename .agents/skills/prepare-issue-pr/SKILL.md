---
name: prepare-issue-pr
description: Draft or refine issue and PR titles and bodies using repository templates, related evidence, and PR base relationships.
---

# Prepare Issues and Pull Requests

Prepare a complete title and body for the requested artifact. Follow `git-workflow`
for Git/GitHub operations. A drafting request ends with the draft; a creation or update
request continues to the authorized publication step in the calling workflow.

## Procedure

1. Identify issue versus PR from the request and context. Locate templates using
   `rg --files --hidden`, including issue-form YAML and repository-level Markdown.
   Choose the template matching the task; ask only if the alternatives encode a
   material product decision.
2. Read the selected template and preserve required headings, fields, and checkboxes.
   Use a compact problem/outcome/verification structure when no template exists.
3. For a PR, inspect the final diff against its resolved base and the relevant code.
   Use `adjust-pr-base` discovery for an unmanaged branch; use `gh-stack` metadata
   for a managed stack. Discovery can run before an open PR exists and does not edit it.
   Resolve genuine ancestry ties before publication, while completing the body.
4. Write one recommended title and a body explaining the problem, resulting behavior,
   and verification. Scale implementation detail to what a reviewer needs to judge
   the change. Include concrete links supplied by the task or found in relevant evidence.
5. Follow an explicitly requested language, then the template or repository language,
   otherwise English. Use `japanese-tech-writing` and `natural-japanese` for a Japanese technical deliverable.
6. For an update, rewrite the title and body around the final change. Preserve useful
   review context. Resolving threads or posting replies is a separate operation requiring
   authorization; use `github-pr-review-operation` when requested.
7. Return the finished draft and relevant base choice, or hand it to the authorized
   publication workflow. Multiline CLI bodies use `--body-file`.

## Description Rules

- Explain each PR on its own terms. Mention another PR only when that context is
  needed to understand its purpose, or when stack tooling/base metadata requires it.
- Include observed validation and its limits. Leave unchecked checkboxes unchecked.
- Keep non-obvious tradeoffs in the description when reviewers need them. A drafting
  task does not authorize source-code comments or unrelated code edits.
- For an issue, describe observed and expected behavior, impact, and reproducible evidence.
  Separate a proposed implementation from the diagnosed problem.
- Refine routine wording directly. Offer alternatives only when they represent a
  consequential choice; completion does not depend on a title-selection interview.

Completion: the title and body satisfy the selected template, factual claims have
support, and the base is resolved or its exact ambiguity is stated.
