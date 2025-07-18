---
allowed-tools: Bash(mkdir:*), Bash(cp:*)
description: Create a checklist document from a plan using a specific template.
---

# Convert Plan to Checklist document, document title: $ARGUMENTS

## Core Conversion Process

Step 1: Decide checklist filename. Use $ARGUMENTS if provided, or choose a filename you recommend that is fewer than 25 characters.
      Tip: you should not include the file extension in the filename.

Step 2: **MANDATORY**: YOU MUST Use the exact template structure. Use !`mkdir -p .claude/sushichan044/plan` then `cp ~/ai/templates/task-checklist.md .claude/sushichan044/plan/<FILENAME_YOU_DECIDED>.md` to copy the template.

Step 3: Check the plan you created and convert it into a checklist in Markdown format.

Step 4: The task list should use checklist syntax `[ ]`. Begin each task phase with the word "Step."

Step 5: Modify the copied template file to reflect the specific tasks and subtasks for your project with following steps:
    1. Check the plan you created and convert it into a checklist in Markdown format.
    2. The task list should use checklist syntax `[ ]`. Begin each task phase with the word "Step."
    3. Reflect your checklist markdown into the copied template file.
    Tip: The template already includes sections for efficient task execution Instructions.
