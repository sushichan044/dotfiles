# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Type

This is a dotfiles repository managed by chezmoi, containing personal configuration files and setup scripts for development environments across macOS, Linux, and WSL.

## Key Commands

### Chezmoi Operations

```bash
# Apply changes to system
chezmoi apply

# Preview changes before applying
chezmoi diff

# Edit templates (don't edit files in home directory directly)
chezmoi edit ~/.config/git/config

# Update from repository
chezmoi update

# Add new files to management
chezmoi add ~/.newconfig
```

### Template System

- Files with `.tmpl` extension are Go templates processed by chezmoi
- Use `{{ .variable }}` syntax for template variables
- Conditional blocks use `{{ if .condition }}...{{ end }}`
- The `.for_personal` variable distinguishes personal vs work setups

## Architecture Overview

### Core Structure

- `dot_*` files become `.filename` in home directory
- `private_*` files get restrictive permissions (600/700)
- Template files (`.tmpl`) are processed with user data
- Scripts (`run_*`) execute during chezmoi apply

### Configuration Management

- **Shell**: zsh with powerlevel10k, sheldon plugin manager
- **Git**: Modular config in `dot_config/git/config.d/`
- **Development Tools**: mise for runtime management, lazygit for git UI
- **Claude Integration**: Custom system prompts in `.ai/system.md`

### Key Integrations

- **1Password**: SSH agent and secret management
- **GitHub**: CLI and authentication setup
- **MCP Tools**: Various productivity commands
- **Homebrew**: Package management with Brewfile template

### Template Variables

- `.for_personal`: Boolean for personal vs work machine setup
- `.chezmoi.os`: Operating system detection
- OnePassword integration for secure data retrieval

## Development Workflow

When modifying dotfiles:

1. Edit source files in chezmoi directory (not target files)
2. Use `chezmoi diff` to preview changes
3. Apply with `chezmoi apply`
4. Test configuration changes before committing

## Security Notes

- Private files use `private_` prefix for restricted permissions
- OnePassword integration handles sensitive data
- SSH keys and tokens managed through secure templates
