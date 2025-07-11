# [Project/Task Name]

## Efficient Execution Instructions

### Parallel Task Management

- **Identify Parallel Tasks**: Group tasks that can run simultaneously within each step
- **Use Task Tool**: When 2+ independent tasks exist, invoke multiple `Task` tools in a single message
- **Sequential Steps**: Execute steps in order, but parallelize subtasks within each step

### Dual Progress Tracking

- **TodoWrite Integration**: Use TodoWrite tool to track high-level progress
- **Markdown Checklist**: Update `- [ ]` to `- [x]` when completing tasks in the saved file
- **Synchronize Both**: Keep TodoWrite status and Markdown checklist in sync

### Task Execution Protocol

1. **Mark TodoWrite as in_progress** when starting a step
2. **Use Task tool for parallel subtasks** when applicable
3. **Update Markdown checklist** as tasks complete
4. **Mark TodoWrite as completed** when step finishes
5. **Review and adapt** next steps based on results

### Adaptive Planning Reminders

- After each step completion, review if remaining steps are still appropriate
- Adjust next steps based on discoveries
- Add, remove, or modify subtasks as needed
- Skip steps that become unnecessary

## Step 1: [Phase Name] (Analysis/Setup)

- [ ] Subtask 1
- [ ] Subtask 2 (can run parallel with Subtask 1)
- [ ] Subtask 3

## Step 2: [Phase Name] (Implementation)

- [ ] Subtask A (depends on Step 1)
- [ ] Subtask B (can run parallel with A)
- [ ] Subtask C (depends on A and B)

## Step 3: [Phase Name] (Validation)

- [ ] Subtask X
- [ ] Subtask Y

...
