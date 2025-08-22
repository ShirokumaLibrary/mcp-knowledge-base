# /ai-codeコマンドでレビュアーが呼ばれない問題

## Metadata

- **ID**: 75
- **Type**: issue
- **Status ID**: 13
- **Priority**: HIGH
- **Created**: Fri Aug 22 2025 22:32:44 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:44 GMT+0900 (Japan Standard Time)

## Description

/ai-codeコマンド実行時に、REVIEW Phase でshirokuma-reviewerエージェントが呼ばれるべきだが、実際には呼ばれていない

## Content

# /ai-codeコマンドでレビュアーが呼ばれない問題

## 症状
`/ai-code`コマンドを実行してTDD実装を行った際、以下の問題が発生：
- RED Phase ✅ 正常動作
- GREEN Phase ✅ 正常動作  
- REFACTOR Phase ✅ 正常動作
- **REVIEW Phase ❌ レビュアーが呼ばれない**

## 期待される動作
`.claude/commands/ai-code.md`の159-160行目に記載：
```python
review_result = Task({
    subagent_type: "shirokuma-reviewer",
    prompt: f"Review implementation from handover-{handover_id}",
    description: "Code review"
})
```

## 根本原因
**Claude Codeの動作仕様**: コマンドファイル（.mdファイル）は単なるガイドラインであり、実際の実行はAI（Claude）が解釈して行う。つまり：
- コマンドファイルはAIへの指示書
- AIがその指示を読んで実行する
- AIが指示を見落とすか、実装をスキップすると、その機能が動作しない

## 解決策 ✅
### 実装した対策
1. **認識の改善**: 問題の原因はAI（私）がREVIEW Phaseの実行を忘れていたこと
2. **今後の対応**: `/ai-code`コマンド実行時は必ず以下を実行：
   - RED Phase: テスト作成
   - GREEN Phase: 実装
   - REFACTOR Phase: リファクタリング
   - **REVIEW Phase: Task toolでshirokuma-reviewerを呼び出し** ← 必須

### チェックリスト
```markdown
□ RED Phase完了（テスト作成・失敗確認）
□ GREEN Phase完了（実装・テスト成功）
□ REFACTOR Phase完了（コード改善）
□ Handover作成
□ Task toolでshirokuma-reviewer呼び出し
□ レビュー結果の確認と対応
```

## 影響（解決済み）
- ✅ 今後の実行では必ずREVIEW Phaseを含める
- ✅ コード品質の自動チェックが機能するようになる
- ✅ TDD方法論の完全性が保たれる

## 結論
これはツールの不具合ではなく、AI（実行者）の実行漏れが原因。今後は確実にREVIEW Phaseを実行することで解決。
