---
name: investigate-flaky-test
description: >-
  CI で失敗したテストが flaky（不安定）かどうかを調査するスキル。PR の影響箇所と関係なさそうな CI 失敗、re-run で通ったが原因を知りたい、同じテストが繰り返し落ちる、テストの信頼性を評価したいときに使う。「flaky test を調べて」「このテストが不安定かどうか確認して」「CI が落ちてるけど関係なさそう」「なぜかたまに落ちる」といった場面で必ずこのスキルを呼び出すこと。
allowed-tools: Bash(gh run list:*), Bash(gh run view:*), Bash(gh pr view:*), Bash(gh pr checks:*)
---

# investigate-flaky-test

CI の失敗が flaky test（不安定なテスト）に起因するかを調査し、根本原因の仮説と対処方針をレポートする。

## 前提情報

呼び出し元（通常 `watch-ci`）から以下の情報を受け取る：

- 失敗した run ID
- 失敗した check / step 名
- PR コンテキスト（番号または URL）

## Steps

### Step 1: 失敗 step の特定

CI ログから失敗しているテスト名・ファイル名を確定する：

```bash
gh run view <run-id> --log-failed
```

エラーメッセージ・スタックトレース・ファイルパスをメモする。

### Step 2: 過去 run での失敗履歴を確認

main ブランチの直近 run でも同じテストが落ちていないか確認する：

```bash
# main ブランチの直近 20 run を一覧
gh run list --branch main --limit 20 --json databaseId,conclusion,headBranch,url

# 気になる run のログを確認（失敗ログのみ）
gh run view <other-run-id> --log-failed
```

同じ test/step 名が他の PR・ブランチでも落ちていれば flaky の可能性が高い。

### Step 3: テストコードの調査

失敗しているテストのソースコードを読み、以下の flaky パターンがないか確認する：

| パターン                       | 確認ポイント                                              |
| ------------------------------ | --------------------------------------------------------- |
| 時刻・タイムゾーン依存         | `time.Now()`, `Date`, `sleep`, 固定日時のアサーション     |
| ランダム値・順序依存           | `Math.random()`, 配列の順序に依存したアサーション         |
| 外部サービス・ネットワーク依存 | HTTP リクエスト、DB 接続、ファイルシステム                |
| 並列実行時の競合               | 共有リソース（グローバル変数、DB レコード等）への書き込み |
| ハードコードされたタイムアウト | 環境差異で遅延が変わりうる箇所                            |
| テスト間の状態リーク           | 前のテストが後のテストに影響しうる副作用                  |

### Step 4: レポートを出力する

以下の形式でまとめる：

```markdown
## Flaky Test Investigation Report

- **Test/Step**: <失敗した test または step 名>
- **Workflow**: <workflow 名>
- **Run ID**: <run id>
- **PR**: <PR 番号/URL>

### Failure history

- 直近 <N> run 中 <M> 回失敗
- 他ブランチ/PR での失敗: あり / なし
  - <あれば該当 run の URL>

### Suspected cause

- <flaky パターンの仮説（Step 3 の分析結果）>

### Evidence

- ログ: <該当箇所の抜粋>
- コード: <問題のある行や関数>

### Recommendations

- [ ] <対処案 1（例: 外部依存をモック化、タイムアウトを延長、retry を追加）>
- [ ] <対処案 2（例: テストを順序非依存に修正、共有状態をリセット）>
- [ ] <対処案 3（例: issue を立てて既知の flaky としてマーク）>
```

### Step 5: 次のアクションをユーザーに確認する

レポートを提示した上で、次のアクションをユーザーに確認する：

- **修正する**: 原因が特定できていれば修正方針を提示して作業に入る
- **Skip/retry で様子見**: 今回は re-run で済ませ、頻度が上がれば対応する
- **Issue を立てる**: 既知の flaky として記録しておく
- **そのまま放置**: 影響が小さければ対応しない判断もある

ユーザーの判断を仰いだ上で、修正を選んだ場合はそのまま修正作業に移る。
