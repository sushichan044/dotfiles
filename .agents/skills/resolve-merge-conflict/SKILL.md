---
name: resolve-merge-conflict
description: 現在の branch を分岐元の最新に追随させるために rebase conflict を解消するときに使う。branch の意図を壊さず進めたい、曖昧な判断だけユーザー確認したい、必要なら PR 文脈も補助的に使いたい場面で参照する。
allowed-tools: Bash(git status:*) Bash(git branch:*) Bash(git fetch:*) Bash(git rebase:*) Bash(git add:*) Bash(git diff:*) Bash(git show:*) Bash(git merge-base:*) Bash(git push * --force-with-lease *) Bash(gh pr view:*) Bash(gh pr diff:*)
---

# resolve-merge-conflict

rebase conflict 解消で大事なのは、手順をなぞることではなく「この branch が何を守る変更か」を見失わないことです。分岐元の更新を取り込みつつ、作業の目的を壊さず rebase を完了させます。

細かい儀式は最小限でよく、必要なのは次の 4 点です。

- branch の意図を先に把握する
- 現在 branch の分岐元を決め、その最新へ `rebase` する
- conflict は自力で解けるものだけ解き、曖昧な判断だけ確認する
- 最後は確認して `git push --force-with-lease` まで終える

## 使う場面

- base 追随
- rebase conflict 解消
- branch 更新のための force push
- 必要なら review や PR 文脈も見ながら安全に統合したいとき

## 最低限の流れ

1. 現在 branch と、その分岐元として扱う branch を確認する。
2. branch の差分を見て、`Problem` と `Expected behavior` を短く掴む。PR があれば title/body/review も補助的に読む。
3. `git fetch origin <base>` のあと `git rebase origin/<base>` を実行する。
4. conflict が出たら、base 側の変更と branch 側の変更を読み、両立できる形に統合する。
5. 曖昧な箇所だけユーザーに確認する。
6. rebase 完了後に最低限の確認をして `git push --force-with-lease` する。

## 分岐元の決め方

- まず upstream や普段の運用から、いまの branch がどの branch から切られたかを確認する
- 判断材料が足りなければ `git merge-base --fork-point` や commit 履歴を使って分岐元を推定する
- PR がある場合でも、PR base は補助情報として扱い、現在 branch の分岐元と矛盾しないかを見る
- 分岐元が曖昧で安全に決められないときだけユーザーに確認する

## 判断基準

- branch が直したい問題や期待挙動を消さない
- base 側で入った rename、API 変更、安全性向上はできるだけ取り込む
- `ours` / `theirs` を雑に選ばず、必要なら統合版を書く
- generated file は可能なら元ファイル側で整合を取る
- 自信がない仕様判断は推測で決めない

## 迷ったときの線引き

自力で進めてよいもの:

- formatter や import 順
- rename / move への追従
- 両方の変更を素直に載せれば済むもの
- generated file の再生成で片付くもの

確認したほうがよいもの:

- UI や API の最終挙動が二者択一
- review で未決着だった設計判断
- migration / config / security / compatibility に影響するもの

## よく使うコマンド

```bash
git status --short --branch
git merge-base --fork-point origin/<candidate-base> HEAD
git fetch origin <base>
git rebase origin/<base>
git diff --name-only --diff-filter=U
git show :1:path/to/file
git show :2:path/to/file
git show :3:path/to/file
git add <files>
git rebase --continue
git push --force-with-lease origin HEAD
```

PR があるときだけ追加で使う:

```bash
gh pr view --json number,title,body,url,baseRefName,headRefName
gh pr diff --name-only
gh api repos/OWNER/REPO/pulls/NUMBER/reviews
```

## 質問のしかた

質問は短く、1 回で 1 判断だけ聞く。ファイル名、衝突点、推奨案、影響を添える。

悪い例:

```text
コンフリクトしたのでどうしますか？
```

良い例:

```text
`app/config.ts` で conflict しています。PR 側は retry 設定追加、base 側は schema strict 化です。
推奨は strict schema に合わせて retry を移植する案です。PR の挙動を残しつつ base の validation も守れます。
この方向で進めてよいですか？
```

## 最後の報告

- どの base に rebase したか
- どの種類の conflict をどう解いたか
- ユーザー確認が必要だった件数
- 実行した確認コマンド
