---
name: watch-ci
description: >-
  CI を監視し、失敗したら自律的に修正してパスするまでループするスキル。push 後・PR 作成後・rebase 後に CI が通るか確認したいとき、CI が落ちていたら直してほしいとき、CI の結果を待ちたいときに使う。「CI 監視して」「CI が通るまで待って」「CI 直して」「push したので CI を見ておいて」など、CI の状態確認・自動修正が必要な場面では必ずこのスキルを呼び出すこと。
allowed-tools: Bash(git branch:*), Bash(git push:*), Bash(gh run list:*), Bash(gh run view:*), Bash(gh run watch:*), Bash(gh run rerun:*), Bash(gh pr view:*), Bash(gh pr checks:*)
---

# watch-ci

push または PR 作成後の CI を監視し、失敗したらまず失敗ログを読み、原因を分類してから修正または re-run を選び、パスするまでループする。

**re-run はログを読んで一過性の失敗だと判断できた場合にだけ行う。** 内容を見ずに再実行すると、決定的な失敗（テスト・lint・型エラー）では同じ結果を繰り返すだけで時間を浪費し、実在するバグを flaky と誤認する。

## Procedure

### 1. コンテキスト確認

```bash
git branch --show-current
gh pr view --json number,url,headRefName 2>/dev/null
```

### 2. PR チェック一覧を取得して失敗を検出

**PR が存在する場合**: `gh run list` ではなく `gh pr checks` を使うこと。
`gh run list --limit 1` はブランチ上の最後に起動した run しか見ないため、
複数 workflow が走るリポジトリでは失敗した run を見逃す原因になる。

```bash
# PR に紐づく全チェックの状態を取得
gh pr checks --json name,status,conclusion,link 2>/dev/null
```

判定:

- `conclusion=failure` のチェックが 1 件でもある → 失敗。リンクから run ID を取得して Step 3 へ。
- 全件が `success` / `skipped` / `neutral` → 成功。完了レポートを出して終了。
- `status=in_progress` / `queued` が残っている → 待機してリトライ。

**PR が存在しない場合**: 直近 5 件の run を確認する。

```bash
gh run list --branch "$(git branch --show-current)" --limit 5 \
  --json databaseId,status,conclusion,url,workflowName
```

いずれも run が存在しない場合（push 直後）は 5 秒待って最大 6 回再試行する。
6 回試しても run が現れなければユーザーに報告して終了する。

失敗 run の ID は `gh pr checks` のリンク URL から取得する:

```bash
# リンク例: https://github.com/owner/repo/actions/runs/12345678/job/...
# run ID は runs/ と /job の間の数値
gh pr checks --json link --jq '[.[] | select(.conclusion=="failure") | .link | capture("runs/(?P<id>[0-9]+)") | .id] | unique'
```

### 3. CI run を監視

Bash tool に background 実行のためのパラメータがある場合明示的に background 実行すること。

```bash
gh run watch <run-id> --compact
```

### 4. 失敗時: まず失敗ログを読む

re-run より先に、必ず失敗した step のログを取得して中身を読む。

```bash
# 失敗した step のログだけを取得
gh run view <run-id> --log-failed

# どの job が落ちたか俯瞰したい場合
gh run view <run-id>
```

ログが長い場合もエラーメッセージ本体（assertion の diff、コンパイラ／linter の出力、
exit code 直前の行）まで読むこと。step 名だけで判断しない。

### 5. 失敗の分類

ログの内容と PR の変更範囲を突き合わせて、失敗を 3 つに分類する。

```bash
# PR の変更ファイル一覧を取得
gh pr view --json files --jq '[.files[].path]'
```

| 分類                | ログに現れる典型                                                                                                                                                                    | 次のアクション                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **A. 決定的な失敗** | テストの assertion 失敗、lint / 型 / コンパイルエラー、snapshot 差分、lockfile 不整合。失敗ログのファイルパスが PR 変更ファイルと重複する場合も含む                                 | re-run しない → Step 6           |
| **B. 一過性の疑い** | ネットワーク / DNS / TLS エラー、パッケージ・コンテナレジストリの 5xx や rate limit、runner の起動失敗や通信断、OOM、disk full、外部サービス待ちの timeout、GitHub Actions 側の障害 | 1 回だけ re-run → Step 7         |
| **C. 無関係な失敗** | 失敗ログのファイルパスが PR 変更ファイルとまったく重複せず、B の兆候もない                                                                                                          | 修正も re-run もせず報告して終了 |

分類に迷う場合は B とみなさない。同じ入力で再実行すれば同じ結果になる失敗を
re-run で流すと、実在するバグを flaky として見逃す。

**C の場合の報告内容:**

PR の変更に起因しない失敗を推測で直すと、原因を隠したまま別の変更を積むことになるため、修正は試みない。

- 失敗した workflow 名と step 名
- 失敗ログの該当箇所（エラーメッセージと、あれば外部サービス名やタイムアウト値）
- PR の変更ファイルと重複しないと判断した根拠

### 6. 分類 A: 修正する

`fix-github-actions-ci` スキルを呼び出す。このスキルが原因特定・修正・commit/push まで完走する。
完了後は Step 8 へ。

### 7. 分類 B: re-run する

失敗した job だけを再実行する。同一 run に対する re-run は 1 回までとする。

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
- re-run and failed again: → 一過性ではなかったということなので、Step 4 に戻ってログを読み直し、A または C として分類し直す。

### 8. 修正後: ループ

`fix-github-actions-ci` による修正 push 完了後、Step 2 に戻って新しい run を取得・監視する。

**ループ終了条件:**

- CI がパスした → 成功レポートを出して終了
- flaky として記録し re-run でパスした → 成功レポート（flaky 注記付き）を出して終了
- PR の変更と無関係な失敗と判定した → Step 5 の報告内容をユーザーに渡して終了
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
