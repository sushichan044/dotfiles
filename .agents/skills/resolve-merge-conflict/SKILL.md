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

## replay 範囲がおかしいときは `--onto` を使う

通常の `git rebase` では対処できないケースがある。共通する症状は「**自分のブランチと無関係なファイルで大量に conflict する**」。

原因はどちらも同じで、rebase の起点（分岐点）が実態とズレており、既に base 側に入っているコミットまで再適用しようとしている。

**ケース 1: 親ブランチが squash merge された**

squash merge は親ブランチの全コミットを 1 つの新しいコミットに畳む。子ブランチの履歴には元の親コミットが残っているため、git は「まだ取り込まれていない」と判断して再適用する。

**ケース 2: stacked PR ツールの記録した base が古い**

`gh stack` などは各ブランチの base を記録しているが、下段 PR のマージ後に base が更新されず古いコミットを指し続けることがある。その状態で rebase すると、base から現在までに base branch へ入った他人のコミットまで replay 対象になる。

### 検知

rebase を始める前（または止まった直後）に、replay されるべき数と実際の数を突き合わせる。

```bash
git rev-list --count origin/<新しいbase>..HEAD   # 本来 replay すべき自分のコミット数
wc -l < .git/rebase-merge/git-rebase-todo        # 実際に replay しようとしている数
```

食い違っていたら `--onto` に切り替える。

### 対処

```bash
# 1. 「古い親の tip」を特定する
#    squash merge 済みの親なら PR の headRefOid が使える
old_parent_tip=$(gh pr view <親PRの番号> --json headRefOid --jq .headRefOid)
#    ツールの記録が古いだけなら、rebase 前の親 tip を reflog から取る
#    git reflog show <親ブランチ>

# 2. ローカルに存在するか確認（なければ fetch）
git cat-file -e "$old_parent_tip" 2>/dev/null || \
  git fetch origin $(gh pr view <親PRの番号> --json headRefName --jq .headRefName)

# 3. replay 対象が自分のコミットだけか確認する（ここを飛ばさない）
git log --oneline "$old_parent_tip"..HEAD

# 4. --onto で「親のコミット以降だけ」を新しい base に乗せ直す
git rebase --onto origin/<新しいbase> "$old_parent_tip"
```

`--onto origin/main <old_parent_tip>` の意味:

- `old_parent_tip..HEAD` の範囲のコミット（= 自分のコミットだけ）を
- `origin/main` の上に乗せる

step 3 の出力に他人のコミットが混ざっていたら、指定した `old_parent_tip` が実際の分岐点ではない。スタックの途中に同じ subject の rebase コピーが挟まっていることがあるので、`git log --oneline origin/<新しいbase>..HEAD` と突き合わせて取り直す。

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

ただし stacked PR の一部として `stacked-pr` skill から呼ばれた場合、push と base の面倒は呼び出し元が見る。ここでは rebase の完了だけを報告して戻る。

報告すること:

- どこに rebase したか
- conflict をどう解いたか
- ユーザー確認が必要だった件数
