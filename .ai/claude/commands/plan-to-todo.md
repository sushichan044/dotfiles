---
allowed-tools: Bash(mkdir:*), Bash(cp:*), Edit(*), Read(*), Read(~/ai/templates/plan-template.md)
description: Create simple implementation plan from task description using single plan file.
---

# Create Implementation Plan: $ARGUMENTS

## Simple Plan Creation Workflow

**Step 1: Task Name**
Use $ARGUMENTS if provided, or choose a descriptive task name (under 25 characters).

**Step 2: Create Directory**

```bash
mkdir -p .claude/sushichan044/plan/<TASK_NAME>
```

**Step 3: Copy Template**

```bash
cp ~/ai/templates/plan-template.md .claude/sushichan044/plan/<TASK_NAME>/plan.md
```

**Step 4: Populate Plan**
Edit the plan.md file with:

- Clear objective from the task description
- Specific implementation steps
- Technical requirements
- Completion criteria

**Step 5: Keep It Simple**

- One plan file per task
- Focus on actionable steps
- Include necessary technical details
- Write in English

**Goal**: Create a practical, executable plan without over-engineering.
