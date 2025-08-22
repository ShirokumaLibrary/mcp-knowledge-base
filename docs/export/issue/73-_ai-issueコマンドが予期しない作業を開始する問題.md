---
id: 73
type: issue
title: "/ai-issueコマンドが予期しない作業を開始する問題"
status: Completed
priority: MEDIUM
tags: ["command","bug","ai-issue","ux"]
related: [84,43]
keywords: {"103":1,"search":1,"issue":1,"claude":0.56,"keyword":0.56}
embedding: "gICJgJSAgIeBioCAgICAgICAjoCPgICCiJaAgICAgICAgI2Aj4CAiaKagICAgICAgICGgJSAgI62koCAgICAgICAgICZgICNs4WAgICAgICAgICAm4CAhquOgICAgICAgICAgI2AgICXgoCAgICAgICAgoCagICBkoCAgICAgIA="
createdAt: 2025-08-22T13:32:44.000Z
updatedAt: 2025-08-22T13:32:44.000Z
---

# /ai-issueコマンドが予期しない作業を開始する問題

/ai-issueコマンドに引数を渡した際、イシュー作成ではなく意図しない作業を開始してしまう問題を修正

## AI Summary

/ai-issueコマンドが予期しない作業を開始する問題 /ai-issueコマンドに引数を渡した際、イシュー作成ではなく意図しない作業を開始してしまう問題を修正 ## 問題の詳細

`/ai-issue`コマンドの動作が不安定：
1. 引数を渡すと、イシュー作成ではなく作業を開始してしまう
2. コマンドの意図と実際の動作が一致しない

## 期待される動作

```bash
/ai-issue

## 問題の詳細

`/ai-issue`コマンドの動作が不安定：
1. 引数を渡すと、イシュー作成ではなく作業を開始してしまう
2. コマンドの意図と実際の動作が一致しない

## 期待される動作

```bash
/ai-issue                    # イシュー一覧表示
/ai-issue "説明文"           # 新規イシュー作成
/ai-issue 103                # イシュー詳細表示
/ai-issue 103 close          # ステータス更新
/ai-issue search "keyword"   # イシュー検索
```

## 修正内容

`.claude/commands/ai-issue.md`に以下の引数解析ルールを追加：

1. **引数なし** → イシュー一覧表示
2. **数値のみ** → イシュー詳細表示
3. **数値 + アクション** → ステータス更新
4. **"search" + キーワード** → 検索
5. **"export"** → エクスポート（特殊ケース）
6. **その他のテキスト** → 新規イシュー作成

### 追加した安全装置

作業リクエストのように見えるテキストの場合、確認プロンプトを表示：
```
"This looks like a work request. Should I create an issue for this, or did you mean to use `/ai-go` to start working?"
```

## 結果

- 意図しない作業開始を防止
- コマンドの動作が予測可能に
- ユーザーの意図を確認する仕組みを追加
