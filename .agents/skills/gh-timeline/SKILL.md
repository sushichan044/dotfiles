---
name: gh-timeline
description: Use this to view the timeline of GitHub issues or pull requests. Note that it does not fetch the title and description, unlike `gh pr view`.
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
