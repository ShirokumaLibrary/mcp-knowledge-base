---
id: 50
type: issue
title: "Embeddingのエクスポートが消えてしまっているので戻す"
status: Closed
priority: HIGH
description: "エクスポート機能でembeddingフィールドが出力されなくなっている問題を修正する"
aiSummary: "Embeddingのエクスポートが消えてしまっているので戻す エクスポート機能でembeddingフィールドが出力されなくなっている問題を修正する ## 問題\nエクスポート機能において、以前は出力されていたembeddingフィールドがエクスポートされなくなっている。\n\n## 影響\n- データの完全性が保たれない\n- インポート時にembedding情報が失われる\n- AI検索機能の精度が低下する"
tags: ["embedding","export","regression","bug"]
related: [65,113]
keywords: {"embedding":1}
embedding: "gICAgICAgICAsoCAgICAgICAgICAgICAgMCAgICAgICAgICAgICAgIC5gICAgICAgICAgICAgICAv4CAgICAgICAgICAgICAgKmAgICAgICAgICAgICAgICKgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJOAgICAgIA="
createdAt: 2025-08-29T07:33:23.000Z
updatedAt: 2025-08-29T07:33:23.000Z
---

v0.8.4で修正済み。v0.9.0では構造が大きく変わるためクローズ。