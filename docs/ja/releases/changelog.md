# 変更履歴

すべての注目すべき変更をこのファイルに記録します。

フォーマットは[Keep a Changelog](https://keepachangelog.com/ja/1.0.0/)に基づき、
このプロジェクトは[セマンティックバージョニング](https://semver.org/lang/ja/)に準拠しています。

## [0.4.2] - 2025-07-29

### セキュリティ
- **重要な修正**: セッションIDのパストラバーサル脆弱性を修正
  - ファイルパスとIDの包括的な検証を追加
  - ディレクトリトラバーサル攻撃（例：`../../etc/passwd`）を防止
  - 多層防御：Zodスキーマ、リポジトリ検証、ファイルパスチェック

### 追加
- **モンキーテスト**: エッジケースによる広範なストレステスト
  - Unicode絵文字の処理検証
  - SQLインジェクション防止テスト
  - 並行操作テスト
  - 大規模データセット処理（アイテムあたり50以上のタグ）
  - カスタムタイプの作成と使用の検証

### 変更
- すべてのIDパラメータの入力検証を強化
- 無効な入力形式に対するエラーメッセージを改善

### 修正
- 悪意のあるセッションIDがデータディレクトリ外にファイルを作成できるセキュリティ脆弱性

## [0.4.1] - 2025-07-29

### 追加
- **テストカバレッジの改善**: 関数カバレッジ80.33%達成（44.54%から向上）
  - コードベース全体で500以上の新しいテストを追加
  - セキュリティ層の包括的なテスト（入力サニタイザー、レート制限、アクセス制御）
  - Unicode、特殊文字、検証のエッジケース処理テスト
  - 12カテゴリ、200以上のテストケースを含むMCPプロトコルテストスイート
- **開発ドキュメント**:
  - `/docs/test-results/`にテスト結果ドキュメント
  - 発見された動作を含むテストケースドキュメントの更新
  - READMEにコード品質メトリクス

### 変更
- **コード品質の改善**:
  - すべてのTypeScript`any`型を削除（249 → 0）
  - コードベース全体の型安全性を強化
  - エラーメッセージと検証を改善
  - テストファイルの関心事の分離を改善

### 修正
- セッション更新時に日付フィールドが正しく保持されるように修正
- 空のタグ処理（markdownから空の配列ではなくnullを返す）
- テストファイルのビルドエラー（プロパティの欠落、型の不正）
- 先頭ゼロ付き数値文字列のMarkdownパーサー処理
- セキュリティテストのパストラバーサルテスト期待値

### 削除
- **コードクリーンアップ**: 11の未使用ファイルを削除（約1500行）
  - 廃止された依存性コンテナと関連テスト
  - 未使用のエラー処理ユーティリティとミドルウェア
  - 非推奨のパフォーマンスユーティリティ
  - 様々なユーティリティモジュールのデッドコード

詳細な変更履歴は[CHANGELOG.md](../../../CHANGELOG.md)をご覧ください。