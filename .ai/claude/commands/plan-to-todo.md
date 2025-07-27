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

Step 4: **CRITICAL**: Extract and preserve ALL technical information from your plan at **implementation-ready detail level**:
    - Complete command examples with all flags and arguments (copy-paste ready)
    - Full configuration file contents, not just snippets
    - Code snippets and examples with exact syntax
    - Function signatures and interfaces with complete parameter details
    - Exact file paths and complete directory structures
    - Complete command sequences with error handling
    - Library/dependency requirements with exact versions and installation methods
    - Error handling approaches with specific error messages and solutions
    - Testing strategies with actual test commands and expected outcomes

**CODE-GENERATION OPTIMIZATION**: Transform technical details into code-generation prompts:
    - Design each task as a prompt for a code-generation LLM
    - Use hierarchical numbering: Major phases (1, 2, 3) and sub-tasks (1.1, 1.2)
    - Specify exact files and components to create/modify
    - Include test-first approach: write tests before implementation
    - Make tasks completable in 1-3 hours each
    - Build incrementally: each task references outputs from previous tasks

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
    **LANGUAGE REQUIREMENT**: Write all content in English
    1. Convert plan phases to actionable checklist items using hierarchical numbering
    2. Design each task as a code-generation prompt with specific coding instructions
    3. Embed technical details within each task section
    4. Create reference sections with all code snippets and configurations
    5. Include decision rationale and alternative approaches
    6. Add validation steps and expected outcomes
    7. Map each task to specific requirements using _Requirements: X.X_ format
    8. Ensure all technical details are copy-paste ready and implementation-ready

    **CODE-GENERATION PROMPT RULES**:
    - Each task must be executable by a coding agent
    - Progressive building: explicitly state which previous task outputs are used
    - Test-first approach: write tests before implementation when appropriate
    - Forward references: explain how current task output will be used later
    - Requirements traceability: map to specific acceptance criteria
    - Integration focus: final tasks must wire all components together
    - Coding-only focus: exclude deployment, user testing, or non-coding activities

    **PRESERVE EVERYTHING**: Every code block, command, configuration, and technical detail from the plan MUST be included in the implementation guide.

Step 7: **IMPLEMENTATION READINESS VERIFICATION**:
    1. Verify the guide enables implementation without external references
    2. Ensure all commands include complete syntax and arguments
    3. Confirm all configuration examples show full file contents
    4. Check that all dependencies list exact versions and installation methods
    5. Validate that all technical details are copy-paste ready
    6. Confirm all content is written in English

Step 8: **CODE-GENERATION PROMPT OPTIMIZATION**:
    1. Verify each task functions as a clear prompt for a coding agent
    2. Confirm hierarchical numbering (Major phases + sub-tasks) is used
    3. Check that tasks are sized appropriately (1-3 hours each)
    4. Ensure progressive building with explicit previous task references
    5. Validate test-first approach is integrated where appropriate
    6. Confirm requirements mapping (_Requirements: X.X_) is complete
    7. Verify final integration tasks prevent orphaned code
    8. Ensure non-coding activities are excluded
