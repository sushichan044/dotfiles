# Maintain git hooks

Thanks to: <https://qiita.com/ik-fib/items/55edad2e5f5f06b3ddd1>

## Architecture

`~/.gitconfig` sets `core.hooksPath = ~/.config/git/hooks`, so all git hooks in every repository go through these scripts.

Each hook delegates to `_exec_local_hook`, which:

1. **Runs lefthook** if `lefthook` binary is available and `lefthook.yml` (or `.lefthook.yml`) exists in the repository root — no `lefthook install` required.
2. **Falls back to `.git/hooks/<hook>`** if it exists and is not a lefthook shim (for other tools like husky).

### lefthook integration

Place a `lefthook.yml` in your repository. lefthook will be invoked automatically on git hooks without running `lefthook install`.

To disable lefthook for a single command:

```bash
LEFTHOOK=0 git commit
```

To use a specific lefthook binary:

```bash
LEFTHOOK_BIN=/path/to/lefthook git commit
```

## List of available hooks

```bash
$ ls "$(brew --prefix git)/share/git-core/templates/hooks" | sed s/.sample//g

applypatch-msg
commit-msg
fsmonitor-watchman
post-update
pre-applypatch
pre-commit
pre-merge-commit
pre-push
pre-rebase
pre-receive
prepare-commit-msg
push-to-checkout
sendemail-validate
update
```

## Add script for new hook

```bash
./update.sh
```
