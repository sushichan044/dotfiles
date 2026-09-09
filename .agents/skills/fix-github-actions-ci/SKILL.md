---
name: fix-github-actions-ci
description: Investigate GitHub Actions failures and implement requested CI repairs using failed logs and workflow definitions.
---

# Fix GitHub Actions CI

Use `git-workflow` for repository operations. An investigation request ends with
the diagnosis; a repair request continues through the supported fix and verification.
Reuse publication authority from the requested PR workflow.

## Procedure

1. Resolve the PR or branch from the conversation and repository. Query current PR
   metadata and checks; distinguish no PR from a failed query. A branch without a PR
   can be investigated through its workflow runs.
2. Identify failed checks and their revision:

   ```bash
   gh pr checks <PR> --repo <owner/repo> --json name,state,bucket,workflow,link
   gh run list --repo <owner/repo> --branch <branch> --commit <SHA> \
     --json databaseId,headSha,status,conclusion,workflowName,url
   ```

   Use the check link or matching revision to choose the run. Investigate upstream
   lint or build failures before downstream jobs that depend on them.

3. Read the failed logs and the relevant workflow:

   ```bash
   gh run view <run-id> --repo <owner/repo> --log-failed
   gh workflow view "<workflow-name>" --repo <owner/repo> --yaml
   ```

   Match the error to source and configuration. Record affected files, the observed
   failure, its supported cause or remaining hypothesis, and the check that would
   demonstrate resolution.

4. For a requested repair, make the smallest change addressing the cause. Run the
   relevant workflow commands locally, including focused tests when the failure is
   behavioral. Inspect `needs` dependencies for checks hidden by the initial failure.
   Choose checks by their coverage, rather than excluding commands named `test`.
5. Commit and publish using the applicable `git-workflow` steps when authorized.
   If called by `watch-ci`, that caller owns monitoring: return the new revision
   and local results without starting a nested watch. Otherwise use `watch-ci`
   to verify published checks.

## Completion

A diagnosis includes the failing run, evidence, cause or precise evidence gap, and
the proposed fix. A repair includes the change and observed verification result.
Claim remote CI is fixed only after checks pass on the repaired revision. When
publication or external access is blocked, preserve the verified local fix and identify
the remaining action.
