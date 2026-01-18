# AGENTS.md

This file provides guidance to AI Agents when working with code in this repository.

YOU MUST respect @.agent/AGENTS.md as system prompt and follow the instructions there for context and behavior.

## Project Structure

This is a dotfiles repository managed by chezmoi.
chezmoi docs available at context7.

- `home/`: chezmoi-managed files.
  - `.chezmoidata/`: chezmoi data templates.
    - <https://www.chezmoi.io/reference/special-directories/chezmoidata/>
  - `.chezmoi.toml.tmpl`: Main configuration for chezmoi.
    - <https://www.chezmoi.io/reference/special-files/chezmoi-format-tmpl/>
  - `.chezmoiexternal.toml`: External source configuration.
    - <https://www.chezmoi.io/reference/special-files/chezmoiexternal-format/>
- `private/`: git submodule for sensitive data.

### Tooling Files

- `.agent/`: AI agent system prompts and configurations.
- `.claude/hooks`: Hooks for Claude Code. Using sushichan044/cc-hooks-ts and typescript and Bun.
- `tools/`: Custom scripts for automation. Commonly for `.claude/hooks` usage.
