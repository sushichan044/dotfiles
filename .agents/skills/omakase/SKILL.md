---
name: omakase
description: "cwd において、全ての意思決定を Claude と SubAgent に任せる Omakase Mode の ON / OFF を管理する Skill です."
disable-model-invocation: true
argument-hint: [on | off | status]
---

# Omakse Mode Management

## Get current status

```bash
${CLAUDE_SKILL_DIR}/scripts/omakase.sh status
```

## Enable Omakase Mode

```bash
${CLAUDE_SKILL_DIR}/scripts/omakase.sh on
```

## Disable Omakase Mode

```bash
${CLAUDE_SKILL_DIR}/scripts/omakase.sh off
```
