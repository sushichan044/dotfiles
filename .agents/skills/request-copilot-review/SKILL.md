---
name: request-copilot-review
description: >
  Requests a Copilot code review on a pull request using gh-copilot-review and waits until it completes.
  Resolves the target PR (from argument or current branch), runs the request, and reports the outcome
  including how many unresolved Copilot inline review comments remain on the current head commit.
  Use when the user wants to ask Copilot to review a PR or re-request a review.
compatibility: Requires gh CLI and gh-copilot-review extension (gh extension install k1LoW/gh-copilot-review)
---

# Request Copilot Code Review

## Phase 1: Resolve the Target PR

1. If the user passed an argument (PR number or URL), use it as `<arg>`. Otherwise, default to the PR for the current branch.
2. Resolve the target PR:
   - With `<arg>`: `gh pr view <arg> --json number,title,url,headRefName`
   - Without `<arg>`: `gh pr view --json number,title,url,headRefName`
3. If no PR is found (e.g., current branch has no open PR), stop and ask the user which PR to target (number or URL). Do not proceed until the user provides one.
4. Once the PR is identified, proceed directly to Phase 2 without asking the user to confirm. Briefly mention the resolved PR (`#<number> <title>`) in your status update so the user can interrupt if it is wrong.

## Phase 2: Request the Review

Run `gh copilot-review` with `--wait` so the command polls until Copilot finishes. Choose flags based on user intent:

- **Default**: `gh copilot-review <arg> --wait`
- **User explicitly asks to force a re-request** (e.g., "force", "ignore the existing review"): add `--force`
- **User specifies timeout / interval**: pass through as `--wait-timeout` / `--wait-interval` (formats: `30sec`, `5min`, `1h`)

Notes:

- The command may take several minutes. Use a generous Bash timeout (e.g., 15 minutes when `--wait-timeout` is the default `10min`; longer if the user raised it).
- Without `<arg>`, omit it from the command. `gh copilot-review` auto-detects the PR for the current branch the same way.
- The command itself handles duplicate prevention. With `--wait`, in-progress reviews are polled to completion rather than skipped, so the only early-exit case to handle is when the current head commit already has a fresh Copilot review. In that case the command prints `Copilot review is already up to date for the current head commit` and (under `--wait`) follows it with the unresolved inline comment count line described below. Surface the "already up to date" message verbatim and ask the user whether to re-run with `--force`.

## Phase 3: Report the Outcome

Parse the command output and present a short summary:

```
## Copilot Review for PR #<number> (<title>)

- Status: <Completed | Skipped (already reviewed) | Timed out | Failed>
- Outdated reviews minimized: <n> (omit if 0)
- Unresolved inline review comments: <n | none | unknown>
- URL: <pr url>
```

How to fill in **Unresolved inline review comments** for a **Completed** or **Skipped (already reviewed)** review:

- If the output contains `Copilot has N unresolved inline review comment(s)`, report `N`.
- If the output contains `No unresolved inline review comments from Copilot`, report `none`.
- If neither line is present (e.g., `WaitForReviewCompletion` returned via the propagation fallback because Copilot left without leaving a fresh review), report `unknown` and note that no fresh Copilot review for the current head was detected.

For other statuses, omit the **Unresolved inline review comments** line.

Then, depending on status:

- **Completed**: Done. The summary above is the final report.
- **Skipped (already reviewed)**: Explain why (per the command output). If the unresolved count line shows remaining comments, point the user at those first. Offer to re-run with `--force` if the user wants to discard the existing review and request a fresh one.
- **Timed out**: Tell the user Copilot did not finish within the timeout. Offer to re-run with a larger `--wait-timeout`, or to check the PR manually.
- **Failed**: Surface the error verbatim. Do not retry automatically.

## Rules

- Do not pass `--force` unless the user explicitly asks to override the pre-conditions.
- Do not push, merge, or modify code as part of this skill. It only requests a review and reports the outcome.
- Prefer `gh` commands for GitHub data; do not call the REST/GraphQL API directly when an equivalent `gh` command exists.
- If `gh-copilot-review` is not installed, instruct the user to run `gh extension install k1LoW/gh-copilot-review` and stop.
