---
name: gh-sub-issue
description: GitHub CLI の extension を使って `gh sub-issue` コマンド経由で Sub Issue を操作する Skill. You can connect existing issues as sub-issues to a parent issue,create new issues directly linked to a parent, unlink sub-issues from their parent without deleting the issues, and view all sub-issues connected to a parent issue.
---

# gh-sub-issue

## Usage

### Add existing issue as sub-issue

Link an existing issue to a parent issue:

```bash
# Using issue numbers (add existing issue 456 as sub-issue of parent 123)
gh sub-issue add 123 456

# Using URLs (parent issue URL, existing issue number)
gh sub-issue add https://github.com/owner/repo/issues/123 456

# Cross-repository (add existing issue 456 as sub-issue of parent 123)
gh sub-issue add 123 456 --repo owner/repo
```

### Create a new sub-issue

Create a new issue directly linked to a parent:

```bash
# Basic usage
gh sub-issue create --parent 123 --title "Implement user authentication"

# With description and labels
gh sub-issue create --parent 123 \
  --title "Add login endpoint" \
  --body "Implement POST /api/login endpoint" \
  --label "backend,api" \
  --assignee "@me"

# With project assignment
gh sub-issue create --parent 123 \
  --title "QA Testing Task" \
  --project "QA Sprint" \
  --assignee "qa-team"

# Multiple projects (GitHub CLI compatible)
gh sub-issue create --parent 123 \
  --title "Cross-functional task" \
  --project "Dev Sprint" --project "QA Board"

# Using parent issue URL
gh sub-issue create \
  --parent https://github.com/owner/repo/issues/123 \
  --title "Write API tests"
```

### List sub-issues

View all sub-issues linked to a parent issue:

```bash
# Basic listing
gh sub-issue list 123

# Show all states (open, closed)
gh sub-issue list 123 --state all

# JSON output with selected fields (required)
gh sub-issue list 123 --json number,title,state

# JSON output with parent and meta information
gh sub-issue list 123 --json parent.number,parent.title,total,openCount

# Using URL
gh sub-issue list https://github.com/owner/repo/issues/123
```

### Remove sub-issues

Unlink sub-issues from a parent issue:

```bash
# Remove a single sub-issue
gh sub-issue remove 123 456

# Remove multiple sub-issues
gh sub-issue remove 123 456 457 458

# Skip confirmation prompt
gh sub-issue remove 123 456 --force

# Using URLs
gh sub-issue remove https://github.com/owner/repo/issues/123 456

# Cross-repository
gh sub-issue remove 123 456 --repo owner/repo
```

## 📋 Command Reference

### `gh sub-issue add`

Add an existing issue as a sub-issue to a parent issue.

```plain
Usage:
  gh sub-issue add <parent-issue> <sub-issue> [flags]

Arguments:
  parent-issue    Parent issue number or URL
  sub-issue       Sub-issue number or URL to be added

Flags:
  -R, --repo      Repository in OWNER/REPO format
  -h, --help      Show help for command
```

### `gh sub-issue create`

Create a new sub-issue linked to a parent issue.

```plain
Usage:
  gh sub-issue create [flags]

Flags:
  -p, --parent       Parent issue number or URL (required)
  -t, --title        Title for the new sub-issue (required)
  -b, --body         Body text for the sub-issue
  -l, --label        Comma-separated labels to add
  -a, --assignee     Comma-separated usernames to assign
  -m, --milestone    Milestone name or number
      --project      Projects to add (can specify multiple times)
  -R, --repo         Repository in OWNER/REPO format
  -h, --help         Show help for command
```

### `gh sub-issue list`

List all sub-issues for a parent issue.

```plain
Usage:
  gh sub-issue list <parent-issue> [flags]

Arguments:
  parent-issue    Parent issue number or URL

Flags:
  -s, --state     Filter by state: {open|closed|all} (default: open)
  -L, --limit     Maximum number of sub-issues to display (default: 30)
  --json fields   Output JSON with the specified fields
  -w, --web       Open in web browser
  -R, --repo      Repository in OWNER/REPO format
  -h, --help      Show help for command
```

**Field Selection Examples:**

```bash
# All fields (default)
gh sub-issue list 123 --json

# Select specific sub-issue fields
gh sub-issue list 123 --json number,title,state

# Include parent and meta information
gh sub-issue list 123 --json parent.number,parent.title,total,openCount

# Mixed field selection
gh sub-issue list 123 --json number,state,assignees,parent.title
```

### `gh sub-issue remove`

Remove sub-issues from a parent issue.

```plain
Usage:
  gh sub-issue remove <parent-issue> <sub-issue> [sub-issue...] [flags]

Arguments:
  parent-issue    Parent issue number or URL
  sub-issue       Sub-issue number(s) or URL(s) to remove

Flags:
  -f, --force     Skip confirmation prompt
  -R, --repo      Repository in OWNER/REPO format
  -h, --help      Show help for command
```

## 🎯 Examples

### Real-world workflow

```bash
# 1. Create a parent issue for a feature
gh issue create --title "Feature: User Authentication System" --body "Implement complete auth system"
# Created issue #100

# 2. Create sub-issues for implementation tasks
gh sub-issue create --parent 100 --title "Design database schema" --label "database"
gh sub-issue create --parent 100 --title "Implement JWT tokens" --label "backend"
gh sub-issue create --parent 100 --title "Create login UI" --label "frontend"

# 3. Link an existing issue as a sub-issue
gh sub-issue add 100 95  # Add existing issue #95 as sub-issue

# 4. View progress
gh sub-issue list 100 --state all

# 5. Remove a sub-issue if needed
gh sub-issue remove 100 95  # Unlink issue #95 from parent
```

### Output example

```plain
$ gh sub-issue list 100

Parent: #100 - Feature: User Authentication System

SUB-ISSUES (4 total, 2 open)
─────────────────────────────
✅ #101  Design database schema           [closed]
✅ #95   Security audit checklist         [closed]
🔵 #102  Implement JWT tokens             [open]   @alice
🔵 #103  Create login UI                  [open]   @bob
```
