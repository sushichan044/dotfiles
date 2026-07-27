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

## squash merge された親ブランチへの rebase

通常の `git rebase` では対処できないケースがある。

**症状**: 親ブランチが squash merge されており、rebase すると親ブランチのコミットが原因のコンフリクトが大量発生する。

**原因**: squash merge は親ブランチの全コミットを 1 つの新しいコミットに畳む。子ブランチの履歴には元の親コミットが残っているため、git は「まだ取り込まれていない」と判断して再適用しようとする。

**対処**:

```bash
# 1. 親 PR の headRefOid（squash 前の先頭コミット）を取得
old_parent_tip=$(gh pr view <親PRの番号> --json headRefOid --jq .headRefOid)

# 2. ローカルに存在するか確認（なければ fetch）
git cat-file -e "$old_parent_tip" 2>/dev/null || \
  git fetch origin $(gh pr view <親PRの番号> --json headRefName --jq .headRefName)

# 3. --onto で「親のコミット以降だけ」を新しい base に乗せ直す
git rebase --onto origin/<新しいbase> "$old_parent_tip"
```

`--onto origin/main <old_parent_tip>` の意味:

- `old_parent_tip..HEAD` の範囲のコミット（= 自分のコミットだけ）を
- `origin/main` の上に乗せる

これで親ブランチのコミットは再適用されない。

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

push 後、このブランチに open PR があれば `adjust-pr-base` skill を実行する。
rebase 先が変わった場合、PR の base branch も古いまま残ることがあるため。

報告すること:

- どこに rebase したか
- conflict をどう解いたか
- ユーザー確認が必要だった件数
