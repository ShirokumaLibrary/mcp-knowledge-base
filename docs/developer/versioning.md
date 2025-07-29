# Versioning Guide

Shirokuma MCP Knowledge Baseのバージョン管理とリリースプロセスについて説明します。

## セマンティックバージョニング

本プロジェクトは[Semantic Versioning 2.0.0](https://semver.org/)に従います。

### バージョン番号の形式

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: 後方互換性のない変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

### 例

- `0.4.2` → `0.4.3`: バグ修正
- `0.4.2` → `0.5.0`: 新機能追加
- `0.4.2` → `1.0.0`: 破壊的変更

## バージョン更新の判断基準

### PATCH（0.0.x）を上げる場合

- バグ修正
- セキュリティパッチ
- ドキュメントの更新
- パフォーマンスの改善（API変更なし）
- 内部的なリファクタリング

例：
```
- SQLインジェクション脆弱性の修正
- メモリリークの修正
- タイポの修正
```

### MINOR（0.x.0）を上げる場合

- 新しいAPIエンドポイントの追加
- 新しいオプションパラメータの追加
- 新しいコンテンツタイプのサポート
- 後方互換性のある機能拡張

例：
```
- カスタムタイプシステムの追加
- 全文検索機能の追加
- 新しいフィルタリングオプション
```

### MAJOR（x.0.0）を上げる場合

- APIの破壊的変更
- データベーススキーマの非互換変更
- 必須パラメータの変更
- 既存機能の削除

例：
```
- パラメータ名の変更（statusIds → statuses）
- レスポンス形式の変更
- 必須フィールドの追加
```

## リリースプロセス

### 1. 変更の準備

```bash
# feature/fix ブランチで作業
git checkout -b feature/new-feature

# 変更を実装
# ... コード変更 ...

# テストを実行
npm test
npm run test:integration
```

### 2. CHANGELOGの更新

`CHANGELOG.md`の`[Unreleased]`セクションに変更を記載：

```markdown
## [Unreleased]

### Added
- 新機能の説明

### Changed
- 変更内容の説明

### Fixed
- 修正内容の説明
```

### 3. バージョン番号の決定

変更内容に基づいて適切なバージョンを決定：

```bash
# 現在のバージョンを確認
npm version

# PATCHリリース（0.4.2 → 0.4.3）
npm version patch -m "chore: release v%s"

# MINORリリース（0.4.2 → 0.5.0）
npm version minor -m "chore: release v%s"

# MAJORリリース（0.4.2 → 1.0.0）
npm version major -m "chore: release v%s"
```

### 4. リリースコミットの作成

```bash
# CHANGELOGを整理
# [Unreleased] → [0.4.3] - 2025-01-29

# CHANGELOGをコミット
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for v0.4.3"

# package.jsonのバージョンを更新（タグも作成される）
npm version patch -m "chore: release v%s"
```

### 5. ビルドとテスト

```bash
# クリーンビルド
npm run clean && npm run build

# 全テストを実行
npm run test:all

# ビルド成果物をコミット
git add dist/
git commit -m "build: distribution files for v0.4.3"
```

### 6. プッシュとタグ

```bash
# mainブランチにマージ
git checkout main
git merge feature/new-feature

# リモートにプッシュ（タグも含む）
git push origin main
git push origin --tags
```

### 7. GitHubリリースの作成

```bash
# GitHub CLIを使用
gh release create v0.4.3 \
  --title "Release v0.4.3" \
  --notes-from-tag
```

## プレリリース

### アルファ版

```bash
# 0.5.0-alpha.1
npm version preminor --preid=alpha
```

### ベータ版

```bash
# 0.5.0-beta.1
npm version prerelease --preid=beta
```

### RC版

```bash
# 0.5.0-rc.1
npm version prerelease --preid=rc
```

## ブランチ戦略

### mainブランチ

- 常に安定した状態を保つ
- 直接プッシュは禁止
- すべての変更はPR経由

### developブランチ

- 次期リリースの開発ブランチ
- feature/*ブランチをマージ

### releaseブランチ

- リリース準備用
- `release/v0.5.0`の形式
- バグ修正のみ許可

### hotfixブランチ

- 緊急修正用
- `hotfix/security-fix`の形式
- mainから作成し、mainとdevelopにマージ

## 自動化

### GitHub Actions

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Test
        run: npm test
        
      - name: Create Release
        uses: actions/create-release@v1
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body_path: ./CHANGELOG.md
          draft: false
          prerelease: false
```

## バージョン間の互換性

### 後方互換性の維持

1. **非推奨化プロセス**
   ```typescript
   /**
    * @deprecated Use `statuses` instead. Will be removed in v1.0.0
    */
   statusIds?: number[];
   ```

2. **移行期間の提供**
   - 少なくとも1つのマイナーバージョン
   - 明確な移行ガイドの提供

3. **段階的な削除**
   - v0.4.0: 新APIを追加、旧APIに非推奨マーク
   - v0.5.0: 警告を表示
   - v1.0.0: 旧APIを削除

### マイグレーションスクリプト

重大な変更時は移行スクリプトを提供：

```bash
# v0.4.x → v0.5.0
npm run migrate:v0.5.0
```

## リリースノート

### フォーマット

```markdown
# v0.4.3 Release Notes

## 🎉 Highlights

- セキュリティ強化
- パフォーマンス改善

## 🔧 Changes

### Security
- Path traversal vulnerability fix (#123)

### Performance
- Database query optimization (#124)

## 📦 Dependencies

- Updated sqlite3 to 5.1.7
- Updated zod to 3.23.8

## 🔄 Migration

No migration required.

## 📝 Full Changelog

See [CHANGELOG.md](./CHANGELOG.md)
```

## チェックリスト

リリース前の確認事項：

- [ ] すべてのテストが通る
- [ ] CHANGELOGが更新されている
- [ ] package.jsonのバージョンが正しい
- [ ] ドキュメントが最新
- [ ] 破壊的変更がある場合、移行ガイドを作成
- [ ] セキュリティ脆弱性がない
- [ ] パフォーマンステストを実施
- [ ] リリースノートを作成