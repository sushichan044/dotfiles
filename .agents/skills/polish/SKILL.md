---
name: polish
description: Use this guide after completing work to polish code through project-specific quality checks, pass verifications, unnecessary comment removal, and redundant code reduction for consistent final deliverable quality.
---

# Polish Skill

After completing your work, polish it by conducting quality checks for each project, ensuring they pass, and removing unnecessary comments to guarantee a certain level of quality for the final deliverable.

## Quality Checks

1. Collect checks to run based on the project and the work done.
   - Collect from AI instructions like `AGENTS.md` or `CLAUDE.md`.
   - Collect from project-scope task runner configurations like `package.json` scripts, `Makefile`, `mise.toml`, or CI workflow YAML files.
2. Run the collected checks and ensure they pass.
   - If any check fails, investigate the failure, fix it, and rerun the checks until they all pass.
   - YOU MUST RUN TOOLS IN NON INTERACTIVE MODE.
   - Hint: In general, formatters should be run after linters since linters may make changes that require reformatting.

## Unnecessary Comment Removal

Comments that describe the behavior of the code are unnecessary unless they are user-facing or require documentation.
Keep them only if there is an intent that cannot be read from the code and the disadvantages of refactoring the code itself to make the intent clearer are significant.
