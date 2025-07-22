---
allowed-tools: Bash(mkdir:*), Bash(cp:*), Edit(*)
description: Create a comprehensive implementation guide from a plan, preserving all technical details and code snippets.
---

# Convert Plan to Implementation Guide, document title: $ARGUMENTS

## Enhanced Conversion Process

Step 1: Decide filename. Use $ARGUMENTS if provided, or choose a descriptive filename fewer than 25 characters.
      Tip: Don't include file extension in the filename.

Step 2: **MANDATORY**: Create directory and copy template.
      `mkdir -p .claude/sushichan044/plan` then `cp ~/ai/templates/task-checklist.md .claude/sushichan044/plan/<FILENAME_YOU_DECIDED>.md`

Step 3: Verify template copied correctly with `Read(.claude/sushichan044/plan/<FILENAME_YOU_DECIDED>.md)`

Step 4: **CRITICAL**: Extract and preserve ALL technical information from your plan:
    - Code snippets and examples
    - Function signatures and interfaces
    - Configuration details and parameters
    - File paths and directory structures
    - Command sequences and scripts
    - Library/dependency requirements
    - Error handling approaches
    - Testing strategies

Step 5: Structure the implementation guide with:
    - **Task Checklist**: `[ ]` format, each phase begins with "Step."
    - **Technical Reference**: Dedicated sections for:
      *Code Snippets Repository
      * Configuration Templates
      *Command Reference
      * File Structure Map
      *Implementation Notes
      * Testing Instructions

Step 6: Populate the template with:
    1. Convert plan phases to actionable checklist items
    2. Embed technical details within each task section
    3. Create reference sections with all code snippets and configurations
    4. Include decision rationale and alternative approaches
    5. Add validation steps and expected outcomes

    **PRESERVE EVERYTHING**: Every code block, command, configuration, and technical detail from the plan MUST be included in the implementation guide.
