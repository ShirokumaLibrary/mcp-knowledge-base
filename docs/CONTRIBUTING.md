# Contributing to Shirokuma MCP Knowledge Base

## 🎯 プロジェクトへの貢献について

Shirokuma MCP Knowledge Base v0.8.0への貢献を歓迎します！このガイドでは、効率的に貢献するための手順とガイドラインを説明します。

## 📋 貢献の種類

### コードの貢献
- バグ修正
- 新機能の実装
- パフォーマンス改善
- テストの追加・改善

### ドキュメントの貢献
- ドキュメントの改善
- 翻訳
- チュートリアル作成
- 使用例の追加

### その他の貢献
- バグ報告
- 機能リクエスト
- コードレビュー
- コミュニティサポート

## 🚀 開発環境のセットアップ

### 必要条件
- Node.js 18以上
- npm 9以上
- Git

### セットアップ手順

```bash
# リポジトリのフォーク
# GitHubでForkボタンをクリック

# クローン
git clone https://github.com/your-username/shirokuma-mcp-kb.git
cd shirokuma-mcp-kb

# アップストリームの設定
git remote add upstream https://github.com/original-org/shirokuma-mcp-kb.git

# 依存関係のインストール
npm install

# データベースのセットアップ
npx prisma migrate dev

# 開発サーバーの起動
npm run dev

# テストの実行
npm test
```

## 🌳 ブランチ戦略

### ブランチ命名規則

```
feature/機能名     - 新機能
bugfix/バグ名      - バグ修正
hotfix/緊急修正    - 緊急修正
docs/ドキュメント名 - ドキュメント更新
refactor/対象      - リファクタリング
test/テスト名      - テスト追加
```

### ワークフロー

```bash
# 最新のmainを取得
git checkout main
git pull upstream main

# 新しいブランチを作成
git checkout -b feature/new-feature

# 変更を実装
# ... コーディング ...

# テストを実行
npm test

# リントチェック
npm run lint

# コミット
git add .
git commit -m "feat: add new feature"

# プッシュ
git push origin feature/new-feature

# Pull Requestを作成
```

## 📝 コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/)に従います：

### 形式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### タイプ
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードスタイル変更（機能に影響なし）
- `refactor`: リファクタリング
- `perf`: パフォーマンス改善
- `test`: テスト追加・修正
- `build`: ビルドシステム変更
- `ci`: CI設定変更
- `chore`: その他の変更

### 例
```bash
feat(cli): add export command

Add new export command to export items in various formats.
Supports JSON, CSV, and Markdown formats.

Closes #123
```

## 🧪 テスト要件

### テストカバレッジ
- 新機能: 90%以上
- バグ修正: 該当箇所のテスト追加必須
- 全体: 85%以上を維持

### テストの種類
```typescript
// 単体テスト
describe('ItemService', () => {
  it('should create an item', async () => {
    // テスト実装
  });
});

// 統合テスト
describe('MCP Integration', () => {
  it('should handle create_item request', async () => {
    // テスト実装
  });
});

// E2Eテスト
describe('CLI E2E', () => {
  it('should create item via CLI', async () => {
    // テスト実装
  });
});
```

## 📐 コーディング規約

### TypeScript
- 厳格な型定義
- インターフェース優先
- 明示的な戻り値型

### ファイル構成
```typescript
// ✅ Good
export interface ItemService {
  create(data: CreateItemDto): Promise<Item>;
}

export class ItemServiceImpl implements ItemService {
  async create(data: CreateItemDto): Promise<Item> {
    // 実装
  }
}

// ❌ Bad
export class ItemService {
  async create(data: any) {
    // 実装
  }
}
```

### エラーハンドリング
```typescript
// カスタムエラーを使用
throw new ValidationError('Title is required', {
  field: 'title',
  code: 'REQUIRED'
});
```

## 🔍 コードレビューチェックリスト

### 機能
- [ ] 要件を満たしている
- [ ] エッジケースを考慮している
- [ ] 後方互換性を維持している

### コード品質
- [ ] 読みやすく理解しやすい
- [ ] DRY原則に従っている
- [ ] SOLID原則に従っている

### テスト
- [ ] 適切なテストがある
- [ ] テストカバレッジが十分
- [ ] テストが通る

### ドキュメント
- [ ] コードコメントが適切
- [ ] APIドキュメントが更新されている
- [ ] 変更履歴が記載されている

### セキュリティ
- [ ] 入力検証がある
- [ ] SQLインジェクション対策
- [ ] XSS対策

## 📊 Pull Request テンプレート

```markdown
## 概要
<!-- 変更の簡潔な説明 -->

## 変更内容
<!-- 詳細な変更内容のリスト -->
- 
- 
- 

## 関連Issue
<!-- 関連するIssue番号 -->
Closes #

## テスト
<!-- テスト方法と結果 -->
- [ ] 単体テスト追加
- [ ] 統合テスト追加
- [ ] 手動テスト完了

## チェックリスト
- [ ] コードが自己文書化されている
- [ ] テストを追加した
- [ ] ドキュメントを更新した
- [ ] 破壊的変更はない
- [ ] リントチェックが通る
- [ ] テストが全て通る

## スクリーンショット
<!-- UIの変更がある場合 -->
```

## 🐛 Issue テンプレート

### バグ報告
```markdown
## 概要
<!-- バグの簡潔な説明 -->

## 再現手順
1. 
2. 
3. 

## 期待される動作
<!-- 本来の動作 -->

## 実際の動作
<!-- 現在の動作 -->

## 環境
- OS: 
- Node.js: 
- npm: 
- Version: 

## ログ
<!-- エラーログがあれば -->
```

### 機能リクエスト
```markdown
## 概要
<!-- 機能の簡潔な説明 -->

## 動機
<!-- なぜこの機能が必要か -->

## 詳細説明
<!-- 機能の詳細な説明 -->

## 代替案
<!-- 検討した代替案 -->

## 追加情報
<!-- その他の関連情報 -->
```

## 🔒 セキュリティ脆弱性の報告

セキュリティ脆弱性を発見した場合は、公開Issueで報告せず、以下のメールアドレスに直接連絡してください：

security@shirokuma-mcp.example.com

以下の情報を含めてください：
- 脆弱性の種類
- 影響を受けるバージョン
- 再現手順
- 可能であれば修正案

## 📜 ライセンスと著作権

### ライセンス
このプロジェクトはMITライセンスの下で公開されています。

### 貢献者ライセンス同意
Pull Requestを送信することで、あなたの貢献がMITライセンスの下で公開されることに同意したものとみなされます。

### 著作権
```
Copyright (c) 2024 Shirokuma MCP Knowledge Base Contributors
```

## 🌟 行動規範

### 私たちの約束
- 歓迎的で包括的な環境の維持
- 建設的な批判の受け入れ
- コミュニティの最善を優先
- 他のコミュニティメンバーへの共感

### 禁止行為
- ハラスメント
- 差別的な言動
- 個人攻撃
- プライバシー侵害

## 📚 リソース

### ドキュメント
- [README](./README.md)
- [API仕様](./specifications/02-api-spec.md)
- [アーキテクチャ設計](./design/01-architecture-design.md)

### 開発ツール
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/)
- [Vitest](https://vitest.dev/)
- [MCP SDK](https://modelcontextprotocol.io/)

### コミュニティ
- [GitHub Discussions](https://github.com/shirokuma-mcp/discussions)
- [Discord Server](https://discord.gg/shirokuma)
- [Blog](https://blog.shirokuma-mcp.example.com)

## 🏆 貢献者の認識

### 貢献者一覧
すべての貢献者は[CONTRIBUTORS.md](./CONTRIBUTORS.md)に記載されます。

### 貢献レベル
- 🥉 Bronze: 1-5 contributions
- 🥈 Silver: 6-20 contributions  
- 🥇 Gold: 21-50 contributions
- 💎 Diamond: 50+ contributions

## ❓ よくある質問

### Q: 初めての貢献でも大丈夫ですか？
A: はい！`good first issue`ラベルの付いたIssueから始めることをお勧めします。

### Q: 質問がある場合はどうすれば？
A: GitHub Discussionsで質問してください。コミュニティが喜んでサポートします。

### Q: マージまでどのくらいかかりますか？
A: 通常、Pull Requestは1週間以内にレビューされます。

### Q: 英語が苦手でも貢献できますか？
A: はい！日本語でのIssueやPull Requestも歓迎します。

## 📮 連絡先

- 一般的な質問: GitHub Discussions
- バグ報告: GitHub Issues
- セキュリティ: security@shirokuma-mcp.example.com
- その他: contact@shirokuma-mcp.example.com

---

**ありがとうございます！** あなたの貢献がShirokuma MCP Knowledge Baseをより良いものにします。🐻‍❄️