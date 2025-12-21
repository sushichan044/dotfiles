---
allowed-tools: Bash(gh issue view:*), Bash(git switch -c:*)
description: Find and fix an issue in the codebase by following a strict process.
argument-hint: [issueNumber]
---

# Find and fix issue

## Goal

Understand the issue and meet the completion requirements by implementing a fix.

## Steps (obey strictly)

YOUR_ISSUE_TO_FIX: $ARGUMENTS

1. **FIRST** check if issue is open: `gh issue view $ARGUMENTS --json state -q .state` (must be "OPEN")
2. **IMMEDIATELY** create branch: `git switch -c fix-issue-$ARGUMENTS` (DO THIS BEFORE ANY OTHER WORK!)
3. Now read issue details: `gh issue view $ARGUMENTS` to understand the issue
4. Locate the relevant code in our codebase
5. Implement a solution that addresses the root cause
   - Tool like `context7` can be used to search for relevant code, documentation, or examples
6. Add appropriate tests if needed
7. Commit changes with proper commit message
   - **IMPORTANT**: Use conventional commit message format
8. Prepare a concise PR description explaining the fix
   - **NEVER**: Do not push commits or create PRs. These are done by the user.

**CRITICAL**: Always create the branch (step 2) immediately after confirming the issue is open. This prevents accidental commits to main branch.
