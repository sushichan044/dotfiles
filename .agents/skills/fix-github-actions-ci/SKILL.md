---
name: fix-github-actions-ci
description: GitHub Actions CI の失敗を調査して修正するためのスキルです。CI ログを分析して失敗箇所・原因を特定し、そのまま修正作業まで行います。
allowed-tools: Bash(gh pr view:*) Bash(gh pr checks:*) Bash(gh run view:*) Bash(gh run list:*) Bash(gh run watch:*) Bash(gh workflow view:*) Bash(gh workflow list:*)
---

# fix-github-actions-ci

## Tips

- `gh pr checks --watch` や `gh run watch <run-id>` を使うと、CI の再実行後の状況をリアルタイムで確認できますが、
  結構時間がかかるので background に移譲して非同期実行してください。
- **実行中の job がある場合は `gh pr checks <PR> --watch` で全 check の完了を待ってから失敗収集すること。**
  background で実行して通知を待てばよい。
- すべての gh コマンドについて、`--repo` でリポジトリを明確にすることをおすすめします
  - 現在いるリポジトリの owner/repo 形式: !`gh repo view --json owner,name --jq '.owner.login+"/"+.name'`
- 調査完了後は、そのまま修正作業まで続けて、完了条件を満たしたら push して PR に反映させるところまで行うことを目指してください。

## Steps

### Step 1: PR コンテキストの確認

現在のブランチに関連する PR を確認する:

!`gh pr view --json url,number 2>/dev/null || echo "No PR found for current branch"`

PR が見つからない場合はユーザーにどの PR を修正するか確認し、以降の操作でその PR を指定する。
PR コンテキストとして受け付けられる形式: PR 番号、URL、ブランチ名

### Step 2: 実行中 job の待機

pending / in_progress な check が残っているか確認する:

```bash
gh pr checks <PR> --json name,state,bucket \
  --jq '[.[] | select(.bucket == "pending" or .state == "IN_PROGRESS")] | length'
```

- 結果が **0** なら即座に Step 3 へ進む
- 結果が **1 以上** なら `gh pr checks <PR> --watch` を **background** で実行し、
  全 check 完了の通知を受けてから Step 3 へ進む

### Step 3: Check ステータスの確認

失敗している check と workflow name を特定し、失敗した run の ID をメモする:

```bash
gh pr checks <PR> --json name,state,bucket,workflow --jq '[.[] | select(.bucket == "fail")]'
```

### Step 4: 失敗ログの取得

失敗した run ID のログを確認する:

```bash
gh run view <run-id> --log-failed
```

run ID が不明な場合は `gh run list --branch <branch>` で探す。

ログからファイル名・行番号・エラーメッセージを特定する。

### Step 5: workflow からローカル確認コマンドを特定する

Step 3 で取得した workflow name から workflow の YAML ファイルを取得する。
なお、workflow name は space を含む可能性があるので quote すること。

```bash
gh workflow view "<workflow-name>" --yaml
```

ログと照合しながら、fail-fast により実行されなかった可能性のある step を特定する。
**自動テスト系の時間がかかるチェック以外**の静的解析 step をすべてリストアップする。

テストと判断する基準: step 名やコマンドに `test`, `spec`, `e2e`, `coverage`, `vrt` などのキーワードが含まれるもの。

### Step 6: main agent に返すための修正方針をまとめる

次の形式で簡潔に整理して返す。
修正方針は「どのようなエラーが出ており、どのコードや設定を修正すべきか」を明記すること。

```markdown
## CI failure summary

- PR context: <PR number/url/branch>
- Failed check: <check name>
- Workflow: <workflow name>
- Run ID: <run id>

## Error location

- File: <path or unknown>
- Line: <line or unknown>
- Message: <error message>
- Why it is failing: <root cause hypothesis based on log>

## How to verify locally

- <command 1>
- <command 2>

## Suggested fix location

- <file or component to modify based on error location and workflow steps>
- <additional risk or fail-fast note if relevant>

## Done condition

- <what output or command result should indicate the error is resolved>
```

### Step 7: 修正を実施する

Step 6 のサマリをもとに、実際にコードを修正する。修正後は Done condition に記載したコマンドでローカル確認を行い、エラーが解消されたことを確認し、修正内容を commit して PR に push する。
