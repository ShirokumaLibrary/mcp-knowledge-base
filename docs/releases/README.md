# Release Documentation

このディレクトリには、リリース関連のドキュメントが含まれています。

## 目次

- [CHANGELOG.md](../../CHANGELOG.md) - すべてのバージョンの変更履歴（プロジェクトルートにリンク）
- [リリースノート](notes/) - バージョンごとの詳細なリリースノート
- [アップグレードガイド](upgrades/) - バージョン間のアップグレード手順
- [マイグレーションスクリプト](migrations/) - データ移行用スクリプト

## 最新リリース

- **現在のバージョン**: v0.4.2
- **リリース日**: 2025-07-29
- **主な変更点**: 
  - セキュリティ修正（パストラバーサル脆弱性）
  - モンキーテストによる品質向上
  - テストカバレッジ80%達成

## リリースプロセス

1. CHANGELOGの更新
2. バージョン番号の更新（package.json）
3. ビルドとテストの実行
4. タグの作成とプッシュ
5. リリースノートの作成

詳細は[開発者ドキュメント](../developer/versioning.md)を参照してください。