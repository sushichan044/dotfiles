# Maintain git hooks

Thanks to: <https://qiita.com/ik-fib/items/55edad2e5f5f06b3ddd1>

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
