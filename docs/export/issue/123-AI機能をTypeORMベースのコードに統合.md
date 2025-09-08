---
id: 123
type: issue
title: "AI機能をTypeORMベースのコードに統合"
status: Completed
priority: HIGH
description: "PrismaベースのAI機能（EnhancedAIService）をTypeORMベースのMCPサーバーに統合する"
tags: ["typeorm","critical","bug","migration"]
related: [98]
createdAt: 2025-08-22T23:37:15.000Z
updatedAt: 2025-08-22T23:59:15.000Z
---

# AI機能をTypeORMベースのコードに統合

## 現状分析
1. **データベース**: AI関連フィールド（aiSummary、embedding等）が存在
2. **MCP Server**: TypeORMを使用、AI機能は未統合
3. **AI Service**: PrismaClientを使用している

## 必要な作業
1. **EnhancedAIServiceのTypeORM対応**
   - PrismaClientをTypeORMのDataSourceに変更
   - 全メソッドをTypeORMベースに書き換え

2. **MCP ServerへのAI統合**
   - create_item時にAIエンリッチメント実行
   - update_item時の再エンリッチメント

3. **依存サービスの移行**
   - data-storage.ts
   - similarity-search.ts
   - unified-search.ts
   - graph-service.ts

## 優先順位
1. EnhancedAIServiceの基本機能をTypeORM対応
2. create_itemへの統合
3. 検索機能の統合

## 技術的詳細
- ClaudeInterfaceは変更不要（CLIベース）
- EmbeddingManagerは変更不要（独立したロジック）
- DataStorageとSimilaritySearchはTypeORM対応が必要