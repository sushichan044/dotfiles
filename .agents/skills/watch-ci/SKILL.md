---
name: watch-ci
description: Monitor CI after a push, PR creation, or rebase; classify failures and continue authorized repairs until checks pass or a concrete blocker remains.
---

# Watch CI

Read failure logs before choosing a repair or rerun. Observation-only requests
authorize monitoring and reporting; carry repair and publication authorization
from the user or calling workflow.

## Procedure

1. Resolve the repository, branch, PR, and current head SHA through `git-workflow`.
   Monitor the requested revision, updating the target after an authorized fix.
2. For a PR, inspect all checks:

   ```bash
   gh pr checks <PR> --repo <owner/repo> --json name,state,bucket,link,workflow
   ```

   Interpret `bucket`: `pass` is successful, `pending` requires waiting,
   `fail` requires investigation, and `cancel` requires checking why it was
   cancelled. Accept `skipping` only when the workflow's conditions make it expected.
   An empty result or query error is not a pass.

   Without a PR, list runs for the target commit:

   ```bash
   gh run list --repo <owner/repo> --branch <branch> --commit <SHA> \
     --json databaseId,headSha,status,conclusion,url,workflowName
   ```

   Inspect every applicable workflow, increasing the result limit if truncated.
   A short list of the latest runs may omit relevant checks.

3. Wait using the runtime's background or asynchronous mechanism. Continue independent
   work while runs execute; when none remains, use its wait mechanism.

   ```bash
   gh run watch <run-id> --repo <owner/repo> --compact --exit-status
   ```

   Re-query all checks after a watched run finishes. If runs have not appeared after
   brief polling, inspect workflow triggers and permissions and report the specific
   reason or missing evidence.

4. For failure, resolve the Actions run ID from its check URL or commit-filtered
   run list and read `gh run view <run-id> --log-failed`. For external checks,
   use their linked logs. Capture the actual assertion, compiler error, or service error.
5. Classify using the logs, workflow, and dependency context:

   | Evidence                                                                  | Action                                                                  |
   | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
   | Reproducible assertion, compile, lint, configuration, or snapshot failure | Use `fix-github-actions-ci` for authorized repair                       |
   | Evidence of a transient runner or external-service failure                | Rerun failed jobs once when authorized                                  |
   | Failure demonstrated to predate the change or require work outside scope  | Report evidence and the required decision                               |
   | Cause uncertain                                                           | Continue diagnosis; filename overlap alone does not establish causality |

   OOM, timeouts, and disk exhaustion can be deterministic. A different failing file
   can still be affected through shared configuration or dependencies.

6. For an authorized transient retry, run `gh run rerun <run-id> --failed` and
   watch that run's new attempt. Record a passing retry as observed retry success,
   not proof that the underlying issue is fixed. Repeated failure returns to diagnosis.
7. After a repair is published, return to step 2 for the new head. If three repair
   attempts produce no improvement, reassess the cause and available evidence; stop
   with the concrete blocker when no supported in-scope action remains.

## Completion

Success requires all applicable checks for the final head to pass or be expected skips,
with the head unchanged on final readback. Report branch, PR URL, revision, check/run
links, and any retry. Distinguish success from pending checks, missing runs,
observation-only failures, or blocked repairs.
