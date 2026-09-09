---
name: gh-sub-issue
description: Link existing GitHub issues, create child issues, list children, or unlink parent-child relationships with gh sub-issue.
---

# GitHub Sub-issues

## Procedure

1. Use `git-workflow` to resolve the repository and the requested parent and child
   issues. Reuse issue URLs from context; read their metadata to verify exact targets.
2. Read `gh sub-issue <operation> --help` for supported flags. The installed extension
   is the command reference. If missing, report the required extension or follow an
   already authorized setup request.
3. For creation, use `prepare-issue-pr` to prepare a template-compliant title and body.
   For linking or removal, inspect the existing relationship first.
4. Perform the requested operation. Listing is read-only; creation, linking, and
   unlinking require that operation to be in scope. An unlink removes the relationship
   while preserving both issues. Use noninteractive confirmation flags only for
   resolved, authorized targets.
5. List children with all states and enough results to verify the outcome. After an
   ambiguous write error, inspect state before retrying to avoid duplicate issues.

## Examples

Replace the sample IDs with verified targets:

```bash
gh sub-issue add 123 456 --repo owner/repo
gh sub-issue create --parent 123 --title "Add login endpoint" --repo owner/repo
gh sub-issue list 123 --state all --json number,title,state --repo owner/repo
gh sub-issue remove 123 456 --repo owner/repo
```

For multiline bodies, use a file input when the installed extension supports one,
or pass the text as a safely quoted argument. Select labels, assignees, and projects
from the task and repository conventions.

Completion: report the parent and affected issue URLs and the verified relationship,
or the requested listing with any result-limit caveat.
