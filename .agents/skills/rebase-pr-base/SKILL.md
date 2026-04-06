---
name: rebase-pr-base
description: Re-check whether a pull request's base branch should change after a rebase. Use this whenever the user mentions rebasing a branch that may already have an open PR, stacked PRs, parent-branch PR chains, changing a PR base branch, or wants to verify whether `gh pr edit --base ...` is needed after `git rebase`.
allowed-tools: Bash(git branch:*) Bash(git status:*) Bash(git reflog:*) Bash(git merge-base:*) Bash(git show-branch:*) Bash(gh pr view:*) Bash(gh pr list:*) Bash(gh repo view:*)
---

# rebase-pr-base

## 目的

- rebase 後に PR の向き先がずれたまま残るのを防ぐ
- 親子関係のある複数 PR で、レビュー順と差分の見やすさを保つ
- 親 branch に既存 PR があるなら、子 PR を正しい親へ付け直す
- 判定できるならその場で直し、曖昧なときだけ確認する

## 手順

1. 状態確認

```bash
git branch --show-current
git status --short --branch
gh pr view --json number,title,url,baseRefName,headRefName,state 2>/dev/null
```

- `gh pr view` で current branch の PR が取れなければ `gh pr list --head <branch>` で補う
- open PR がなければ終わる

1. default branch を確認

```bash
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
```

1. 親候補を拾う

```bash
git reflog -n 20
gh pr list --state open --limit 30 --json number,title,url,baseRefName,headRefName
```

- reflog に rebase 先が見えれば最優先候補にする
- open PR の `headRefName` から親になりそうな branch を拾う
- 候補が出たら `git merge-base HEAD origin/<candidate>` で関係を見る

1. 変えるか決める

- 次の順で見る

1. rebase 先として明示的に分かる branch に open PR がある
2. current PR が default branch を向いており、より近い親 branch の open PR がある
3. current PR はすでに non-default base を向いており、その base が親 branch 候補として自然

- 次を満たしたら base を変える

- current branch に open PR がある
- 親候補 branch にも open PR がある
- current PR の現 base と親候補 branch が異なる
- stacked PR として読むほうが自然な根拠を 1 つ以上示せる

1. 変えるならその場で実行

```bash
gh pr edit <number> --base <branch>
```

1. 変えないなら理由を返す

- current base のままでよい理由を 1-2 行で返す
- `main` のままにした理由か、すでに stacked になっている理由を明記する

## ユーザー確認が必要なケース

- 親候補が 2 つ以上あり、merge-base でも差がつかない
- reflog に rebase 先が残っていない
- どの open PR を親と見るべきか決めきれない

確認は短く聞く。interactive に質問できる tool がある環境では、それを優先して使う。

- 選択肢には default branch も含める
- 各選択肢に branch 名と PR URL の両方を入れる
- それぞれ 1 行で理由も添える

```plaintext
PR base の候補が 2 つあります。
`feature/a` <url> は <reason>、
`feature/b` <url> は <reason>、
`main` <default-or-current-pr-url> は <reason> です。
推奨は <branch> です。これで進めてよいですか？
```

## 完了後

報告すること:

- current branch
- current PR
- base を変えたかどうか
- 根拠
