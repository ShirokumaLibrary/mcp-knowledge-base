---
id: 133
type: steering
title: "Steering: Language Rules"
status: Open
priority: HIGH
description: "言語使用ルールとコミュニケーション規約"
aiSummary: "Language usage rules for multilingual development environment specifying Japanese for user communication and English for technical code elements"
tags: ["steering","inclusion:always","language","communication"]
keywords: {"language":0.9,"japanese":0.9,"code":0.8,"rule":0.8,"communication":0.8}
concepts: {"internationalization":0.9,"communication":0.9,"documentation":0.8,"programming":0.8,"localization":0.8}
embedding: "jIuAgICAgICYgICAgpCAopKDgICAgICAjoCFgIyUgK6JgICAgICAgIyAgICTj4CqgYSAgICAgICAgIiAkoWApIGNgICAgICAhYCRgImAgJqJkYCAgICAgI+AlICBg4CTko6AgICAgICZgI2AgYCAiZORgICAgICAnYCDgICGgJA="
createdAt: 2025-08-23T01:58:38.000Z
updatedAt: 2025-08-23T02:07:23.000Z
---

# 言語使用ルール

## チャット応答
**必ず日本語で応答すること。** ユーザーとの対話はすべて日本語で行う。

## コード記述
- **コメント**: 英語で記述 (`// Check validation`, `/* Process data */`)
- **エラーメッセージ**: 英語で記述 (`throw new Error("Invalid input")`)
- **変数名・関数名**: 英語で記述 (`getUserData()`, `isValid`)
- **ログメッセージ**: 英語で記述 (`console.log("Processing started")`)

## ドキュメント
- **技術文書**: 基本的に英語で作成（README.md, API docs等）
- **日本語版**: 必要に応じて別ファイルとして作成（README.ja.md等）
- **MCP内のドキュメント**: contentやtitleやdescriptionは日本語、タグは基本英語で日本語でも可能