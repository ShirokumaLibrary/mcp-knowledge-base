# デプロイメントガイド

## 1. 概要

本ドキュメントでは、Shirokuma MCP Knowledge Base v0.8.0のデプロイメント手順を説明します。本アプリケーションは単一ユーザー向けのローカルアプリケーションとして設計されており、MCP over stdioプロトコルを使用してClaude Desktopと連携します。

## 2. デプロイメント対象環境

### 2.1 対象プラットフォーム

| プラットフォーム | サポート状況 | 備考 |
|-----------------|-------------|------|
| macOS | ✅ 推奨 | Claude Desktop標準サポート |
| Linux (Ubuntu 20.04+) | ✅ サポート | 手動セットアップが必要 |
| Windows (WSL2) | ✅ サポート | WSL2環境での実行 |
| Windows (Native) | ⚠️ 限定サポート | パス区切り文字の問題あり |

### 2.2 前提条件

| 要件 | バージョン | 確認方法 |
|------|-----------|----------|
| Node.js | 18.0.0以上 | `node --version` |
| npm | 9.0.0以上 | `npm --version` |
| Claude Desktop | 最新版 | アプリケーション確認 |
| Git | 2.x以上 | `git --version` |

## 3. ローカルデプロイメント

### 3.1 プロジェクトクローン

```bash
# リポジトリクローン
git clone https://github.com/your-org/shirokuma-mcp-kb.git
cd shirokuma-mcp-kb

# ブランチ確認（v0.8.0ブランチを使用）
git checkout v0.8.0
```

### 3.2 依存関係インストール

```bash
# 依存関係のインストール
npm install

# Prismaクライアント生成
npx prisma generate

# TypeScriptビルド
npm run build
```

### 3.3 データベースセットアップ

```bash
# データディレクトリ作成
mkdir -p data

# 環境変数設定
cp .env.example .env

# .envファイル編集
DATABASE_URL="file:./data/shirokuma.db"
LOG_LEVEL="info"
NODE_ENV="production"
```

```bash
# データベーススキーマ適用
npx prisma db push

# 初期データの投入
npm run db:seed
```

### 3.4 動作確認

```bash
# アプリケーション起動テスト
npm start -- --version

# CLIモードテスト
npm start -- list --type tasks

# MCPサーバーモードテスト (stdio)
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | npm start -- --serve
```

## 4. Claude Desktop連携設定

### 4.1 MCP設定ファイル

Claude Desktopの設定ファイルに以下を追加：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "shirokuma-knowledge-base": {
      "command": "node",
      "args": [
        "/absolute/path/to/shirokuma-mcp-kb/dist/index.js",
        "--serve"
      ],
      "cwd": "/absolute/path/to/shirokuma-mcp-kb",
      "env": {
        "NODE_ENV": "production",
        "DATABASE_URL": "file:./data/shirokuma.db",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 4.2 設定確認スクリプト

```bash
# scripts/check-mcp-config.sh
#!/bin/bash

echo "🔍 Checking MCP configuration..."

# Claude Desktop設定ファイルの場所を検出
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_PATH="$HOME/.config/claude/claude_desktop_config.json"
else
    CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
fi

if [[ -f "$CONFIG_PATH" ]]; then
    echo "✅ Claude Desktop config found: $CONFIG_PATH"
    
    # shirokuma-knowledge-base設定の確認
    if jq -e '.mcpServers."shirokuma-knowledge-base"' "$CONFIG_PATH" > /dev/null 2>&1; then
        echo "✅ shirokuma-knowledge-base MCP server configured"
        
        # パスの確認
        CONFIGURED_PATH=$(jq -r '.mcpServers."shirokuma-knowledge-base".args[0]' "$CONFIG_PATH")
        if [[ -f "$CONFIGURED_PATH" ]]; then
            echo "✅ MCP server path exists: $CONFIGURED_PATH"
        else
            echo "❌ MCP server path not found: $CONFIGURED_PATH"
            exit 1
        fi
    else
        echo "❌ shirokuma-knowledge-base not configured in Claude Desktop"
        exit 1
    fi
else
    echo "❌ Claude Desktop config not found: $CONFIG_PATH"
    exit 1
fi

echo "✅ MCP configuration check completed successfully"
```

```bash
# 実行権限付与
chmod +x scripts/check-mcp-config.sh

# 設定確認
./scripts/check-mcp-config.sh
```

### 4.3 Claude Desktop再起動

```bash
# macOS
killall Claude || true
open -a Claude

# Linux (例: Electronアプリの場合)
pkill claude || true
claude &

# Windows
# タスクマネージャーからClaude Desktopを終了
# スタートメニューからClaude Desktopを再起動
```

## 5. プロダクション最適化

### 5.1 パフォーマンス設定

```bash
# .env.production
NODE_ENV="production"
LOG_LEVEL="warn"
DATABASE_URL="file:./data/shirokuma.db"

# SQLiteパフォーマンス最適化
PRAGMA_JOURNAL_MODE="WAL"
PRAGMA_SYNCHRONOUS="NORMAL"
PRAGMA_CACHE_SIZE="10000"
PRAGMA_TEMP_STORE="MEMORY"
```

### 5.2 データベース最適化

```bash
# scripts/optimize-database.sh
#!/bin/bash

echo "🔧 Optimizing SQLite database..."

# データベースパス
DB_PATH="./data/shirokuma.db"

if [[ -f "$DB_PATH" ]]; then
    # VACUUM実行（データベースの最適化）
    sqlite3 "$DB_PATH" "VACUUM;"
    
    # インデックス再構築
    sqlite3 "$DB_PATH" "REINDEX;"
    
    # 統計情報更新
    sqlite3 "$DB_PATH" "ANALYZE;"
    
    echo "✅ Database optimization completed"
else
    echo "❌ Database not found: $DB_PATH"
    exit 1
fi
```

### 5.3 ログローテーション

```bash
# scripts/setup-log-rotation.sh
#!/bin/bash

echo "📋 Setting up log rotation..."

# ログディレクトリ作成
mkdir -p logs

# logrotate設定ファイル作成
cat > logs/shirokuma-logrotate << 'EOF'
./logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644
}
EOF

echo "✅ Log rotation configured"
echo "Run 'logrotate -f logs/shirokuma-logrotate' to test"
```

## 6. 自動起動設定

### 6.1 systemd設定 (Linux)

```bash
# /etc/systemd/system/shirokuma-mcp.service
[Unit]
Description=Shirokuma MCP Knowledge Base
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/shirokuma-mcp-kb
Environment=NODE_ENV=production
Environment=DATABASE_URL=file:./data/shirokuma.db
Environment=LOG_LEVEL=info
ExecStart=/usr/bin/node dist/index.js --serve
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=shirokuma-mcp

[Install]
WantedBy=multi-user.target
```

```bash
# systemdサービス有効化
sudo systemctl daemon-reload
sudo systemctl enable shirokuma-mcp
sudo systemctl start shirokuma-mcp

# ステータス確認
sudo systemctl status shirokuma-mcp
```

### 6.2 launchd設定 (macOS)

```bash
# ~/Library/LaunchAgents/com.shirokuma.mcp-kb.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.shirokuma.mcp-kb</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/your-username/shirokuma-mcp-kb/dist/index.js</string>
        <string>--serve</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/your-username/shirokuma-mcp-kb</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>DATABASE_URL</key>
        <string>file:./data/shirokuma.db</string>
        <key>LOG_LEVEL</key>
        <string>info</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/your-username/shirokuma-mcp-kb/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/your-username/shirokuma-mcp-kb/logs/stderr.log</string>
</dict>
</plist>
```

```bash
# launchdサービス登録
launchctl load ~/Library/LaunchAgents/com.shirokuma.mcp-kb.plist

# サービス開始
launchctl start com.shirokuma.mcp-kb

# ステータス確認
launchctl list | grep shirokuma
```

## 7. セキュリティ設定

### 7.1 ファイル権限設定

```bash
# scripts/set-permissions.sh
#!/bin/bash

echo "🔒 Setting security permissions..."

# データベースファイルの権限設定
chmod 600 data/*.db 2>/dev/null || true
chmod 700 data/

# 設定ファイルの権限設定  
chmod 600 .env

# スクリプトファイルの権限設定
chmod 755 scripts/*.sh

# ログディレクトリの権限設定
chmod 755 logs/
chmod 644 logs/*.log 2>/dev/null || true

echo "✅ Permissions set successfully"
```

### 7.2 データベース暗号化（オプション）

```bash
# SQLite暗号化拡張の使用例
# 注意: 本番環境での使用は要検討

# .env.production
DATABASE_URL="file:./data/shirokuma.db?password=your-secret-key"
```

## 8. バックアップ戦略

### 8.1 自動バックアップスクリプト

```bash
# scripts/backup-database.sh
#!/bin/bash

echo "💾 Starting database backup..."

# バックアップディレクトリ
BACKUP_DIR="./backups"
DB_PATH="./data/shirokuma.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/shirokuma_backup_$DATE.db"

# バックアップディレクトリ作成
mkdir -p "$BACKUP_DIR"

if [[ -f "$DB_PATH" ]]; then
    # SQLiteバックアップ（オンラインバックアップ）
    sqlite3 "$DB_PATH" ".backup $BACKUP_PATH"
    
    if [[ -f "$BACKUP_PATH" ]]; then
        # バックアップファイルの圧縮
        gzip "$BACKUP_PATH"
        echo "✅ Backup created: ${BACKUP_PATH}.gz"
        
        # 古いバックアップを削除（7日以上前）
        find "$BACKUP_DIR" -name "shirokuma_backup_*.db.gz" -mtime +7 -delete
        echo "✅ Old backups cleaned up"
    else
        echo "❌ Backup failed"
        exit 1
    fi
else
    echo "❌ Database file not found: $DB_PATH"
    exit 1
fi
```

### 8.2 cron設定（Linux/macOS）

```bash
# crontabに自動バックアップを追加
crontab -e

# 毎日午前3時にバックアップを実行
0 3 * * * cd /path/to/shirokuma-mcp-kb && ./scripts/backup-database.sh >> logs/backup.log 2>&1
```

### 8.3 バックアップからの復元

```bash
# scripts/restore-database.sh
#!/bin/bash

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

BACKUP_FILE="$1"
DB_PATH="./data/shirokuma.db"

echo "🔄 Restoring database from backup..."

if [[ -f "$BACKUP_FILE" ]]; then
    # 既存データベースをバックアップ
    if [[ -f "$DB_PATH" ]]; then
        mv "$DB_PATH" "${DB_PATH}.backup.$(date +%s)"
        echo "📦 Existing database backed up"
    fi
    
    # バックアップファイルが圧縮されている場合
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" > "$DB_PATH"
    else
        cp "$BACKUP_FILE" "$DB_PATH"
    fi
    
    echo "✅ Database restored from: $BACKUP_FILE"
    
    # 整合性チェック
    if sqlite3 "$DB_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
        echo "✅ Database integrity check passed"
    else
        echo "❌ Database integrity check failed"
        exit 1
    fi
else
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi
```

## 9. 監視とヘルスチェック

### 9.1 ヘルスチェックスクリプト

```bash
# scripts/health-check.sh
#!/bin/bash

echo "🏥 Running health check..."

# プロセスチェック
if pgrep -f "shirokuma.*--serve" > /dev/null; then
    echo "✅ MCP server process is running"
else
    echo "❌ MCP server process not found"
    exit 1
fi

# データベース接続チェック
DB_PATH="./data/shirokuma.db"
if [[ -f "$DB_PATH" ]]; then
    if sqlite3 "$DB_PATH" "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Database is accessible"
    else
        echo "❌ Database connection failed"
        exit 1
    fi
else
    echo "❌ Database file not found"
    exit 1
fi

# ディスク容量チェック
DISK_USAGE=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
if [[ $DISK_USAGE -lt 90 ]]; then
    echo "✅ Disk usage: ${DISK_USAGE}%"
else
    echo "⚠️ Disk usage high: ${DISK_USAGE}%"
fi

# メモリ使用量チェック（Linux/macOS）
if command -v ps > /dev/null; then
    MEM_USAGE=$(ps aux | grep "shirokuma.*--serve" | grep -v grep | awk '{print $4}')
    if [[ -n "$MEM_USAGE" ]]; then
        echo "📊 Memory usage: ${MEM_USAGE}%"
    fi
fi

echo "✅ Health check completed"
```

### 9.2 アラート設定

```bash
# scripts/alert-webhook.sh
#!/bin/bash

# Slack/Discord/その他のWebhookにアラート送信
send_alert() {
    local message="$1"
    local severity="$2"
    local webhook_url="$ALERT_WEBHOOK_URL"
    
    if [[ -n "$webhook_url" ]]; then
        curl -X POST "$webhook_url" \
             -H "Content-Type: application/json" \
             -d "{\"text\":\"[$severity] Shirokuma MCP: $message\"}"
    fi
}

# 使用例
# send_alert "Database backup failed" "ERROR"
# send_alert "Health check passed" "INFO"
```

## 10. アップデート手順

### 10.1 自動アップデートスクリプト

```bash
# scripts/update-application.sh
#!/bin/bash

echo "🔄 Starting application update..."

# 現在のバージョンを記録
CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
echo "📋 Current version: $CURRENT_VERSION"

# データベースバックアップ
./scripts/backup-database.sh

# Gitで最新バージョンを取得
git fetch origin
git checkout v0.8.0
git pull origin v0.8.0

# 依存関係更新
npm ci

# ビルド
npm run build

# データベースマイグレーション
npx prisma db push

# ヘルスチェック
if ./scripts/health-check.sh; then
    echo "✅ Update completed successfully"
    
    # 新しいバージョンを記録
    NEW_VERSION=$(node -e "console.log(require('./package.json').version)")
    echo "📋 New version: $NEW_VERSION"
else
    echo "❌ Update failed - health check failed"
    exit 1
fi
```

### 10.2 ロールバック手順

```bash
# scripts/rollback.sh
#!/bin/bash

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <git-commit-hash>"
    exit 1
fi

COMMIT_HASH="$1"

echo "⏪ Rolling back to commit: $COMMIT_HASH"

# データベースバックアップ
./scripts/backup-database.sh

# 指定されたコミットにロールバック
git checkout "$COMMIT_HASH"

# 依存関係とビルド
npm ci
npm run build

# データベース状態確認
if ./scripts/health-check.sh; then
    echo "✅ Rollback completed successfully"
else
    echo "❌ Rollback failed"
    exit 1
fi
```

## 11. 運用監視

### 11.1 ログ収集

```bash
# scripts/collect-logs.sh
#!/bin/bash

REPORT_DIR="./reports/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT_DIR"

echo "📊 Collecting system information..."

# システム情報
{
    echo "=== System Info ==="
    uname -a
    echo
    echo "=== Node.js Version ==="
    node --version
    echo
    echo "=== NPM Version ==="
    npm --version
    echo
    echo "=== Disk Usage ==="
    df -h .
    echo
    echo "=== Memory Usage ==="
    free -h 2>/dev/null || vm_stat 2>/dev/null || echo "Memory info not available"
} > "$REPORT_DIR/system-info.txt"

# アプリケーションログ
if [[ -d "logs" ]]; then
    cp logs/*.log "$REPORT_DIR/" 2>/dev/null || true
fi

# データベース統計
if [[ -f "data/shirokuma.db" ]]; then
    {
        echo "=== Database Statistics ==="
        sqlite3 "data/shirokuma.db" ".schema"
        echo
        sqlite3 "data/shirokuma.db" "SELECT name, COUNT(*) as count FROM sqlite_master WHERE type='table' GROUP BY name;"
    } > "$REPORT_DIR/database-stats.txt"
fi

echo "✅ Logs collected in: $REPORT_DIR"
```

## 12. トラブルシューティング

### 12.1 一般的な問題と解決策

**問題**: MCPサーバーが起動しない
```bash
# 解決策
# 1. パーミッション確認
ls -la dist/index.js

# 2. 依存関係確認
npm install

# 3. ポート確認
lsof -i :3000

# 4. ログ確認
tail -f logs/error.log
```

**問題**: データベース接続エラー
```bash
# 解決策
# 1. データベースファイル確認
ls -la data/shirokuma.db

# 2. パーミッション修正
chmod 600 data/shirokuma.db

# 3. データベース修復
sqlite3 data/shirokuma.db "PRAGMA integrity_check;"
```

**問題**: Claude Desktopでサーバーが見つからない
```bash
# 解決策
# 1. 設定ファイル確認
./scripts/check-mcp-config.sh

# 2. パス確認
which node
pwd

# 3. Claude Desktop再起動
killall Claude && open -a Claude
```

### 12.2 デバッグモード

```bash
# デバッグモードでの起動
NODE_ENV=development LOG_LEVEL=debug npm start -- --serve

# 詳細ログ有効化
export DEBUG=shirokuma:*
npm start -- --serve
```

## 13. パフォーマンス最適化

### 13.1 SQLite最適化

```sql
-- データベース設定最適化
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 268435456; -- 256MB
```

### 13.2 Node.js最適化

```bash
# Node.js実行時オプション
node --max-old-space-size=512 --optimize-for-size dist/index.js --serve
```

## 14. 次のステップ

デプロイメントが完了したら、次は[監視ガイド](./05-monitoring-guide.md)を確認して、本番環境での効果的な監視とメンテナンス方法を学んでください。