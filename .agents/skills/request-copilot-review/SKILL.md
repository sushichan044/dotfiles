---
name: request-copilot-review
description: >
  Requests a Copilot code review on a pull request using gh-copilot-review and waits until it completes.
  Resolves the target PR (from argument or current branch), runs the request, hides the PR-level replies
  you wrote to the Copilot reviews that the run minimized as outdated, and reports the outcome
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

## Phase 3: Hide Your Own Superseded Replies

`gh copilot-review` minimizes Copilot's outdated review overviews, but the PR-level comments you wrote in reply to them stay expanded, leaving a one-sided exchange on the conversation tab. Hide those too.

Run this after every invocation in which `gh copilot-review` exited successfully, including the early-exit "already up to date" case and before asking the user anything about re-running, not only when the output reports `Minimized N Copilot review(s)`. The step is idempotent, and running it unconditionally also cleans up replies that earlier runs left behind.

1. List your own still-visible PR-level comments that reference an already-minimized Copilot review:

```bash
gh api graphql -f query='
query($owner: String!, $repo: String!, $number: Int!) {
  viewer { login }
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      reviews(last: 100) { nodes { url author { login } isMinimized } }
      comments(last: 100) { nodes { id url author { login } isMinimized body } }
    }
  }
}' -f owner=<owner> -f repo=<repo> -F number=<number> --jq '
  .data as $d
  | $d.viewer.login as $me
  | [ $d.repository.pullRequest.reviews.nodes[]
      | select(.isMinimized and (.author.login | ascii_downcase | startswith("copilot")))
      | .url ] as $hidden
  | $d.repository.pullRequest.comments.nodes[]
  | select(.author.login == $me and (.isMinimized | not))
  | select([ .body | contains($hidden[]) ] | any)
  | {id, url, body}'
```

The URL condition is the review URL (`...#pullrequestreview-<id>`) appearing in the comment body. That is what `triage-pr-reviews` writes as the `> Re: <url>` header of every PR-level reply, and it is the only link GitHub gives between a PR-level comment and the review it answers.

2. Read the body of each candidate and decide whether it is actually superseded. The URL is necessary but not sufficient: a comment can cite a review while saying something that outlives it.

   Hide it when everything it says is an answer to findings in that now-outdated review and nothing in it stands on its own, which is the common case: a report that the finding was fixed in some commit, an acknowledgement, a rebuttal scoped to that one finding.

   Keep it visible when it carries something a reader still needs after the review is folded away: a design decision or rationale stated for the human reviewers rather than for Copilot, an open question addressed to a person, a disagreement that is still unsettled, context about the pull request as a whole, or a point of its own that merely cites the review as background.

   When a comment is genuinely borderline, keep it. A reply left expanded is noise; a reply wrongly folded away is lost information.

3. Minimize each comment you judged superseded as OUTDATED, using its node ID:

```bash
gh api graphql -f query='
mutation($id: ID!) {
  minimizeComment(input: {subjectId: $id, classifier: OUTDATED}) {
    minimizedComment { isMinimized }
  }
}' -f id=<comment node id>
```

4. Keep the count of comments hidden for the Phase 4 report, and name any candidate you deliberately kept visible together with the reason. If one mutation fails, warn with the comment URL and continue with the rest; a single rejected subject must not abort the others.

## Phase 4: Report the Outcome

Parse the command output and present a short summary:

```
## Copilot Review for PR #<number> (<title>)

- Status: <Completed | Skipped (already reviewed) | Timed out | Failed>
- Outdated reviews minimized: <n> (omit if 0)
- Your superseded replies hidden: <n> (omit if 0)
- Replies kept visible: <n> (omit if 0; list each URL with a one-line reason)
- Review assessment: <assessment line | unknown>
- Unresolved inline review comments: <n | none | unknown>
- Suppressed review comments: <n> (omit if 0)
- URL: <pr url>
```

How to fill in **Unresolved inline review comments** for a **Completed** or **Skipped (already reviewed)** review:

- If the output contains `Copilot has N unresolved inline review comment(s)`, report `N`.
- If the output contains `No unresolved inline review comments from Copilot`, report `none`.
- If neither line is present (e.g., `WaitForReviewCompletion` returned via the propagation fallback because Copilot left without leaving a fresh review), report `unknown` and note that no fresh Copilot review for the current head was detected.

How to fill in **Review assessment** and **Suppressed review comments**:

- If the output contains `Copilot review assessment: <text>`, report `<text>` verbatim (e.g. `🟡 Not ready to approve`) together with the indented summary line that follows it. Otherwise report `unknown`.
- If the output contains `Copilot has N suppressed review comment(s) ...`, report `N`. The lines that follow it list `path:line` plus the finding text; these are review findings Copilot reported only in its review overview, so treat them exactly like inline comments.

For other statuses, omit the **Review assessment**, **Unresolved inline review comments**, and **Suppressed review comments** lines.

Then, depending on status:

- **Completed**: Done. The summary above is the final report.
- **Skipped (already reviewed)**: Explain why (per the command output). If the unresolved count line shows remaining comments, point the user at those first. Offer to re-run with `--force` if the user wants to discard the existing review and request a fresh one.
- **Timed out**: Tell the user Copilot did not finish within the timeout. Offer to re-run with a larger `--wait-timeout`, or to check the PR manually.
- **Failed**: Surface the error verbatim. Do not retry automatically.

## Rules

- Never conclude "nothing to address" from the inline comment count alone. A Copilot review can report findings without leaving any inline comment: the assessment says it is not ready to approve, and/or the findings are listed as suppressed comments. When the output contains `Copilot did not approve this pull request`, or the assessment is not an approving one, or suppressed comments are listed, report those findings as work remaining.
- Do not pass `--force` unless the user explicitly asks to override the pre-conditions.
- Never minimize inline review comments or the replies inside an inline review thread. Phase 3 applies only to PR-level comments (`IssueComment`); inline threads are tracked by resolution, not by visibility, so hiding them would lose the unresolved count this skill reports.
- Never minimize a comment authored by anyone other than the viewer, and never one that references a Copilot review that is still visible.
- Leave a reply that references no minimized review URL alone. Without that reference nothing ties it to an outdated review, and guessing from timing would hide unrelated comments. The reference alone is not a licence to hide either: the body still has to read as superseded by the Phase 3 criteria.
- Do not push, merge, or modify code as part of this skill. It only requests a review, tidies up the outdated conversation it supersedes, and reports the outcome.
- Prefer `gh` commands for GitHub data; do not call the REST/GraphQL API directly when an equivalent `gh` command exists.
- If `gh-copilot-review` is not installed, instruct the user to run `gh extension install k1LoW/gh-copilot-review` and stop.
