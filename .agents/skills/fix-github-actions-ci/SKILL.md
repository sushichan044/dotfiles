---
name: fix-github-actions-ci
description: GitHub Actions CI の失敗を修正するためのスキルです。CI のログを分析して、失敗の原因を特定し、修正を行いましょう。
allowed-tools: Bash(gh pr view:*) Bash(gh pr checks:*) Bash(gh run view:*) Bash(gh run list:*) Bash(gh run watch:*) Bash(gh workflow view:*) Bash(gh workflow list:*)
context: fork
---

# fix-github-actions-ci

## Tips

- `gh pr checks --watch` や `gh run watch <run-id>` を使うと、CI の再実行後の状況をリアルタイムで確認できますが、
結構時間がかかるので background に移譲して非同期実行してください。
- すべての gh コマンドについて、`--repo` でリポジトリを明確にすることをおすすめします
  - 現在いるリポジトリの owner/repo 形式: !`gh repo view --json owner,name --jq '.owner.login+"/"+.name'`

## Steps

### Step 1: PR コンテキストの確認

現在のブランチに関連する PR を確認する:

!`gh pr view --json url,number 2>/dev/null || echo "No PR found for current branch"`

PR が見つからない場合はユーザーにどの PR を修正するか確認し、以降の操作でその PR を指定する。
PR コンテキストとして受け付けられる形式: PR 番号、URL、ブランチ名

### Step 2: Check ステータスの確認

失敗している check と workflow name を特定し、失敗した run の ID をメモする:

```bash
gh pr checks <PR> --json name,state,bucket,workflow --jq '[.[] | select(.bucket == "fail")]'
```

### Step 3: 失敗ログの取得

失敗した run ID のログを確認する:

```bash
gh run view <run-id> --log-failed
```

run ID が不明な場合は `gh run list --branch <branch>` で探す。

ログからファイル名・行番号・エラーメッセージを特定する。

### Step 4: エラーの修正

ログから特定した問題を修正する。

CI は fail-fast で動作している可能性があるため、最初の失敗以降の step は実行されていないことを念頭に置く。

### Step 5: CI workflow からローカル実行コマンドを特定する

Step 2 で取得した workflow name から workflow の YAML ファイルを取得する。
なお、workflow name は space を含む可能性があるので quote すること。

```bash
gh workflow view "<workflow-name>" --yaml
```

ログと照合しながら、fail-fast により実行されなかった可能性のある step を特定する。
**自動テスト系の時間がかかるチェック以外**の静的解析 step をすべてリストアップする。

テストと判断する基準: step 名やコマンドに `test`, `spec`, `e2e`, `coverage`, `vrt` などのキーワードが含まれるもの。

### Step 6: 静的解析をローカルで全実行

Step 5 で特定したコマンドをすべてローカルで実行する。

全通過するまで Step 4→6 を繰り返す。
