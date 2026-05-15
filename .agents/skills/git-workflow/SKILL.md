---
name: git-workflow
description: >-
  あらゆる git/GitHub 操作のエントリーポイント。commit する、PR を作る・更新する、rebase する、スタックを整理する、PR をレビューする、CI を直す — git や GitHub に関係する作業が発生したら、個別スキルを探す前に必ずこのスキルを参照すること。このスキルに従えば、どのスキルを使うか意識しなくても操作が完結する。「コミットして」「PR 出して」「最新に追いついて」「スタック整理して」「CI 直して」など、ユーザーの発言に git/GitHub のにおいがあればこのスキルを使う。
allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh pr create:*), Bash(gh run list:*), Bash(gh run watch:*), Bash(gh repo view:*)
---

# git-workflow

git/GitHub 操作のオーケストレーター。ユーザーの intent から操作タイプを判断し、必要なサブスキルを正しい順序で呼び出して完走させる。

## State Probes And Global Rules

操作タイプを選ぶ前に、必要な状態を明示的に確認する。推測で分岐しない。

### Current worktree

```bash
git status --short
```

- 出力あり: local changes がある
- 出力なし: working tree は clean

### Current branch open PR

```bash
gh pr view --json number,title,body,baseRefName,headRefName,url,state 2>/dev/null
```

`gh pr view` が失敗したら、現在ブランチ名を取り直して open PR を再確認する:

```bash
branch=$(git branch --show-current)
gh pr list --head "$branch" --state open \
  --json number,title,body,baseRefName,headRefName,url,state
```

- PR が 1 件返る: current branch に open PR がある
- PR が返らない: current branch に open PR はない

### Default branch

PR を新規作成するときだけ取得する。

```bash
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
```

### Global rules

1. **Read-only override が最優先**: ユーザーが「見るだけ」「確認だけ」「コメントしない」のように write を抑止したら、各操作節より優先して write 系操作を止める。サブスキルに委譲するときも read-only 制約を明示して渡す。
2. **状態確認はこの節の probe を使う**: open PR の有無、local changes の有無、default branch を本文外の独自 heuristics で決めない。
3. **前段で済んだ write は繰り返さない**: たとえば `Rebase` は `git push --force-with-lease` まで含む。`Rebase -> Push to PR` では追加の `git push` をスキップし、PR metadata 確認と CI 監視だけを後段で行う。
4. **staged 変更がないまま commit が必要なら、`git add` の前にユーザー確認を取る**: 何を stage するかは暗黙に決めない。
5. **委譲先の責務を上書きしない**: base branch の確定は `prepare-issue-pr` の初期推定と `adjust-pr-base` の最終検証に従う。`git-workflow` 自身で別の base 選定ロジックを足さない。
6. **state probe は routing 前に 1 回実行する**: その後に state を変える write（commit, PR create, rebase, push）を行った場合だけ、次の分岐や確認の前に必要な probe を取り直す。

## 操作マップ（クイックリファレンス）

| ユーザーの intent                                      | 操作タイプ                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| commit して、変更を保存、コミット                      | → [Commit](#commit)                                                  |
| PR 作って、PR 出して、PR を開く                        | → [Create PR](#create-pr)                                            |
| push して、PR に反映して                               | → [Push to PR](#push-to-pr)                                          |
| rebase して、最新に追いついて、ベースを更新            | → [Rebase](#rebase)                                                  |
| スタック整理して、cascade rebase、全 PR を同期         | → [Stacked PR Sync](#stacked-pr-sync)                                |
| diff 整理して、コミット整えて、PR 分割して、大きすぎる | → [Reorganize Diff](#reorganize-diff) (Create PR からも自動呼び出し) |
| PR レビューして、コメントして、差分を見て              | → [Review PR](#review-pr)                                            |
| CI 直して、テスト落ちてる、ビルドが失敗                | → [Fix CI](#fix-ci)                                                  |

操作タイプが複数に見えるときは、依存関係の順（例: commit → push → PR 作成）に処理する。

---

## Commit

**Entry**: ユーザーが明示的に commit を求めたとき、または後続の操作の前提として commit が必要で、local changes があるとき。

**Steps**:

1. `git status --short` で変更範囲を把握する。
2. staged 変更がなければ、何をステージするかユーザーに確認してから `git add` する。
3. **`contextual-commit` スキルを呼び出して** commit message を作る。
4. `git commit` でコミットを作る。

**完了条件**:

- コミットが存在する
- `contextual-commit` スキルに従ったメッセージが付いている

---

## Create PR

**Entry**: current branch に open PR がなく、「PR を作って」「PR 出して」などの指示がある。

**Steps**:

1. コミットされていない変更があれば [Commit](#commit) を先に完走させる。
2. push 前に [Reorganize Diff](#reorganize-diff) を実行する。reorganize-diff の判定結果で本フローの残ステップが分岐する:
   - **「分割不要」**: そのまま step 3 へ進む。
   - **「コミット整理のみ」モード**: reorganize-diff が現ブランチのコミットを整理して `git push --force-with-lease` まで完走する。step 3 (push) はスキップして step 4 へ進む。
   - **「スタック PR」モード**: reorganize-diff が複数の PR を作成し、`stacked-pr` スキルへハンドオフして完走する。本フローはここで終了。step 3 以降はスキップ。
3. `git push -u origin HEAD` でブランチを push する。
4. **`prepare-issue-pr` スキルを呼び出して** PR title、body、初期 base branch を決める。base の初期推定はこのスキルに従う。
5. デフォルトでは `gh pr create --draft --base <base-from-prepare-issue-pr> --title "<title>" --body "<body>"` で draft PR を作る。ユーザーが ready for review / non-draft を明示したときだけ `--draft` を外す。
6. **`adjust-pr-base` スキルを呼び出して** base branch が正しいか確認・修正する。
7. **`watch-ci` スキルを呼び出して** CI を監視・修正する。

**完了条件**:

- PR が存在する（`gh pr view` または `stacked-pr` の完了報告で確認できる）
- single PR の場合: base branch が `adjust-pr-base` によって検証済み、`watch-ci` スキルが CI パスを確認済み
- スタック PR の場合: `stacked-pr` スキルが完了報告を出している

---

## Push to PR

**Entry**: current branch に open PR が既にあり、「push して」「PR に反映して」などの指示がある。

**Steps**:

1. コミットされていない変更があれば [Commit](#commit) を先に完走させる。
2. 直前に [Rebase](#rebase) を実行していない場合だけ `git push` する。`Rebase -> Push to PR` の流れではこの step をスキップする。
3. PR のタイトル・説明がブランチの最新状態を反映しているか確認する:

   ```bash
   gh pr view --json title,body,baseRefName
   ```

4. タイトルまたは説明が古い場合は **`prepare-issue-pr` スキルを呼び出して**更新する。
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

## Reorganize Diff

**Entry**:

- [Create PR](#create-pr) の step 2 から呼ばれたとき (push 前の自動チェック)
- 「diff 整理して」「コミットを整えて」「PR が大きすぎる」「PR を分割して」など、diff の粒度を整える指示があるとき

**Steps**:

1. **`reorganize-diff` スキルに完全に委譲する**。Phase 1 (分析) は副作用なし、Phase 2 (実行) はユーザー承認が必要。
2. Phase 1 が「分割不要」を返した場合、Phase 2 は実行されない。呼び出し元のフロー (例: [Create PR](#create-pr) の step 3 以降) をそのまま継続する。
3. reorganize-diff が Phase 2 で `git push` / `gh pr create` まで完走した場合、その先のステップ (元の呼び出し元フローでの push / PR 作成) は再実行しない。

**完了条件**:

- `reorganize-diff` が次のいずれかを返している:
  - **「分割不要」**: 既存の commit / PR 構造が論理変更と一致しているので Phase 2 は走らない。呼び出し元が後続フローを継続する。
  - **「コミット整理のみ」**: 同一ブランチ上で Tier 2 コミットを再構成して `git push --force-with-lease` 済み。呼び出し元は push を再実行せず、PR 作成側の step に進む。
  - **「スタック PR」**: Tier 1 単位で複数の draft PR を作成し、`stacked-pr` へハンドオフ済み。呼び出し元 (Create PR) はここで終了する。

---

## Review PR

**Entry**: 「PR をレビューして」「コメントして」「差分を見て」などの指示がある。

**Steps**:

1. 対象 PR を特定する（指示がなければ current branch の open PR）。
2. read-only 指示がある場合は「diff と、対象 PR を特定するための最小 metadata の確認だけ。コメント投稿、返信、インラインコメントはしない」と明示してから **`github-pr-review-operation` スキルを呼び出す**。
3. read-only 指示がない場合は **`github-pr-review-operation` スキルを呼び出す**。

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

- 操作タイプが不明な場合は、この skill 冒頭の state probe を実行してから判断する。
- `Rebase -> Push to PR` は `git push` を 2 回行うフローではない。Rebase 側の push を再利用し、後段は PR metadata と CI を更新する。
