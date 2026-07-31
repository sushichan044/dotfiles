---
name: stacked-pr
description: 依存関係のある複数の PR を管理・同期するためのスキル。GitHub なら `gh-stack` skill (gh stack コマンド) へ必ず委譲し、その preflight・復旧・検証・CI を担当する。GitHub 以外のホストでは手動カスケード rebase を行う。PR が別の PR に依存している状況全般で使う。
---

# stacked-pr

依存関係のある複数の PR を同期する。**道具の選択はホストで決まる**。GitHub なら `gh-stack` を使い、それ以外でだけ手動カスケードを行う。

このスキルの役割は、gh-stack が扱わない領域を埋めることにある: preflight、壊れたときの復旧、rebase 結果の検証、CI の上流優先修正。gh-stack skill は vendored（`skills-lock.json` 管理）なので、そこに知見を書き足さずここに置く。

## When This Skill Applies

- 依存関係のある複数の PR を扱うとき全般
- 親ブランチが更新され、子 PR が古くなったとき
- スタックの途中の PR がマージされ、残りを re-target・rebase する必要があるとき
- `gh stack rebase` / `gh stack sync` が conflict や中断で止まったとき（復旧はここが担当する）

## Routing: GitHub なら必ず gh-stack

rebase を始める前にホストを判定する。推測しない。

```bash
git remote get-url origin
```

- `github.com`（GitHub Enterprise 含む）→ **[Route A: gh-stack](#route-a-gh-stack)**。手動カスケードに逃げない
- それ以外（GitLab、Gerrit、素の git remote 等）→ **[Route B: 手動カスケード](#route-b-手動カスケード非-github)**

Route A の中で `git rebase --onto` を手で叩くのは [Repair](#a-3-repair-playbook) のときだけで、それは Route B への切り替えではない。復旧したら gh-stack の管理下へ戻す。

---

## Route A: gh-stack

コマンドの仕様・フラグ・exit code の意味は `gh-stack` skill が持つ。ここには**その前後にやること**だけを書く。

### A-1. Preflight

rebase・push の前に毎回確認する。ここを飛ばすと A-3 の復旧作業になる。

```bash
gh stack view --json          # exit 0 でスタックとして認識されているか
git worktree list             # スタックのブランチが他の worktree に取られていないか
git config rerere.enabled     # true でないと conflict 解決が使い回されない
git config remote.pushDefault # remote が複数あるとき必要
```

判定:

- **worktree に取られているブランチがある**: gh stack はそのブランチを checkout できず、rebase が途中で止まる。さらに `gh stack rebase --abort` も `already used by worktree` で復旧しきれない。先に worktree を畳むか、そのブランチだけ当該 worktree 内で手動 rebase する
- **exit 2 (not in a stack)**: `gh stack checkout <stack-number|pr-number>` で取り込むか、`gh stack init --base <trunk> <branch>...` で作る
- **exit 6 (disambiguation required)**: 共有されていないブランチへ `gh stack checkout <branch>` してから再実行する
- **exit 9 (stacked PRs unavailable)**: repo で stacked PR が有効化されていない。ユーザーに有効化を促し、それまでの暫定として Route B を使う

`gh stack view --json` の `head` が実際のブランチ tip と一致しているかも見る。ズレていたら記録が古い（[A-3](#a-3-repair-playbook) の症状 1）。

```bash
gh stack view --json | jq -r '.branches[] | select(.head) | "\(.name) \(.head[0:10])"'
git rev-parse --short <branch>
```

### A-2. 通常運用

```bash
gh stack view --json    # 現状把握 (isMerged / needsRebase / pr.state)
gh stack rebase         # fetch + trunk 追従 + カスケード rebase（push はしない）
```

- **push は別ステップ**にする。`gh stack push` は全ブランチへの force-with-lease push であり履歴書き換えにあたるので、実行前にユーザーの承認を取る
- `gh stack sync` は fetch → rebase → push → PR 状態同期を一括で行う。承認済みで一気に流したいときだけ使う
- マージ済みブランチのローカル掃除は `gh stack sync --prune`。非対話環境では `--prune` を明示しないと実行されない
- 下段の PR がマージされたら、**その時点で** sync を通す。放置して trunk が進むほど A-3 の症状 1 を踏みやすくなる

rebase が成功したら [A-4](#a-4-verify) を実行してから push する。

### A-3. Repair playbook

#### 症状 1: 身に覚えのないファイルで conflict する / replay 対象が多すぎる

gh stack が記録している base が古く、既に trunk に入っているコミットまで replay しようとしている。下段 PR が squash merge されたあとに trunk が進むと起きる。

検知（rebase が止まった状態で実行する）:

```bash
git rev-list --count origin/<trunk>..<branch>   # 本来 replay すべき自分のコミット数
wc -l < .git/rebase-merge/git-rebase-todo       # 実際に replay しようとしている数
```

この 2 つが大きく食い違い、conflict しているファイルがブランチの関心と無関係なら確定。

対処:

1. `gh stack rebase --abort`
2. [手動 `--onto` カスケード](#手動---onto-カスケード)で下から積み直す
3. [A-4](#a-4-verify) で検証する
4. `gh stack push` を通して gh stack の記録（head / base）を実際の tip に合わせる
5. `gh stack view --json` の `head` が実 tip と一致し、`needsRebase` が全 false になったことを確認する。まだズレるなら `gh stack unstack --local` → `gh stack init --base <trunk> <下から順のブランチ>` で作り直す（`--local` なので GitHub 側のスタックは保持される）

#### 症状 2: `--abort` が worktree で失敗する

```
⚠ Rebase aborted but some branches could not be fully restored:
  checkout <branch>: ... is already used by worktree at '...'
```

復旧が中途半端に終わっている。`git worktree list` で場所を特定し、そのディレクトリの中で `git status` / `git rebase --abort` を実行して個別に戻す。以降は Preflight で worktree を潰してから gh stack を動かす。

#### 症状 3: 並行編集で下流が古くなる

ユーザーや別セッションがスタックのブランチへ commit / push していることがある。カスケードの直前に必ず tip を取り直す。

```bash
for b in <下から順のブランチ>; do printf '%s %s %s\n' "$b" "$(git rev-parse --short "$b")" "$(git rev-parse --short "origin/$b" 2>/dev/null)"; done
```

上流の tip が想定と違ったら、その上流を起点に下流を積み直す。作業中に増えたコミットは捨てずに取り込む。

#### 手動 `--onto` カスケード

下から順に、1 ブランチずつ実行する。gh stack の記録ではなく**実際の SHA**を使うので、記録が壊れていても影響を受けない。

```bash
# 実行前に必ず: replay されるのが自分のコミットだけか確認する
git log --oneline <古い親の tip>..<ブランチ>

git rebase --onto <新しい親の tip> <古い親の tip> <ブランチ>
```

- **古い親の tip** は rebase 前の親ブランチの tip。`gh stack view --json` の `base`、`git reflog show <親>`、親が squash merge 済みなら `gh pr view <親PR番号> --json headRefOid --jq .headRefOid` から取る
- 確認コマンドの出力が想定より多いなら、指定した「古い親の tip」が実際の分岐点ではない。スタックの途中に rebase コピー（同じ subject の別 SHA）が挟まっていることがあるので、`git log --oneline origin/<trunk>..<ブランチ>` と突き合わせて分岐点を取り直す
- 他の worktree に取られているブランチは、その worktree の中で実行する
- conflict したら `resolve-merge-conflict` skill を呼ぶ

### A-4. Verify

push の前に、rebase が中身を変えていないことを確認する。

```bash
# 1. 各レイヤの diff が rebase 前後で同一か（patch-id が一致するか）
git diff <旧親> <旧tip> | git patch-id --stable
git diff <新親> <新tip> | git patch-id --stable

# 2. スタックが直列につながっているか
git merge-base --is-ancestor origin/<trunk> <bottom>
git merge-base --is-ancestor <親> <子>   # 全ペアで

# 3. push 後: local と remote が一致しているか
git fetch origin --quiet
git rev-parse <branch> origin/<branch>
```

patch-id が食い違ったレイヤは、conflict 解決で内容が変わったか、replay 範囲を間違えている。push する前に原因を突き止める。

---

## Route B: 手動カスケード（非 GitHub）

GitHub 以外のホストでは gh stack が使えないので、依存関係を自分で組み立てて順に rebase する。

### B-1. スタックの構築

現在のブランチと、その下流を洗い出す。read-only な照会は 1 メッセージ内で同時に発行してよい。

```bash
git branch --show-current
git fetch origin <branch1> <branch2> ...            # 1 回にまとめる
git merge-base --is-ancestor $(git rev-parse HEAD) <oid>   # 下流判定
```

各ブランチの親は PR の base branch。親が現在のブランチのものから順にトポロジカルに並べる。同じ深さで互いに依存しないブランチは独立した兄弟で、順序はどちらでもよい。

### B-2. 計画の提示

ブランチ・PR・rebase 先の一覧を示し、`AskUserQuestion` で承認を取ってから実行する。

### B-3. カスケード

すべてのブランチが 1 つの working tree を共有するので、**厳密に逐次**で処理する。並行させると index と HEAD が壊れる。

各ブランチについて [手動 `--onto` カスケード](#手動---onto-カスケード)と同じ手順を適用し、成功したら `git push --force-with-lease origin HEAD` してから次へ進む。push 後は `adjust-pr-base` をインラインで実行する（gh コマンド数回で終わるので切り出さない）。

親が削除・squash merge されている場合は、rebase の**前**に `adjust-pr-base` を実行する。PR の base が有効なブランチを指していないと CI が走らない。

CI 監視はカスケードの途中では行わない。全ブランチを完走させてから [CI](#ci-upstream-first) でまとめて扱う。

---

## CI (upstream first)

gh-stack は CI を扱わない。どちらの Route でも、カスケード完走後にここを実行する。

`watch-ci` skill を**上流から下流の順に 1 ブランチずつ**呼び出す。各 PR の CI は自分の親との差分を検証するので、下流の変更が上流の CI に影響することはない。上流が通れば以後は安定する。逆に上流を直せば下流は必ず古くなるため、上流を確定させないまま下流を直すと手戻りになる。

先に全体の状態だけ見たいときは、read-only な `gh pr checks` を全 PR へ同時発行してよい。修正を伴う `watch-ci` の呼び出しは 1 ブランチずつ行う。

### 上流修正後の再カスケード

`watch-ci` が CI 失敗を直して新しいコミットを push すると、その下流が古くなる。

1. そのブランチより下だけを積み直す（Route A なら `gh stack rebase --upstack`、Route B なら手動で 1 つずつ）
2. push してから、その下流の `watch-ci` を改めて呼ぶ

停止条件:

- 全ブランチ CI pass → Report へ
- `watch-ci` が「PR の変更と無関係な失敗（flaky、インフラ）」と報告 → 記録して次のブランチへ
- 同一ブランチの再カスケードが 2 回を超えた → 停止して状況を報告する

---

## Report

```
## Stack Sync Report

Route: gh-stack (github.com)
Trunk: main

| Branch | PR | Rebase | Verify | Push | CI |
|--------|-----|--------|--------|------|-----|
| feat/auth-ui | #42 | ✅ clean | ✅ patch-id 一致 | ✅ | ✅ pass |
| feat/auth-api | #44 | ⚠️ conflict 2件解決 | ✅ patch-id 一致 | ✅ | ❌ lint (修正済み) |

Repair:
- gh stack の記録 base が古く 22 commits を replay しようとしたため abort し、--onto で積み直した
- gh stack push で metadata を再同期（needsRebase 全 false を確認）
```

報告に必ず含めるもの: 使った Route、復旧作業をしたならその内容と原因、検証の結果、未解決のまま残したもの。

## Edge Cases

### ブランチに open PR がない

スキップして警告する。ancestry には乗っているが PR がない（ローカル専用、PR 削除済み）。

### conflict を自動解決できない

そのブランチでカスケードを止める。どのブランチのどのファイルか、どこまで rebase 済みかを報告し、手動解決後に再開を申し出る。gh stack の途中なら `gh stack rebase --abort` で全ブランチを戻せる（worktree の制約は [症状 2](#症状-2---abort-が-worktree-で失敗する) を参照）。

### スタックの途中がマージされた

Route A では `gh stack rebase` / `sync` がマージ済みブランチを skip して自動で処理する。PR の base は GitHub 側が自動 retarget するので `adjust-pr-base` は多くの場合 no-op になる。Route B では `adjust-pr-base` を rebase の前に実行する。

## Boundaries

- このスキルは依存関係のある PR の同期・メンテナンスを扱う。新規スタックの作成や大きな PR の分割は扱わない。
  - 大きな PR/ブランチを stacked PR に分割するには `reorganize-diff` skill を使う
  - 大きな機能開発の stacked PR 計画を立てるには `plan-stacked-pr` skill を使う
  - これらが作ったスタックの継続的メンテナンス（カスケード rebase、CI 監視・修正、同期）は本スキルが担う
- gh stack のコマンド仕様・非対話フラグ・exit code は `gh-stack` skill が持つ。ここで重複して定義しない。`gh-stack` は vendored なので編集もしない
- conflict 解決は `resolve-merge-conflict`、PR base の修正は `adjust-pr-base`、CI は `watch-ci` と `fix-github-actions-ci` に委譲する
- カスケード中に新しいブランチ追加を頼まれたら、カスケードを完走させてから別途対応する
