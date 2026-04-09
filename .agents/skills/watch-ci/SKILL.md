---
name: watch-ci
description: >-
  CI を監視し、失敗したら自律的に修正してパスするまでループするスキル。push 後・PR 作成後・rebase 後に CI が通るか確認したいとき、CI が落ちていたら直してほしいとき、CI の結果を待ちたいときに使う。「CI 監視して」「CI が通るまで待って」「CI 直して」「push したので CI を見ておいて」など、CI の状態確認・自動修正が必要な場面では必ずこのスキルを呼び出すこと。
allowed-tools: Bash(git branch:*), Bash(git push:*), Bash(gh run list:*), Bash(gh run view:*), Bash(gh run watch:*), Bash(gh pr view:*), Bash(gh pr checks:*)
---

# watch-ci

push または PR 作成後の CI を監視し、失敗したら `fix-github-actions-ci` スキルで修正してパスするまでループする。

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

```bash
gh run watch <run-id> --exit-status
```

- 終了コード 0 → CI パス。[完了レポート](#完了レポート)を出して終了。
- 終了コード 非0 → CI 失敗。Step 4 へ。

### 4. 失敗時: fix-github-actions-ci を呼び出す

**`fix-github-actions-ci` スキルを呼び出す**。このスキルが原因特定・修正・commit/push まで完走する。

### 5. 修正後: ループ

修正 push 完了後、Step 2 に戻って新しい run を取得・監視する。

**ループ終了条件:**

- CI がパスした → 成功レポートを出して終了
- 同一ブランチで修正を 3 回試みたが CI が改善しない → ユーザーに報告して終了（無限ループ防止）
- ユーザーが停止を指示した

## 完了レポート

```
CI Watch Report
  Branch : <branch>
  PR     : <url>
  Result : ✅ passed | ❌ failed after <N> attempts
  Runs   : <run-url-1>, <run-url-2>, ...
```
