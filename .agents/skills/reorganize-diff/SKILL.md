---
name: reorganize-diff
description: 大きなブランチや PR を、機能・振る舞い単位の PR と、その内側のコード変更種別ごとのコミットに2段階で再編成するスキル。「PR が大きすぎる」「PR を分けたら1コミットの大きなPRになった」「コミットが整理されていない」「PoC をレビュー可能な単位に崩したい」「diff の分割方法を相談したい」「plan-stacked-pr から分割粒度の決定を委譲されたとき」に使う。PR 粒度（機能/振る舞い）とコミット粒度（コード変更種別）を明示的に2層で管理する。
allowed-tools: Read, Grep, Glob, Edit, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git fetch:*), Bash(git diff:*), Bash(git show:*), Bash(git merge-base:*), Bash(git rev-parse:*), Bash(git rev-list:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git cherry-pick:*), Bash(git restore:*), Bash(git stash:*), Bash(git reset:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh pr create:*), Bash(gh pr diff:*), Bash(gh repo view:*)
---

# reorganize-diff

大きなブランチや PR を2層で再編成する:

- **Tier 1 (PR 単位)**: ユーザーが認識できる機能・振る舞いの変化
- **Tier 2 (コミット単位)**: Tier 1 の PR 内でのコード変更種別

**不変条件**: PR 1 つにコミット 1 つはほぼ常に Tier 2 が省略されたサイン。

---

## 2層モデル

### Tier 1 — PR 境界（機能/振る舞い粒度）

プロダクトマネージャーがリリースノートに書く単位で分ける。技術層（API/DB/UI）をまたいでいても、同じ機能に向いていれば1 Tier 1 単位。

問い:

- このグループで「ユーザーが何かできるようになった/変わった」と言えるか?
- この単位で PR を承認したレビュアーは、何が変わったか説明できるか?

Tier 1 の典型例:

- 新しいユーザー向け機能のエンドツーエンド
- 既存機能の挙動変更
- 新しい API エンドポイントまたは CLI コマンド
- ユーザーに影響するシステム動作変更

**Tier 1 間の依存が曖昧な場合**:

機能的に一方がなければ他方が成立しない（UI が API に依存するなど）ならスタック。それぞれ独立して動作・レビュー可能なら並列（どちらも同じ base ブランチ）。不確実なら独立（並列）を推奨し、計画に理由を添える。

### Tier 2 — コミット境界（コード変更種別粒度）

Tier 1 の PR 内で、コード変更の種別ごとにコミットを分ける。順序は依存関係に基づく（後続コミットは前コミットに依存できる）。

問い:

- このコミットは1種類の技術的役割を持つか?
- 後続コミットの前提として独立して理解できるか?

Tier 2 の典型例（依存順）:

1. スキーマ・マイグレーション
2. 共有コントラクト・型・インターフェース
3. ドメインロジック・ユースケース（ドメインはインフラを知らない: インフラより先）
4. インフラ・リポジトリ実装（ドメイン型に依存するため、ドメインより後）
5. 消費側（API ハンドラ、UI、CLI コマンド）
6. インフラ・設定・ロールアウト制御（消費側と並行か後）
7. テスト・ドキュメント（独立できる場合）

**同一ファイルに複数 Tier 2 が混在する場合**:

- hunk 単位で分割できる → `git add -p` で分離する
- 分離不能なら foundational 側（依存される方）の Tier 2 にまとめて、その旨を計画に明記する

**同一変更種別の複数変更をまとめるか分けるか**:

同一 Tier 2 カテゴリ（例: API ハンドラ追加）に属する複数の変更は、同一機能の一部であれば 1 コミットにまとめてよい。「1コミットで何が変わったか」を 1 文で説明できる粒度を保てば、複数ファイル・複数エンドポイントが含まれていても問題ない。逆に同一カテゴリでも独立した機能に向いているなら分ける。

**設定・インフラ変更の割り当て**:

特定機能のための設定変更（DBコネクション調整、フィーチャーフラグ追加など）は、その機能の Tier 1 単位に含める。汎用的な設定変更は基盤 PR（最初の Tier 1 単位）に含める。

---

## Phase 1: 分析

この phase は副作用なし。`plan-stacked-pr` から委譲されたときはこの phase のみ実行する。

### 1-1. コンテキスト収集

**既存 PR の場合**:

```bash
gh pr view <number> --json number,title,url,baseRefName,headRefName,additions,deletions,changedFiles
gh pr diff <number>
```

**ローカルブランチの場合**:

```bash
git branch --show-current
default_branch=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)
git diff "${default_branch}...HEAD" --stat
git diff "${default_branch}...HEAD"
git log "${default_branch}...HEAD" --oneline
```

**別のスキルから委譲された場合**:

提供された機能説明を使い、境界・依存関係の把握に必要な範囲だけコードベースを読む。

収集後、次を特定する:

- 混在している責務の種類
- ユーザーが Tier 1 分割を求めているか、Tier 2 のみか
- 実行を求めているか、分析のみか

実行が必要かつ PR 分割か commit 整理かが不明な場合は、実行前に1つだけ確認する: 「スタック PR（Tier 1 + Tier 2）にするか、コミット整理のみ（Tier 2 のみ）にするか?」

### 1-2. Tier 1 分割（PR 境界）

差分全体を読み、ユーザー視点の機能・振る舞い単位でグループ化する。

- 「この変更でユーザーが何かできるようになる/変わる」単位でまとめる
- 複数の独立した機能が混在していれば Tier 1 を複数に分ける
- diff がすでに適切な粒度なら「分割不要」と明示する

1文で説明できない単位はまだ広すぎる。「and also」が続くなら複数の単位。

### 1-3. Tier 2 分割（各 Tier 1 内のコミット境界）

各 Tier 1 単位に含まれる変更を、コード変更種別ごとに Tier 2 に分解し、依存順に並べる。

詳細な粒度ガイドラインは `references/diff-granularity.md` を参照すること（反パターン・サイジングヒューリスティクス・バリデーションチェックリスト）。

### 1-4. 計画出力

**Tier 1 分割あり（スタック PR モード）**:

```text
Reorganization Plan:

PR 1: <slug> — <機能/振る舞いの一行説明>
  Base: <parent-branch>
  Tier 2 commits:
    1. <変更種別>: <一行説明>  (scope: <files/areas>)
    2. <変更種別>: <一行説明>  (scope: <files/areas>)
  Depends on: none | PR N

PR 2: <slug> — <機能/振る舞いの一行説明>
  Base: PR 1 | <branch>
  Tier 2 commits:
    1. <変更種別>: <一行説明>
  Depends on: PR 1
```

**Tier 1 分割なし（コミット整理のみ）**:

```text
Commit Reorganization Plan:

Branch: <current-branch>
PR: <PR number or "none"> — <feature description>
Action: Tier 2 コミット整理のみ（PR 構造は変更しない）

Tier 2 commits (依存順):
  1. <変更種別>: <一行説明>  (scope: <files/areas>)
  2. <変更種別>: <一行説明>
  ...
```

計画提示後、実行前にユーザー承認を得る。

---

## Phase 2: 実行

承認なしに実行しない。

### 2-1. 作業開始前の安全確保

```bash
git stash   # 未コミット変更がある場合
# または作業前バックアップブランチ
git checkout -b backup/<branch-name>-pre-reorganize
```

### 2-2. 変更の抽出手法

既存コミット境界と論理変更境界の一致度で手法を選ぶ:

- **コミット境界が論理変更と一致している**: `git cherry-pick` を使う
- **コミットが混在 / 作業ツリーが雑然**: ファイルまたは hunk 単位で選択的にステージする

```bash
git checkout -b <branch-name> <parent-branch>
git checkout <source-ref> -- <path>   # ファイル単位
git add -p                             # hunk 単位（同一ファイルに複数 Tier 2 の場合）
git add <path>
git commit -m "<type>(<scope>): <message>"
```

コミット後、`contextual-commit` スキルでコミットメッセージを仕上げる。

### 2-3. スタック PR モード（Tier 1 分割あり）

Tier 1 の依存順にブランチを作成し、各ブランチ内を Tier 2 コミットで構成する。

```bash
# Tier 1 ブランチ作成
git checkout -b <pr-branch> <parent-branch>

# Tier 2 コミットを依存順に積む
git checkout <source-ref> -- <path>
git add -p
git commit -m "<type>(<scope>): <message>"
```

各ブランチ完成後:

```bash
gh pr create \
  --draft \
  --base <parent-branch> \
  --title "<title>" \
  --body "<body>"
```

PR 本文の生成は `prepare-issue-pr` スキルに委譲する。
PR 作成後のスタック管理は `stacked-pr` スキルに委譲する。

元の monolithic PR を置き換える場合は、元 PR に新スタックへのリンクを貼った上でクローズを提案する（自動クローズしない）。

### 2-4. コミット整理のみモード（Tier 1 分割なし）

現ブランチの Tier 2 コミットを作り直す。

```bash
merge_base=$(git merge-base HEAD origin/<base-branch>)
git reset "$merge_base"   # 全変更をステージに戻す
# Tier 2 ごとに git add / git add -p → git commit を繰り返す
git push --force-with-lease origin HEAD
```

コミットシーケンスが論理的に読めることを確認してから push する。

### 2-5. 結果報告

**スタック PR モード**:

- 元ブランチ / PR
- 作成したブランチと PR 一覧（ベース関係・各 PR の Tier 2 コミット一覧付き）
- `stacked-pr` へのハンドオフ

**コミット整理のみモード**:

- ブランチ名と PR 番号
- 最終コミット一覧（種別・順序付き）
- 未コミット変更の有無

---

## Edge Cases

### 同一ファイルに複数 Tier 2 が混在

hunk が独立していれば `git add -p` で分離する。分離不能なら foundational 側の Tier 2 にまとめて計画に明記する。

### 循環依存

A と B が互いを必要とする場合は1つの論理変更。分割しない。

### 差分はすでに適切な粒度

既存のコミットや PR 境界が論理変更と一致しているなら「分割不要」と伝える。

### Tier 1 単位内の独立した Tier 2 同士

同一 PR 内の Tier 2 コミットが互いに依存しない場合でも、commit モードでは linear order を保ちやすい順（foundational → consuming）で並べる。

---

## 境界

- Phase 1 は分析のみで副作用なし。Phase 2 はユーザー承認と明示的な実行指示が必要。
- ユーザーが Tier 1 不要（PR は変えない）と言った場合は Tier 2 のみ実行する。
- PR 作成後のスタック管理は `stacked-pr` に委譲する。
- `plan-stacked-pr` から委譲されたときは Phase 1 のみ実行する。
