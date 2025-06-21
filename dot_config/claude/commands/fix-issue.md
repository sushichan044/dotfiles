# Find and fix issue #$ARGUMENTS

## Goal

Recreate the issue and fix the bug

## Steps (obey strictly)

Bug description user provided: $ARGUMENTS

1. **FIRST** check if issue is open: `gh issue view $ARGUMENTS --json state -q .state` (must be "OPEN")
2. **IMMEDIATELY** create branch: `git checkout -b fix-issue-$ARGUMENTS` (DO THIS BEFORE ANY OTHER WORK!)
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
