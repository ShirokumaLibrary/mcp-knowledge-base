# /ai-issueコマンドが予期しない作業を開始する問題

## Metadata

- **ID**: 73
- **Type**: issue
- **Status ID**: 13
- **Priority**: MEDIUM
- **Created**: Fri Aug 22 2025 22:32:44 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:44 GMT+0900 (Japan Standard Time)

## Description

/ai-issueコマンドに引数を渡した際、イシュー作成ではなく意図しない作業を開始してしまう問題を修正

## Content

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
