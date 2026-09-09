---
name: reorganize-diff
description: Analyze or reorganize a final diff into behavior-focused PRs and reviewable commits, including split plans requested by plan-stacked-pr.
allowed-tools: Read, Grep, Glob, Edit, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git fetch:*), Bash(git diff:*), Bash(git show:*), Bash(git merge-base:*), Bash(git rev-parse:*), Bash(git rev-list:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git cherry-pick:*), Bash(git restore:*), Bash(git stash:*), Bash(git reset:*), Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh pr create:*), Bash(gh pr diff:*), Bash(gh repo view:*)
---

# reorganize-diff

大きなブランチや PR を2層で再編成する:

- **Tier 1 (PR 単位)**: ユーザーが認識できる機能・振る舞いの変化
- **Tier 2 (コミット単位)**: Tier 1 の PR 内でのコード変更種別

**入力は最終差分だけ**（`git diff <base>...HEAD`）。既存のコミット履歴は参考情報であり、再現対象ではない。試行錯誤や作業順序の痕跡（WIP、後続コミットで打ち消される変更、typo/lint の後追い修正）を再構成後の履歴に持ち込まない。

**不変条件**:

1. 再構成後の全コミットの差分の総和は、元の最終差分と一致する。
2. 各コミットはコミット単位でレビューできる（判定基準は「Tier 2 — コミット境界」節）。
3. 後続コミットが打ち消す変更を、前のコミットに含めない。

A single commit is sufficient when it meets all Tier 2 criteria. Split by responsibility,
not by a minimum commit count.

最終差分そのものを変える提案（不要な変更を落とす等）は本 skill のスコープ外。必要ならその差分を提示し、個別に承認を得る。

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

**コミット単位でレビューできる**とは、次の 4 つを満たすこと:

1. そのコミットの差分だけを読んで、何が変わったかを 1 文で説明できる。
2. 同一 PR 内の後続コミットで削除・書き換えられる行を含まない。
3. 依存先が自分より前のコミットに閉じている（foundational → consuming の順）。
4. レビュアーの「この変更は要る/要らない」の判断が、後続コミットで覆らない。

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

### 1-2. 過程コミットの判定

最終差分と既存コミットを突き合わせ、破棄・畳み込みの対象を特定する。

```bash
git log "${base}...HEAD" --stat     # 各コミットが触ったファイル
git diff "${base}...HEAD" --stat    # 最終差分に残っているファイル
```

- 最終差分に痕跡を残していないコミット（追加してから削除、revert 対）はまるごと破棄する。
- 対象機能に対する WIP・fixup・typo・lint 修正は、対応する本体の Tier 2 コミットに畳み込む。畳み込み後の内容・メッセージは本体側を優先する。本体は、同じファイルへの変更を最終的に確定した直近のコミットとする。
- 最終差分に含まれるが対象機能と無関係な変更（既存ファイルへの typo/コメント修正など）は、独立した最小コミットとして分離し、機能本体のコミット群より前に置く。
- 破棄・畳み込みの一覧を 1-5 の計画出力に含める。

### 1-3. Tier 1 分割（PR 境界）

差分全体を読み、ユーザー視点の機能・振る舞い単位でグループ化する。

- 「この変更でユーザーが何かできるようになる/変わる」単位でまとめる
- 複数の独立した機能が混在していれば Tier 1 を複数に分ける
- diff がすでに適切な粒度なら「分割不要」と明示する

1文で説明できない単位はまだ広すぎる。「and also」が続くなら複数の単位。

### 1-4. Tier 2 分割（各 Tier 1 内のコミット境界）

各 Tier 1 単位に含まれる変更を、コード変更種別ごとに Tier 2 に分解し、依存順に並べる。

### 1-5. 計画出力

**Tier 1 分割あり（スタック PR モード）**:

```text
Reorganization Plan:

破棄する過程コミット:
  - <SHA/subject> — <破棄理由（後続で打ち消された/revert 対など）>
畳み込む過程コミット:
  - <SHA/subject> → <畳み込み先の Tier 2 commit>

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

破棄する過程コミット:
  - <SHA/subject> — <破棄理由（後続で打ち消された/revert 対など）>
畳み込む過程コミット:
  - <SHA/subject> → <畳み込み先の Tier 2 commit>

Tier 2 commits (依存順):
  1. <変更種別>: <一行説明>  (scope: <files/areas>)
  2. <変更種別>: <一行説明>
  ...
```

Present the concrete plan. Proceed when the requested reorganization covers its
branches and history changes. Ask only for unresolved scope, destructive impact,
or publication beyond existing authorization. A planning-only request ends here.

---

## Phase 2: 実行

Execute within the scope established in Phase 1. Respect hook exit status and verify
the resulting commit or remote state; a rejected hook means the operation failed.

### 2-1. 作業開始前の安全確保

```bash
original_head=$(git rev-parse HEAD)
git branch "backup/$(git branch --show-current)-pre-reorganize"   # checkout せずに退避
# Preserve unrelated tracked and untracked changes before rebuilding history.
```

Use `original_head` for final tree comparison. Prefer an isolated worktree when local
changes are present. Record the exact backup ref and any saved-work identifier.
Recover from the backup while preserving work created since the backup; a destructive
reset requires approval for the exact work it would discard.

### 2-2. 変更の抽出手法

再構成の入力は最終差分だけ。既存コミット履歴は参考情報であり、再現対象ではない。

- 既存コミットの差分がそのまま最終差分の一部として残っている（後続で打ち消されていない、単一の Tier 2 に収まっている）→ `git cherry-pick` で再利用してよい
- それ以外（後続で打ち消された / WIP / fixup / 複数種別が混在）→ 最終状態から作り直す

```bash
git checkout -b <branch-name> <parent-branch>
git checkout <source-ref> -- <path>   # ファイル単位
git add -p                             # hunk 単位（同一ファイルに複数 Tier 2 の場合）
git add <path>
git commit -m "<type>(<scope>): <message>"
```

コミットメッセージは元のコミットメッセージを転用せず、実際の diff 内容に基づいて書く。cherry-pick した件名が Tier 2 の変更種別と食い違うなら、reset して同一内容で再コミットし直す（非対話 rebase の reword は使わない）。

For mechanical redistribution without new decisions, use a Conventional Commit subject.
Preserve repository-required message structure and hooks; use `contextual-commit`
when a commit introduces a new decision that needs context.

### 2-3. スタック PR モード（Tier 1 分割あり）

Tier 1 の依存順にブランチを作成し、各ブランチ内を Tier 2 コミットで構成する。

GitHub の repo では、ブランチ作成に `gh stack` を使う。ブランチ名はそのまま使われる（prefix は付かない）。

```bash
gh stack init <bottom-branch>          # スタックの最下段を作る（作成して checkout まで行う）

# Tier 2 コミットを依存順に積む
git checkout <source-ref> -- <path>
git add -p                             # hunk 単位で意図的に stage する
git commit -m "<type>(<scope>): <message>"

gh stack add <next-branch>             # 次の Tier 1 を 1 段積む（以降くり返し）
```

GitHub 以外のホストでは `git checkout -b <pr-branch> <parent-branch>` で 1 段ずつ作る。

全ブランチを積み終えたら、スタック全体の差分が元の最終差分と一致することを確認してから PR にする。

```bash
git diff --exit-code <original-head> <top-branch>
```

An empty content diff verifies the final tree for a linear stack on the original base.
For independent sibling PRs, combine them in an isolated verification worktree and
compare that tree to the original. If the base changed, account for its changes
separately. A matching diffstat alone does not prove content equality.

```bash
gh stack submit --auto                 # push + draft PR 作成 + base の連結
```

`gh stack submit` は各 PR の base を 1 つ下のブランチに設定し、GitHub 上でスタックとして束ねる。個別の `gh pr create --base` は使わない。

GitHub 以外のホスト、または repo で stacked PR が有効化されていない（`gh stack` が exit 9）場合のみ、従来どおり手で作る。

```bash
# GitHub without native stack support:
gh pr create --draft --base <parent-branch> --title "<title>" --body-file <body-file>
```

PR 本文の生成は `prepare-issue-pr` スキルに委譲する。`gh stack submit --auto` はコミットメッセージからタイトルを自動生成するため、本文を整えるのは PR 作成後になる（`gh pr edit`）。
PR 作成後のスタック管理は `stacked-pr` スキルに委譲する。

When replacing an existing PR, report the replacement URLs. Posting a migration comment
or closing the original PR requires authorization for those actions.

### 2-4. コミット整理のみモード（Tier 1 分割なし）

現ブランチの Tier 2 コミットを作り直す。

```bash
merge_base=$(git merge-base HEAD origin/<base-branch>)
git reset "$merge_base"   # Preserve file content and unstage the changes
# Tier 2 ごとに git add / git add -p → git commit を繰り返す
```

push 前に差分同一性を検証する。

```bash
git diff "$original_head" HEAD --stat   # 空であること
git status --short                       # 未コミット・未追跡が残っていないこと
```

過程コミットの破棄・畳み込みは最終差分を変えないので、この差分は必ず空になる。空でなければ hunk か未追跡ファイルの取りこぼしなので、原因を突き止めるまで push しない。あわせて各コミットに「Tier 2 — コミット境界」節の 4 条件（コミット単位でレビューできる）を当てて確認する。

```bash
git push --force-with-lease origin HEAD
```

### 2-5. 結果報告

両モード共通で、破棄・畳み込みした過程コミットの一覧、差分同一性の検証結果、backup ブランチ名を含める。

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

### 循環依存

A と B が互いを必要とする場合は1つの論理変更。分割しない。

### Tier 1 単位内の独立した Tier 2 同士

同一 PR 内の Tier 2 コミットが互いに依存しない場合でも、commit モードでは linear order を保ちやすい順（foundational → consuming）で並べる。

---

## 境界

- Phase 1 is analysis only. Phase 2 uses the execution scope established in Phase 1.
- ユーザーが Tier 1 不要（PR は変えない）と言った場合は Tier 2 のみ実行する。
- PR 作成後のスタック管理は `stacked-pr` に委譲する。
- `plan-stacked-pr` から委譲されたときは Phase 1 のみ実行する。
