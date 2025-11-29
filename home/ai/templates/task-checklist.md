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

---

## Implementation Details Repository

### Requirements Mapping

[Map each task to specific requirements for traceability]

- **Task 1.1**: _Requirements: REQ-1.1, REQ-2.3_
- **Task 1.2**: _Requirements: REQ-1.2, REQ-3.1_
- **Task 2.1**: _Requirements: REQ-2.1, REQ-2.2_

### Task Dependencies Map

[Hierarchical task structure with dependencies]

```
1. Major Phase: Setup and Foundation
   - 1.1 Project structure setup → Used by: 1.2, 2.1
   - 1.2 Core interfaces definition → Used by: 2.1, 3.1

2. Major Phase: Implementation
   - 2.1 Data models (depends on: 1.1, 1.2) → Used by: 2.2, 3.1
   - 2.2 Business logic (depends on: 2.1) → Used by: 3.1
```

### Test Strategy

[Test-first approach for each implementation phase]

- **Unit Testing**: Write tests before implementation for each component
- **Integration Testing**: Test component interactions after wiring
- **E2E Testing**: Complete user workflow validation

### Code Snippets

```
[Complete, copy-paste ready code examples with exact syntax]
```

### Configuration Files

```
[Full file contents, not just snippets - complete configuration files]
```

### Command Reference

```bash
# Complete commands with all arguments and flags
[command] [--flag] [arguments]
```

### Dependencies & Requirements

- **Library Name**: `exact-version` - Installation: `install-command`
- **Environment**: Requirements and setup steps
- **System Dependencies**: Complete list with installation methods

### File Structure Map

```
project/
├── exact/
│   ├── directory/
│   │   └── structure.file
│   └── with/
│       └── purposes.md
└── complete-tree/
```

### Error Handling Guide

**Common Error**: `Exact error message`

- **Cause**: Specific reason
- **Solution**: `exact-command-to-fix`

---

## Self-Sufficiency Validation

### Implementation Readiness

- [ ] All commands include complete syntax and arguments
- [ ] All configuration examples show full file contents
- [ ] All dependencies list exact versions and installation methods
- [ ] All file paths are complete and absolute where needed
- [ ] All error scenarios include specific solutions
- [ ] No external documentation references required for implementation
- [ ] All content written in English
- [ ] All technical details are copy-paste ready

### Code-Generation Prompt Quality

- [ ] Each task functions as a clear prompt for a coding agent
- [ ] Hierarchical numbering (Major phases + sub-tasks) is used consistently
- [ ] Tasks are appropriately sized (1-3 hours each)
- [ ] Progressive building with explicit previous task references
- [ ] Test-first approach integrated where appropriate
- [ ] Requirements mapping (_Requirements: X.X_) is complete
- [ ] Final integration tasks prevent orphaned code
- [ ] Non-coding activities (deployment, user testing, docs) are excluded

### Task Dependencies & Traceability

- [ ] Task dependency map is clear and accurate
- [ ] Requirements mapping covers all planned functionality
- [ ] Test strategy aligns with implementation phases
- [ ] Integration points between tasks are well-defined
