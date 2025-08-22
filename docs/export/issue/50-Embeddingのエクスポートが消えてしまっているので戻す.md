---
id: 50
type: issue
title: "Embeddingのエクスポートが消えてしまっているので戻す"
status: Closed
priority: HIGH
tags: ["embedding","bug","export","regression"]
related: [113,65]
keywords: {"embedding":1}
embedding: "gICAgICAgICAsoCAgICAgICAgICAgICAgMCAgICAgICAgICAgICAgIC5gICAgICAgICAgICAgICAv4CAgICAgICAgICAgICAgKmAgICAgICAgICAgICAgICKgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJOAgICAgIA="
createdAt: 2025-08-22T13:32:43.000Z
updatedAt: 2025-08-22T13:32:43.000Z
---

# Embeddingのエクスポートが消えてしまっているので戻す

エクスポート機能でembeddingフィールドが出力されなくなっている問題を修正する

## AI Summary

Embeddingのエクスポートが消えてしまっているので戻す エクスポート機能でembeddingフィールドが出力されなくなっている問題を修正する ## 問題
エクスポート機能において、以前は出力されていたembeddingフィールドがエクスポートされなくなっている。

## 影響
- データの完全性が保たれない
- インポート時にembedding情報が失われる
- AI検索機能の精度が低下する

v0.8.4で修正済み。v0.9.0では構造が大きく変わるためクローズ。
