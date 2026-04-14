---
name: watch-ci
description: >-
  CI を監視し、失敗したら自律的に修正してパスするまでループするスキル。push 後・PR 作成後・rebase 後に CI が通るか確認したいとき、CI が落ちていたら直してほしいとき、CI の結果を待ちたいときに使う。「CI 監視して」「CI が通るまで待って」「CI 直して」「push したので CI を見ておいて」など、CI の状態確認・自動修正が必要な場面では必ずこのスキルを呼び出すこと。
allowed-tools: Bash(git branch:*), Bash(git push:*), Bash(gh run list:*), Bash(gh run view:*), Bash(gh run watch:*), Bash(gh run rerun:*), Bash(gh pr view:*), Bash(gh pr checks:*)
---

# watch-ci

push または PR 作成後の CI を監視し、失敗したら re-run を試みてから原因をトリアージし、適切なスキルで修正してパスするまでループする。

## Procedure

### 1. コンテキスト確認

```bash
git branch --show-current
gh pr view --json number,url,headRefName 2>/dev/null
```

### 2. 最新の CI run を取得

```bash
gh run list --branch "$(git branch --show-current)" --limit 1 \
  --json databaseId,status,conclusion,url
```

run がまだ存在しない場合（push 直後）は 5 秒待って最大 6 回再試行する。6 回試しても run が現れなければユーザーに報告して終了する。

### 3. CI run を監視

Bash tool に background 実行のためのパラメータがある場合明示的に background 実行すること。

```bash
gh run watch <run-id> --compact
```

### 4. 失敗時: re-run を試みる

失敗した job だけを再実行する：

```bash
gh run rerun <run-id> --failed
```

re-run の結果を監視する：
Bash tool に background 実行のためのパラメータがある場合明示的に background 実行すること。

```bash
gh run watch <new-run-id> --compact
```

- passing with re-run: → **flaky として記録**し Step 2 に戻る（次の run を監視）。
  - 完了レポートの `Flaky` 欄に記録する。
- re-run and failed again: → Step 5 に進む。

### 5. 失敗トリアージ: PR 影響箇所との関連チェック

re-run しても失敗する場合、CI の失敗が PR の変更と関連しているかどうかを判定する。

```bash
# PR の変更ファイル一覧を取得
gh pr view --json files --jq '[.files[].path]'

# 失敗ログを取得してファイルパス・エラー箇所を確認
gh run view <run-id> --log-failed
```

**判定基準:**

- 失敗ログに含まれるファイルパスやディレクトリが PR 変更ファイルと重複する → **関連あり**
- 重複なし、または失敗が依存関係解決・インフラ・外部サービス系の step → **関連なし（flaky 疑い）**

**判定結果によるルーティング:**

- **関連あり** → `fix-github-actions-ci` スキルを呼び出す。このスキルが原因特定・修正・commit/push まで完走する。
- **関連なし** → `investigate-flaky-test` スキルを呼び出す。調査レポートをユーザーに提示して終了する。

### 6. 修正後: ループ

`fix-github-actions-ci` による修正 push 完了後、Step 2 に戻って新しい run を取得・監視する。

**ループ終了条件:**

- CI がパスした → 成功レポートを出して終了
- flaky として記録し re-run でパスした → 成功レポート（flaky 注記付き）を出して終了
- `investigate-flaky-test` が完了した → 調査レポートをユーザーに渡して終了
- 同一ブランチで `fix-github-actions-ci` による修正を 3 回試みたが CI が改善しない → ユーザーに報告して終了（無限ループ防止）
- ユーザーが停止を指示した

## 完了レポート

```
CI Watch Report
  Branch  : <branch>
  PR      : <url>
  Result  : ✅ passed | ✅ passed (flaky rerun) | ❌ failed after <N> attempts
  Runs    : <run-url-1>, <run-url-2>, ...
  Flaky   : <flaky が検出された場合のみ> <step-name> (rerun passed on <run-url>)
```
