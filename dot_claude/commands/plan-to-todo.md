---
allowed-tools: Edit(*), Read(*), Read(~/ai/templates/plan-template.md), Bash(memo new:*), Bash(cp:*), Bash(read:*)
description: Create simple implementation plan from task description using single plan file.
---

# Create Implementation Plan: $ARGUMENTS

## Simple Plan Creation Workflow

**Step 1: Task Name**
Use $ARGUMENTS if provided, or choose a descriptive task name (under 25 characters).

**Step 2: Scaffold Memo**

```bash
memo new "plan-{your-task-name}" | { read -r target; cp ~/ai/templates/plan-template.md  "$target"; }
```

**Step 3: Populate Plan**
Edit the plan.md file with:

- Clear objective from the task description
- Specific implementation steps
- Technical requirements
- Completion criteria

**Step 4: Keep It Simple**

- One plan file per task
- Focus on actionable steps
- Include necessary technical details
- Write in English

**Goal**: Create a practical, executable plan without over-engineering.
