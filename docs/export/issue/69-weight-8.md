# キーワードweight 8ビット量子化実装

## Metadata

- **ID**: 69
- **Type**: issue
- **Status ID**: 19
- **Priority**: MEDIUM
- **Created**: Fri Aug 22 2025 22:32:44 GMT+0900 (Japan Standard Time)
- **Updated**: Fri Aug 22 2025 22:32:44 GMT+0900 (Japan Standard Time)

## Description

キーワードの重みをFloat型から8ビット量子化（Int型で0-255）に変更。メモリ効率を75%改善し、SQLiteの自動最適化により1-2バイトで格納

## Content

## 背景
現在ItemKeyword.weightはFloat型（32ビット）だが、キーワードの重みには256段階で十分な精度。

## 実装内容（キャンセル済み）
~~1. スキーマ変更: Float → Int (0-255)~~
~~2. 量子化関数: 0.0-1.0 → 0-255~~
~~3. 逆量子化関数: 0-255 → 0.0-1.0~~
~~4. マイグレーション: 既存データの変換~~

## キャンセル理由
- 複雑性の増加に対してメリットが限定的
- 既存データの変換リスク
- Float型で十分実用的

## 技術的詳細
- UNSIGNED型は使用不可（SQLite/Prisma制約）
- Int型で0-255範囲を運用する設計だった
- アプリケーション層で範囲制約が必要だった
