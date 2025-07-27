# セキュリティガイド

## 概要

Shirokuma MCPナレッジベースは、データとシステムを保護するために多層防御アプローチを実装しています。

## セキュリティアーキテクチャ

### 防御の層

```
┌─────────────────────────────────────────────────────┐
│                   入力層                             │
│          (サニタイゼーション & バリデーション)          │
├─────────────────────────────────────────────────────┤
│                アプリケーション層                     │
│           (レート制限 & アクセス制御)                 │
├─────────────────────────────────────────────────────┤
│                  データ層                            │
│           (SQLインジェクション防止)                   │
├─────────────────────────────────────────────────────┤
│                  出力層                              │
│            (機密データマスキング)                     │
└─────────────────────────────────────────────────────┘
```

## セキュリティ機能

### 1. 入力サニタイゼーション

全てのユーザー入力は使用前に検証およびサニタイズされます。

**実装:**
```typescript
import { InputSanitizer } from './security/input-sanitizer.js';

// 文字列のサニタイズ
const sanitizedTitle = InputSanitizer.sanitizeString(
  userInput.title, 
  'title',
  { maxLength: 200 }
);

// SQLインジェクション防止
const sanitizedQuery = InputSanitizer.sanitizeSearchQuery(
  userInput.query
);

// パストラバーサル防止
const sanitizedPath = InputSanitizer.sanitizePath(
  userInput.path
);
```

**保護対象:**
- SQLインジェクション
- XSS（クロスサイトスクリプティング）
- パストラバーサル
- コマンドインジェクション

### 2. レート制限

トークンバケットアルゴリズムを使用してAPI乱用を防止。

**設定:**
```typescript
const rateLimiter = new RateLimiter({
  windowMs: 60000,      // 1分
  maxRequests: 60,      // 最大60リクエスト
  keyGenerator: (req) => req.clientId
});
```

**プリセット:**
- **通常**: 1分あたり60リクエスト
- **厳格**: 1分あたり20リクエスト
- **緩和**: 1分あたり120リクエスト

### 3. アクセス制御（RBAC）

ロールベースアクセス制御で操作を制限。

**ロール階層:**
```typescript
enum Role {
  ADMIN = 'admin',        // 全権限
  EDITOR = 'editor',      // 作成、読取、更新
  VIEWER = 'viewer'       // 読取のみ
}
```

**パーミッション:**
```typescript
const permissions = {
  'create_item': [Role.ADMIN, Role.EDITOR],
  'update_item': [Role.ADMIN, Role.EDITOR],
  'delete_item': [Role.ADMIN],
  'get_items': [Role.ADMIN, Role.EDITOR, Role.VIEWER]
};
```

### 4. データ暗号化

**保存時:**
- 機密フィールドは暗号化して保存
- AES-256暗号化を使用
- 環境変数に暗号化キーを保存

**転送時:**
- HTTPSが必須
- TLS 1.2以上

### 5. 監査ログ

全てのセキュリティ関連イベントをログ記録。

**ログされるイベント:**
- 認証試行
- アクセス拒否
- レート制限違反
- 不審な入力パターン

**ログフォーマット:**
```json
{
  "timestamp": "2025-01-27T10:00:00Z",
  "event": "access_denied",
  "user": "user123",
  "resource": "delete_item",
  "reason": "insufficient_permissions",
  "ip": "192.168.1.1"
}
```

## セキュリティ設定

### 環境変数

```bash
# 暗号化キー（32文字）
ENCRYPTION_KEY=your-32-character-encryption-key

# レート制限設定
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=60

# セキュリティヘッダー
SECURITY_HEADERS_ENABLED=true

# 監査ログ
AUDIT_LOG_ENABLED=true
AUDIT_LOG_PATH=/var/log/shirokuma/audit.log
```

### 設定ファイル

```typescript
// config/security.ts
export const securityConfig = {
  sanitization: {
    enabled: true,
    maxStringLength: 10000,
    maxArrayLength: 100
  },
  rateLimit: {
    enabled: true,
    trustProxy: true
  },
  accessControl: {
    enabled: true,
    defaultRole: Role.VIEWER
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'pbkdf2'
  }
};
```

## ベストプラクティス

### 1. 最小権限の原則

- ユーザーには必要最小限の権限のみ付与
- デフォルトでアクセスを拒否
- 定期的に権限をレビュー

### 2. 深層防御

- 単一の防御層に依存しない
- 複数のセキュリティ対策を組み合わせる
- 各層で独立して検証

### 3. セキュアなデフォルト

- セキュリティ機能はデフォルトで有効
- 安全でない設定には明示的なオプトインが必要
- 設定ミスを防ぐ

### 4. 検証とサニタイゼーション

```typescript
// 良い例：複数層の検証
function processUserInput(input: unknown): ProcessedData {
  // 1. 型チェック
  if (typeof input !== 'object' || !input) {
    throw new ValidationError('Invalid input type');
  }

  // 2. スキーマ検証
  const validated = schema.parse(input);

  // 3. ビジネスルール検証
  if (!isValidBusinessRule(validated)) {
    throw new BusinessError('Invalid business rule');
  }

  // 4. サニタイゼーション
  return sanitizeData(validated);
}
```

### 5. エラーハンドリング

```typescript
// 良い例：機密情報を漏らさない
try {
  await processRequest(request);
} catch (error) {
  logger.error('Request processing failed', {
    error: error.message,
    requestId: request.id
    // ユーザーデータや内部詳細は含めない
  });
  
  return {
    error: 'Request processing failed',
    code: 'PROCESSING_ERROR'
    // スタックトレースや内部エラーは返さない
  };
}
```

## 脆弱性対応

### 脆弱性の報告

セキュリティ脆弱性を発見した場合：

1. **公開しない**: GitHubイシューやパブリックフォーラムに投稿しない
2. **メールで報告**: shirokuma@gadget.to
3. **詳細を提供**:
   - 脆弱性の説明
   - 再現手順
   - 潜在的な影響
   - 提案される修正（もしあれば）

### 対応プロセス

1. **確認**: 24時間以内に受信確認
2. **評価**: 72時間以内に深刻度評価
3. **修正**: 深刻度に基づいて修正を開発
4. **通知**: 修正後、報告者に通知
5. **開示**: 責任ある開示の調整

## セキュリティチェックリスト

### デプロイメント前

- [ ] 全ての環境変数が設定されている
- [ ] セキュリティ設定が有効
- [ ] 依存関係が最新
- [ ] セキュリティテストが通過
- [ ] 監査ログが設定されている

### 定期的なレビュー

- [ ] 依存関係の脆弱性スキャン
- [ ] アクセスログのレビュー
- [ ] 異常なパターンの監視
- [ ] セキュリティ設定の検証
- [ ] バックアップの確認

## 依存関係のセキュリティ

### 自動スキャン

```bash
# npm audit
npm audit

# 修正を適用
npm audit fix

# 詳細レポート
npm audit --json > audit-report.json
```

### 依存関係の更新

```bash
# 古い依存関係をチェック
npm outdated

# 安全な更新
npm update

# メジャーアップデート（慎重に）
npm install package@latest
```

## インシデント対応

### インシデント発生時

1. **隔離**: 影響を受けたシステムを隔離
2. **評価**: 影響範囲を評価
3. **封じ込め**: 拡散を防止
4. **根絶**: 脅威を除去
5. **回復**: システムを復旧
6. **教訓**: インシデントから学習

### 連絡先

- **セキュリティチーム**: shirokuma@gadget.to
- **緊急連絡**: [緊急連絡手順に従う]

## コンプライアンス

### データ保護

- 個人データの最小限の収集
- 明確な保持ポリシー
- ユーザーの権利の尊重
- データ削除機能

### ログ保持

- セキュリティログ: 90日
- アクセスログ: 30日
- エラーログ: 7日
- 監査ログ: 1年