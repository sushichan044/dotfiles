
# Utility to visualize Next.js build trace

Called via `~/.sushichan044/bin/next-trace-inspector`

## Files

- `main/trace-to-tree.mjs`: managed as chezmoi external.
<https://github.com/vercel/next.js/blob/88fe8793e7611d20102772001e4388e8e4ea72f6/scripts/trace-to-tree.mjs>

- `main/trace-to-event-format.mjs`: managed as chezmoi external.
<https://github.com/vercel/next.js/blob/88fe8793e7611d20102772001e4388e8e4ea72f6/scripts/trace-to-event-format.mjs>

- `packages/next/dist/lib/picocolors.js`: Somehow `trace-to-tree.mjs` depends on this file.
