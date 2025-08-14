# CLI仕様書

## 1. 概要

本書は、Shirokuma MCP Knowledge Base v0.8.0のコマンドラインインターフェース（CLI）仕様を定義します。

## 2. 基本構造

### 2.1 コマンド形式

```bash
shirokuma <command> [options] [arguments]
```

### 2.2 グローバルオプション

| オプション | 短縮形 | 説明 | デフォルト |
|-----------|--------|------|-----------|
| --help | -h | ヘルプ表示 | - |
| --version | -v | バージョン表示 | - |
| --config | -c | 設定ファイルパス | ~/.shirokuma/config.json |
| --format | -f | 出力形式 (json/table/markdown) | table |
| --quiet | -q | 最小限の出力 | false |
| --verbose | - | 詳細出力 | false |
| --no-color | - | カラー出力無効 | false |

## 3. コマンド一覧

### 3.1 基本操作コマンド

#### create - アイテム作成
```bash
shirokuma create [options]

Options:
  --type, -t <type>           アイテムタイプ (必須)
  --title <title>             タイトル (必須)
  --description, -d <desc>    説明
  --content <content>         詳細内容
  --status, -s <status>       ステータス [default: "Open"]
  --priority, -p <priority>   優先度 (CRITICAL|HIGH|MEDIUM|LOW|MINIMAL) [default: "MEDIUM"]
  --category <category>       カテゴリ
  --tags <tags>              タグ (カンマ区切り)
  --related <ids>            関連ID (カンマ区切り)
  --start-date <date>        開始日
  --end-date <date>          終了日
  --version <version>        バージョン
  --editor, -e               エディタで内容編集

Examples:
  # 基本的な作成
  shirokuma create -t task --title "新機能実装"
  
  # 詳細指定
  shirokuma create -t issue \
    --title "ログインエラー" \
    --description "ユーザーがログインできない" \
    --priority HIGH \
    --tags "bug,urgent"
  
  # エディタ使用
  shirokuma create -t docs --title "設計書" --editor
```

#### get - アイテム取得
```bash
shirokuma get <id> [options]

Options:
  --format, -f <format>  出力形式 (json|table|markdown)
  --show-related        関連アイテムも表示
  --depth <n>           関連の深さ [default: 1]

Examples:
  shirokuma get 123
  shirokuma get 123 --show-related --depth 2
  shirokuma get 123 -f json
```

#### list - アイテム一覧
```bash
shirokuma list [options]

Options:
  --type, -t <type>        タイプフィルタ
  --status, -s <status>    ステータスフィルタ (複数可)
  --priority, -p <priority> 優先度フィルタ (複数可)
  --tags <tags>            タグフィルタ (カンマ区切り)
  --category <category>    カテゴリフィルタ
  --limit, -l <n>          表示件数 [default: 20]
  --offset, -o <n>         オフセット [default: 0]
  --sort <field>           ソートフィールド (created|updated|priority)
  --order <order>          ソート順 (asc|desc) [default: "desc"]
  --since <date>           指定日以降
  --until <date>           指定日まで

Examples:
  # タイプ指定
  shirokuma list -t issues
  
  # 複数条件
  shirokuma list -t tasks -s Open -p HIGH,CRITICAL
  
  # 日付範囲
  shirokuma list --since 2024-01-01 --until 2024-01-31
```

#### update - アイテム更新
```bash
shirokuma update <id> [options]

Options:
  --title <title>           タイトル
  --description <desc>      説明
  --content <content>       詳細内容
  --status, -s <status>     ステータス
  --priority, -p <priority> 優先度
  --category <category>     カテゴリ
  --tags <tags>            タグ (置換)
  --add-tags <tags>        タグ追加
  --remove-tags <tags>     タグ削除
  --related <ids>          関連ID (置換)
  --add-related <ids>      関連追加
  --remove-related <ids>   関連削除
  --start-date <date>      開始日
  --end-date <date>        終了日
  --version <version>      バージョン
  --editor, -e             エディタで編集

Examples:
  # ステータス更新
  shirokuma update 123 -s "In Progress"
  
  # タグ操作
  shirokuma update 123 --add-tags "important" --remove-tags "draft"
  
  # エディタ使用
  shirokuma update 123 --editor
```

#### delete - アイテム削除
```bash
shirokuma delete <id> [options]

Options:
  --force, -f    確認なしで削除
  --cascade      関連も削除

Examples:
  shirokuma delete 123
  shirokuma delete 123 --force
```

### 3.2 検索コマンド

#### search - 全文検索
```bash
shirokuma search <query> [options]

Options:
  --type, -t <types>      タイプフィルタ (カンマ区切り)
  --limit, -l <n>         表示件数 [default: 20]
  --offset, -o <n>        オフセット [default: 0]
  --highlight             マッチ箇所をハイライト

Examples:
  shirokuma search "ログイン"
  shirokuma search "authentication" -t issues,docs
  shirokuma search "エラー" --highlight
```

#### find - 条件検索
```bash
shirokuma find [options]

Options:
  --where <conditions>    検索条件 (JSON形式)
  --select <fields>       表示フィールド
  --limit <n>            表示件数
  --offset <n>           オフセット

Examples:
  shirokuma find --where '{"type":"task","status":"Open"}'
  shirokuma find --where '{"priority":{"$in":["HIGH","CRITICAL"]}}'
```

### 3.3 関連操作コマンド

#### related - 関連アイテム表示
```bash
shirokuma related <id> [options]

Options:
  --depth, -d <n>        探索深度 [default: 1]
  --type, -t <types>    タイプフィルタ
  --format <format>      出力形式 (tree|list|graph)

Examples:
  shirokuma related 123
  shirokuma related 123 -d 2 -t issues,tasks
  shirokuma related 123 --format tree
```

#### link - 関連付け
```bash
shirokuma link <source-id> <target-ids...> [options]

Options:
  --bidirectional, -b    双方向リンク [default: true]

Examples:
  shirokuma link 123 456 789
  shirokuma link 123 456 --bidirectional false
```

#### unlink - 関連解除
```bash
shirokuma unlink <source-id> <target-ids...> [options]

Options:
  --bidirectional, -b    双方向解除 [default: true]

Examples:
  shirokuma unlink 123 456
```

### 3.4 タグ操作コマンド

#### tags - タグ一覧
```bash
shirokuma tags [options]

Options:
  --sort <field>         ソート (name|count) [default: "count"]
  --limit <n>           表示件数

Examples:
  shirokuma tags
  shirokuma tags --sort name
```

#### tag - タグ付け
```bash
shirokuma tag <id> <tags...> [options]

Options:
  --replace    既存タグを置換

Examples:
  shirokuma tag 123 important urgent
  shirokuma tag 123 bug --replace
```

#### untag - タグ解除
```bash
shirokuma untag <id> <tags...>

Examples:
  shirokuma untag 123 draft temporary
```

### 3.5 統計コマンド

#### stats - 統計情報
```bash
shirokuma stats [options]

Options:
  --type <type>         タイプ別統計
  --period <period>     期間 (day|week|month|year)
  --since <date>        開始日
  --until <date>        終了日

Examples:
  shirokuma stats
  shirokuma stats --type issues
  shirokuma stats --period month --since 2024-01-01
```

#### report - レポート生成
```bash
shirokuma report [options]

Options:
  --template <name>     テンプレート名
  --output, -o <file>   出力ファイル
  --format <format>     形式 (markdown|html|pdf)

Examples:
  shirokuma report --template weekly
  shirokuma report -o report.md --format markdown
```

### 3.6 カレントステートコマンド

#### state - 現在状態表示
```bash
shirokuma state [options]

Options:
  --format <format>    出力形式

Examples:
  shirokuma state
  shirokuma state -f json
```

#### state-update - 状態更新
```bash
shirokuma state-update [options]

Options:
  --content <content>    内容 (Markdown)
  --file, -f <file>     ファイルから読み込み
  --editor, -e          エディタで編集
  --related <ids>       関連ID
  --tags <tags>         タグ

Examples:
  shirokuma state-update --content "セッション開始"
  shirokuma state-update -f state.md
  shirokuma state-update --editor
```

### 3.7 管理コマンド

#### serve - MCPサーバー起動
```bash
shirokuma serve [options]

Options:
  --stdio              stdio通信 [default: true]
  --verbose            詳細ログ
  --log-file <file>    ログファイル

Examples:
  shirokuma serve
  shirokuma serve --verbose --log-file server.log
```

#### init - 初期化
```bash
shirokuma init [options]

Options:
  --force            既存データを削除
  --seed             サンプルデータ投入
  --config <file>    設定ファイル

Examples:
  shirokuma init
  shirokuma init --seed
```

#### backup - バックアップ
```bash
shirokuma backup [options]

Options:
  --output, -o <file>    出力ファイル
  --compress            圧縮

Examples:
  shirokuma backup -o backup.json
  shirokuma backup -o backup.json.gz --compress
```

#### restore - リストア
```bash
shirokuma restore <file> [options]

Options:
  --force    既存データを上書き
  --merge    既存データとマージ

Examples:
  shirokuma restore backup.json
  shirokuma restore backup.json --merge
```

### 3.8 エクスポート/インポート

#### export - エクスポート
```bash
shirokuma export [options]

Options:
  --type <types>        タイプ指定
  --format <format>     形式 (json|csv|markdown)
  --output, -o <file>   出力ファイル
  --since <date>        開始日
  --until <date>        終了日

Examples:
  shirokuma export -o data.json
  shirokuma export --type issues,tasks --format csv -o tasks.csv
  shirokuma export --since 2024-01-01 -o january.json
```

#### import - インポート
```bash
shirokuma import <file> [options]

Options:
  --format <format>     形式 (json|csv)
  --mapping <file>      フィールドマッピング
  --validate           検証のみ
  --merge              既存データとマージ

Examples:
  shirokuma import data.json
  shirokuma import tasks.csv --format csv
  shirokuma import data.json --validate
```

## 4. インタラクティブモード

### 4.1 起動
```bash
shirokuma interactive
# または
shirokuma i
```

### 4.2 インタラクティブコマンド
```
shirokuma> help
shirokuma> create task
Title: 新しいタスク
Description: タスクの説明
Priority (MEDIUM): HIGH
Tags (comma-separated): important,urgent
Created: Item #123

shirokuma> list --type tasks
[表示]

shirokuma> exit
```

## 5. 設定ファイル

### 5.1 設定ファイル形式
```json
{
  "database": {
    "path": "~/.shirokuma/db.sqlite"
  },
  "defaults": {
    "type": "task",
    "status": "Open",
    "priority": "MEDIUM"
  },
  "display": {
    "format": "table",
    "color": true,
    "limit": 20
  },
  "editor": "vim",
  "aliases": {
    "ls": "list",
    "rm": "delete",
    "mk": "create"
  }
}
```

### 5.2 設定コマンド
```bash
# 設定表示
shirokuma config

# 設定変更
shirokuma config set display.format json
shirokuma config set editor nano

# 設定リセット
shirokuma config reset
```

## 6. 環境変数

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| SHIROKUMA_HOME | ホームディレクトリ | ~/.shirokuma |
| SHIROKUMA_DB | データベースパス | $SHIROKUMA_HOME/db.sqlite |
| SHIROKUMA_CONFIG | 設定ファイルパス | $SHIROKUMA_HOME/config.json |
| SHIROKUMA_EDITOR | エディタ | $EDITOR or vi |
| SHIROKUMA_FORMAT | デフォルト出力形式 | table |
| SHIROKUMA_COLOR | カラー出力 | true |
| SHIROKUMA_LOG_LEVEL | ログレベル | info |

## 7. 出力形式

### 7.1 Table形式（デフォルト）
```
ID   Type    Title              Status       Priority  Updated
---  ------  -----------------  -----------  --------  ----------
123  task    新機能実装          In Progress  HIGH      2024-01-15
124  issue   ログインエラー      Open         CRITICAL  2024-01-14
```

### 7.2 JSON形式
```json
[
  {
    "id": 123,
    "type": "task",
    "title": "新機能実装",
    "status": "In Progress",
    "priority": "HIGH",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
]
```

### 7.3 Markdown形式
```markdown
## Items

| ID | Type | Title | Status | Priority | Updated |
|----|------|-------|--------|----------|---------|
| 123 | task | 新機能実装 | In Progress | HIGH | 2024-01-15 |
| 124 | issue | ログインエラー | Open | CRITICAL | 2024-01-14 |
```

## 8. エラーハンドリング

### 8.1 エラーコード

| コード | 意味 | 説明 |
|--------|------|------|
| 0 | 成功 | 正常終了 |
| 1 | 一般エラー | 不明なエラー |
| 2 | 引数エラー | 不正な引数 |
| 3 | 見つからない | アイテムが存在しない |
| 4 | 権限エラー | アクセス権限なし |
| 5 | 検証エラー | バリデーション失敗 |
| 6 | 接続エラー | データベース接続失敗 |
| 7 | 設定エラー | 設定ファイルエラー |

### 8.2 エラー表示
```bash
# 詳細エラー
shirokuma get 999
Error: Item not found (ID: 999)

# 詳細モード
shirokuma get 999 --verbose
Error: Item not found
  Code: 3
  ID: 999
  Stack: at getItem (lib/commands/get.js:42)
```

## 9. 補完機能

### 9.1 Bash補完
```bash
# インストール
shirokuma completion bash > ~/.shirokuma-completion.bash
echo "source ~/.shirokuma-completion.bash" >> ~/.bashrc

# 使用例
shirokuma cr<TAB>  # create
shirokuma list --type <TAB>  # issues, tasks, docs...
```

### 9.2 Zsh補完
```bash
# インストール
shirokuma completion zsh > ~/.shirokuma-completion.zsh
echo "source ~/.shirokuma-completion.zsh" >> ~/.zshrc
```

## 10. プラグイン

### 10.1 プラグイン形式
```javascript
// ~/.shirokuma/plugins/my-plugin.js
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  commands: {
    'my-command': {
      description: 'My custom command',
      options: {
        '--option': 'Option description'
      },
      handler: async (args, options) => {
        // 実装
      }
    }
  }
};
```

### 10.2 プラグイン管理
```bash
# インストール
shirokuma plugin install my-plugin

# 一覧
shirokuma plugin list

# アンインストール
shirokuma plugin uninstall my-plugin
```

## 11. パフォーマンス

### 11.1 ページネーション
- デフォルト: 20件
- 最大: 100件
- オフセットベース

### 11.2 キャッシュ
- タグ一覧: 5分間キャッシュ
- 統計情報: 1分間キャッシュ

### 11.3 非同期処理
- 大量データのエクスポート
- バックアップ処理
- インデックス再構築

## 12. セキュリティ

### 12.1 入力検証
- コマンドインジェクション対策
- SQLインジェクション対策
- パス トラバーサル対策

### 12.2 ファイルアクセス
- ホームディレクトリ制限
- シンボリックリンク検証

## 13. デバッグ

### 13.1 デバッグモード
```bash
# デバッグ出力
SHIROKUMA_LOG_LEVEL=debug shirokuma list

# SQLログ
SHIROKUMA_SQL_LOG=true shirokuma search "test"

# プロファイリング
SHIROKUMA_PROFILE=true shirokuma stats
```

### 13.2 ヘルスチェック
```bash
# システムチェック
shirokuma doctor

# データベース検証
shirokuma verify

# インデックス再構築
shirokuma reindex
```