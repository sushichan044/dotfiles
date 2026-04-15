---
name: github-pr-review-operation
description: GitHub Pull Request上でのレビュー操作を行うスキル。ghコマンドでPR情報取得、差分確認、コメント投稿・取得、インラインコメント、コメント返信を実行する。PRにコメントを投稿したい、差分を行番号付きで確認したい、レビューコメントに返信したいときに使用。
---

# GitHub PR Review Operation

GitHub CLI (`gh`) を使ったPRレビュー操作。

## Inline Comment First

PR 上で code-specific な指摘や補足を残したい場合は、まずこの手順を見る。

### 目的

インラインコメントは、PR本文ではなく diff 上の正確な位置にレビュー意図を残すために使う。実装上の懸念、設計判断への確認、特定行への補足はここで扱う。

### 最短手順

1. 対象 PR を特定する。
2. `gh pr diff` を行番号付きで見て、コメント対象の `path` と `line` を決める。
3. `RIGHT` / `LEFT` を判定する。
4. head commit SHA を取得する。
5. `gh api repos/OWNER/REPO/pulls/NUMBER/comments --method POST ...` で投稿する。

### 行番号の見つけ方

まず diff を行番号付きで表示する。

```bash
gh pr diff NUMBER --repo OWNER/REPO | awk '
/^@@/ {
  match($0, /-([0-9]+)/, old)
  match($0, /\+([0-9]+)/, new)
  old_line = old[1]
  new_line = new[1]
  print $0
  next
}
/^-/ { printf "L%-4d     | %s\n", old_line++, $0; next }
/^\+/ { printf "     R%-4d| %s\n", new_line++, $0; next }
/^ / { printf "L%-4d R%-4d| %s\n", old_line++, new_line++, $0; next }
{ print }
'
```

- `L数字`: base 側の削除行。インラインコメントでは `side=LEFT`
- `R数字`: head 側の追加行。インラインコメントでは `side=RIGHT`

### 単一行コメント

まず head commit SHA を取る。

```bash
gh api repos/OWNER/REPO/pulls/NUMBER --jq '.head.sha'
```

その後、対象行にコメントする。

```bash
gh api repos/OWNER/REPO/pulls/NUMBER/comments \
  --method POST \
  -f body="コメント内容" \
  -f commit_id="COMMIT_SHA" \
  -f path="src/example.py" \
  -F line=15 \
  -f side=RIGHT
```

### 複数行コメント

```bash
gh api repos/OWNER/REPO/pulls/NUMBER/comments \
  --method POST \
  -f body="コメント内容" \
  -f commit_id="COMMIT_SHA" \
  -f path="src/example.py" \
  -F line=15 \
  -f side=RIGHT \
  -F start_line=10 \
  -f start_side=RIGHT
```

### 注意点

- `-F` は数値パラメータ用。`line` と `start_line` は `-F` を使う
- `side` は `RIGHT` または `LEFT`
- diff で見えている行番号と `path` が一致していないと投稿に失敗する

## 前提条件

- `gh` インストール済み
- `gh auth login` で認証済み

## PR URLのパース

PR URL `https://github.com/OWNER/REPO/pull/NUMBER` から以下を抽出して使用：

- `OWNER`: リポジトリオーナー
- `REPO`: リポジトリ名
- `NUMBER`: PR番号

## 特に PR が指示されなかった場合や、この PR などの指示語が与えられた場合

`gh pr view --json url --jq .url 2>/dev/null || echo "No PR found for current branch"` を実行して、現在のブランチに関連するPR URLを取得し、パースして使用する。

## 操作一覧

### 1. PR情報取得

```bash
gh pr view NUMBER --repo OWNER/REPO --json title,body,author,state,baseRefName,headRefName,url
```

### 2. 差分取得（行番号付き）

```bash
gh pr diff NUMBER --repo OWNER/REPO | awk '
/^@@/ {
  match($0, /-([0-9]+)/, old)
  match($0, /\+([0-9]+)/, new)
  old_line = old[1]
  new_line = new[1]
  print $0
  next
}
/^-/ { printf "L%-4d     | %s\n", old_line++, $0; next }
/^\+/ { printf "     R%-4d| %s\n", new_line++, $0; next }
/^ / { printf "L%-4d R%-4d| %s\n", old_line++, new_line++, $0; next }
{ print }
'
```

出力例：

```
@@ -46,15 +46,25 @@ jobs:
L46   R46  |            prompt: |
L49       | -            （削除行）
     R49  | +            （追加行）
L50   R50  |              # レビューガイドライン
```

- `L数字`: LEFT(base)側の行番号 → インラインコメントで`side=LEFT`に使用
- `R数字`: RIGHT(head)側の行番号 → インラインコメントで`side=RIGHT`に使用

### 3. コメント取得

Issue Comments（PR全体へのコメント）:

```bash
gh api repos/OWNER/REPO/issues/NUMBER/comments --jq '.[] | {id, user: .user.login, created_at, body}'
```

Review Comments（コード行へのコメント）:

```bash
gh api repos/OWNER/REPO/pulls/NUMBER/comments --jq '.[] | {id, user: .user.login, path, line, created_at, body, in_reply_to_id}'
```

### 4. PRにコメント

```bash
gh pr comment NUMBER --repo OWNER/REPO --body "コメント内容"
```

### 5. インラインコメント（コード行指定）

手順の要約は上の `Inline Comment First` を優先して参照する。

まずhead commit SHAを取得：

```bash
gh api repos/OWNER/REPO/pulls/NUMBER --jq '.head.sha'
```

単一行コメント：

```bash
gh api repos/OWNER/REPO/pulls/NUMBER/comments \
  --method POST \
  -f body="コメント内容" \
  -f commit_id="COMMIT_SHA" \
  -f path="src/example.py" \
  -F line=15 \
  -f side=RIGHT
```

複数行コメント（10〜15行目）：

```bash
gh api repos/OWNER/REPO/pulls/NUMBER/comments \
  --method POST \
  -f body="コメント内容" \
  -f commit_id="COMMIT_SHA" \
  -f path="src/example.py" \
  -F line=15 \
  -f side=RIGHT \
  -F start_line=10 \
  -f start_side=RIGHT
```

**注意点：**

- `-F` (大文字): 数値パラメータ（`line`, `start_line`）に使用。`-f`だと文字列になりエラーになる
- `side`: `RIGHT`（追加行）または `LEFT`（削除行）

### 6. コメントへ返信

```bash
gh api repos/OWNER/REPO/pulls/NUMBER/comments/COMMENT_ID/replies \
  --method POST \
  -f body="返信内容"
```

`COMMENT_ID`はコメント取得で得た`id`を使用。
