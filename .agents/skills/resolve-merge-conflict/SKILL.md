---
name: resolve-merge-conflict
description: 現在の branch を分岐元の最新に rebase するときに使う。まず rebase を実行し、止まった conflict を順番に解消して前に進める。長い事前調査を避けて、必要な file だけ見て片付けたいときに使う。
allowed-tools: Bash(git status:*) Bash(git branch:*) Bash(git fetch:*) Bash(git rebase:*) Bash(git add:*) Bash(git diff:*) Bash(git show:*) Bash(git merge-base:*) Bash(git checkout:*) Bash(git restore:*) Bash(git push * --force-with-lease *) Bash(gh pr view:*) Bash(gh pr diff:*)
---

# resolve-merge-conflict

## 最初にやること

- branch の目的を 1-2 文で確認する
- rebase 先の branch を決める
- さっさと `git fetch` と `git rebase` を実行する

## 手順

1. 状態確認

    ```bash
    git status --short --branch
    ```

2. base を更新して rebase 開始

    ```bash
    git fetch origin <base>
    git rebase origin/<base>
    ```

3. 止まったら conflict file を確認

    ```bash
    git diff --name-only --diff-filter=U
    ```

4. 簡単な file から解消

- formatter
- import order
- rename / move
- 機械的に両方載せられる変更

1. 迷う file だけ 3-way を見る

    ```bash
    git show :1:path/to/file
    git show :2:path/to/file
    git show :3:path/to/file
    ```

- `:1:` base
- `:2:` applying commit
- `:3:` rebased branch

1. 解消したら追加して続行

    ```bash
    git add <files>
    git rebase --continue
    ```

2. 次の conflict が出たら繰り返す

## generated file / lockfile

- source file を先に直す
- generated file は後回し
- lockfile は片方を採って前進し、rebase 後に再生成する

例:

```bash
git checkout --ours ui/pnpm-lock.yaml
git add ui/pnpm-lock.yaml
```

## PR を見る条件

最初から見ない。必要なときだけ見る。

- base が曖昧
- branch の目的が commit だけでは読めない
- ユーザー確認前に背景が必要

```bash
gh pr view --json number,title,body,url,baseRefName,headRefName
gh pr diff --name-only
```

## ユーザー確認が必要なケース

- どちらの仕様を採るか決めきれない
- API / UI の最終挙動が二者択一
- config / migration / security 影響がある

確認は短く聞く。

```plaintext
`path/to/file` で conflict しています。
branch 側は <change>、base 側は <change> です。
推奨は <resolution> です。これで進めてよいですか？
```

## 完了後

```bash
git push --force-with-lease origin HEAD
```

報告すること:

- どこに rebase したか
- conflict をどう解いたか
- ユーザー確認が必要だった件数
