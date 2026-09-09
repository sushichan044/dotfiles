---
name: gh-timeline
description: Inspect chronological GitHub issue or PR events, including reviews, commits, force pushes, and merges.
allowed-tools:
  - Bash(gh timeline *)
---

# gh-timeline

When you need an Issue or PR's complete chronological event history (commits,
reviews, comments, force pushes, labels, merges, cross references, etc.) in one call, run:

```sh
gh timeline <issue-or-pr-number-or-URL>
```

Output is JSON by default under an AI agent runtime. For the JSON schema,
flag list, drill-down via `gh api`, and worked examples, run
`gh timeline --help`.

Resolve the target from the conversation or current repository through `git-workflow`.
Fetch title and body separately when needed; the timeline supplies event history.
Finish with the events relevant to the question, timestamps, and source references.
If output is incomplete or the command fails, report the coverage gap rather than
inferring that an event did not occur.
