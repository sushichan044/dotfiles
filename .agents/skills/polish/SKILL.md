---
name: polish
description: Use this guide after completing work to polish code through project-specific quality checks, pass verifications, unnecessary comment removal, and redundant code reduction for consistent final deliverable quality.
allowed-tools: Skill(codex-review)
---

# Polish Skill

After completing your work, polish it by conducting quality checks for each project, ensuring they pass, and removing unnecessary comments to guarantee a certain level of quality for the final deliverable.

## Automatic Code Review

If there have been any logic changes since the last `codex-review`, please request another review from `codex-review`.

## Unnecessary Comment Removal

Comments explaining how code works are unnecessary, unless they are for users or required as standardized documentation, such as godoc or jsdoc.

Only leave comments when there is an intent that cannot be discerned from the code alone, and the drawbacks of refactoring the code itself to clarify that intent are significant.

## Quality Checks

1. Collect checks to run based on the project and the work done.
   - Collect from AI instructions like `AGENTS.md` or `CLAUDE.md`.
   - Collect from project-scope task runner configurations like `package.json` scripts, `Makefile`, `mise.toml`, or CI workflow YAML files.
2. Run the collected checks and ensure they pass.
   - In projects utilizing a task runner, execute validation commands via the task runner rather than directly.
   - If any check fails, investigate the failure, fix it, and rerun the checks until they all pass.
   - YOU MUST RUN TOOLS IN NON INTERACTIVE MODE.
   - Hint: In general, formatters should be run after linters since linters may make changes that require reformatting.
