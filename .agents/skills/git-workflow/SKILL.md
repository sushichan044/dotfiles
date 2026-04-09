---
name: git-workflow
description: >-
  あらゆる git/GitHub 操作のエントリーポイント。commit する、PR を作る・更新する、rebase する、スタックを整理する、PR をレビューする、CI を直す — git や GitHub に関係する作業が発生したら、個別スキルを探す前に必ずこのスキルを参照すること。このスキルに従えば、どのスキルを使うか意識しなくても操作が完結する。「コミットして」「PR 出して」「最新に追いついて」「スタック整理して」「CI 直して」など、ユーザーの発言に git/GitHub のにおいがあればこのスキルを使う。
allowed-tools: Bash(git status:*), Bash(git push:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh pr create:*), Bash(gh run list:*), Bash(gh run watch:*), Bash(gh repo view:*)
---

# git-workflow

git/GitHub 操作のオーケストレーター。ユーザーの intent から操作タイプを判断し、必要なサブスキルを正しい順序で呼び出して完走させる。

## 操作マップ（クイックリファレンス）

| ユーザーの intent                              | 操作タイプ                            |
| ---------------------------------------------- | ------------------------------------- |
| commit して、変更を保存、コミット              | → [Commit](#commit)                   |
| PR 作って、PR 出して、PR を開く                | → [Create PR](#create-pr)             |
| push して、PR に反映して                       | → [Push to PR](#push-to-pr)           |
| rebase して、最新に追いついて、ベースを更新    | → [Rebase](#rebase)                   |
| スタック整理して、cascade rebase、全 PR を同期 | → [Stacked PR Sync](#stacked-pr-sync) |
| PR レビューして、コメントして、差分を見て      | → [Review PR](#review-pr)             |
| CI 直して、テスト落ちてる、ビルドが失敗        | → [Fix CI](#fix-ci)                   |

操作タイプが複数に見えるときは、依存関係の順（例: commit → push → PR 作成）に処理する。

---

## Commit

**Entry**: staged/unstaged の変更があり、「コミット」「commit して」などの指示がある。

**Steps**:

1. `git status` で変更範囲を把握する。
2. staged 変更がなければ、何をステージするかユーザーに確認してから `git add` する。
3. `git commit` でコミットを作る。
4. **`contextual-commit` スキルを呼び出して**コミットメッセージを書き直す。

**完了条件**:

- コミットが存在する
- `contextual-commit` スキルに従ったメッセージが付いている

---

## Create PR

**Entry**: 現在のブランチに open PR がなく、「PR を作って」「PR 出して」などの指示がある。

**Steps**:

1. コミットされていない変更があれば [Commit](#commit) を先に完走させる。
2. `git push -u origin HEAD` でブランチを push する。
3. **`prepare-issue-pr` スキルを呼び出して** PR タイトルと本文を生成する。
4. `gh pr create --draft --base <base> --title "<title>" --body "<body>"` で draft PR を作る。
5. **`adjust-pr-base` スキルを呼び出して** base branch が正しいか確認・修正する。
6. **`watch-ci` スキルを呼び出して** CI を監視・修正する。

**完了条件**:

- PR が存在する（`gh pr view` で確認できる）
- base branch が `adjust-pr-base` によって検証済み
- `watch-ci` スキルが CI パスを確認済み

---

## Push to PR

**Entry**: 現在のブランチに open PR が既にあり、「push して」「PR に反映して」などの指示がある。

**Steps**:

1. コミットされていない変更があれば [Commit](#commit) を先に完走させる。
2. `git push` する。
3. PR のタイトル・説明がブランチの最新状態を反映しているか確認する:

   ```bash
   gh pr view --json title,body,baseRefName
   ```

4. 説明が古い場合は **`prepare-issue-pr` スキルを呼び出して**更新する。
5. **`watch-ci` スキルを呼び出して** CI を監視・修正する。

**完了条件**:

- push 完了
- PR のタイトル・説明が最新の変更を正しく反映している
- `watch-ci` スキルが CI パスを確認済み

---

## Rebase

**Entry**: 「rebase して」「最新に追いついて」「ベース更新して」などの指示がある。

**Steps**:

1. **`resolve-merge-conflict` スキルを呼び出す**。このスキルが fetch → rebase → conflict 解消 → `git push --force-with-lease` を完走させる。
2. rebase 完了後、**`adjust-pr-base` スキルを呼び出して** base branch が正しいか確認・修正する。

**完了条件**:

- rebase 完了、conflict なし
- `git push --force-with-lease` 済み
- `adjust-pr-base` が base branch を検証済み

---

## Stacked PR Sync

**Entry**: 「スタックを整理して」「cascade rebase して」「全 PR を同期して」など、複数の依存 PR のメンテナンスが必要な状況。

**Steps**:

1. **`stacked-pr` スキルに完全に委譲する**。

**完了条件**:

- `stacked-pr` スキルが完了報告を出している

---

## Review PR

**Entry**: 「PR をレビューして」「コメントして」「差分を見て」などの指示がある。

**Steps**:

1. 対象 PR を特定する（指示がなければ現在のブランチの PR）。
2. **`github-pr-review-operation` スキルを呼び出す**。

**完了条件**:

- `github-pr-review-operation` スキルが必要な操作（コメント投稿、差分確認など）を完走している

---

## Fix CI

**Entry**: 「CI が落ちてる」「CI を直して」「テストが失敗してる」「ビルドが通らない」などの状況。

**Steps**:

1. **`fix-github-actions-ci` スキルに完全に委譲する**。

**完了条件**:

- `fix-github-actions-ci` スキルが CI の解消を確認している

---

## 操作の組み合わせ

複数の操作が同時に必要な場合は、依存関係の順に実行する。

### 例: 「変更を PR に出して」

1. [Commit](#commit) → 2. [Create PR](#create-pr)

### 例: 「rebase して PR を更新して」

1. [Rebase](#rebase) → 2. [Push to PR](#push-to-pr)

### 例: 「スタックを整理して CI も直して」

1. [Stacked PR Sync](#stacked-pr-sync)（`stacked-pr` スキルが CI 修正も含む）

---

## Notes

- 操作タイプが不明な場合は、`git status` と `gh pr view` で現在の状態を確認してから判断する。
- ユーザーが「見るだけ」「確認だけ」と言っている場合は、write 系の操作（push, PR 作成など）を実行しない。
