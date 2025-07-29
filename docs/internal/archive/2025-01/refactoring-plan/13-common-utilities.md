# 共通ユーティリティ作成計画

## 概要
プロジェクト全体で繰り返し使用される機能を共通ユーティリティとして集約し、コードの重複を排除します。

## 現状分析

### 重複パターンの統計
1. **Markdownパース/生成** - 15箇所以上で同様の実装
2. **日付フォーマット** - 20箇所以上で個別実装
3. **ID生成/パース** - 各リポジトリで重複
4. **ファイルパス生成** - 10箇所以上で重複
5. **配列操作** - グループ化、ユニーク化が散在
6. **文字列操作** - トリム、エスケープが散在

## ユーティリティ設計

### 1. Markdownユーティリティ

```typescript
// src/utils/markdown-utils.ts
export interface MarkdownMetadata {
  [key: string]: any;
}

export interface ParsedMarkdown {
  metadata: MarkdownMetadata;
  content: string;
}

export class MarkdownUtils {
  /**
   * Markdownファイルをパース
   */
  static parse(markdown: string): ParsedMarkdown {
    const lines = markdown.split('\n');
    const metadata: MarkdownMetadata = {};
    let contentStartIndex = 0;
    
    // フロントマター形式のメタデータを解析
    if (lines[0] === '---') {
      let inFrontMatter = true;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '---') {
          contentStartIndex = i + 1;
          break;
        }
        
        const match = lines[i].match(/^(\w+):\s*(.*)$/);
        if (match) {
          const [, key, value] = match;
          metadata[key] = this.parseValue(value);
        }
      }
    }
    
    const content = lines.slice(contentStartIndex).join('\n').trim();
    
    return { metadata, content };
  }
  
  /**
   * オブジェクトをMarkdown形式に生成
   */
  static generate(metadata: MarkdownMetadata, content: string): string {
    const lines = ['---'];
    
    // メタデータをソートして生成（一貫性のため）
    const sortedKeys = Object.keys(metadata).sort();
    for (const key of sortedKeys) {
      const value = metadata[key];
      lines.push(`${key}: ${this.stringifyValue(value)}`);
    }
    
    lines.push('---', '', content);
    
    return lines.join('\n');
  }
  
  /**
   * メタデータ値のパース
   */
  private static parseValue(value: string): any {
    // 空文字列
    if (!value.trim()) return null;
    
    // 配列
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    // 数値
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    
    // 真偽値
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // 日付
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return value; // ISO文字列として保持
      }
    }
    
    return value;
  }
  
  /**
   * 値の文字列化
   */
  private static stringifyValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }
  
  /**
   * Markdownのサニタイズ
   */
  static sanitize(content: string): string {
    return content
      .replace(/[<>]/g, '') // HTMLタグを除去
      .replace(/\r\n/g, '\n') // 改行コードを統一
      .trim();
  }
}
```

### 2. 日付ユーティリティ

```typescript
// src/utils/date-utils.ts
export class DateUtils {
  /**
   * 日付を YYYY-MM-DD 形式にフォーマット
   */
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date');
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
  
  /**
   * ISO 8601形式の日時文字列を生成
   */
  static toISOString(date: Date = new Date()): string {
    return date.toISOString();
  }
  
  /**
   * 日付文字列のバリデーション
   */
  static isValidDateString(dateStr: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return false;
    }
    
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }
  
  /**
   * 日付範囲の生成
   */
  static getDateRange(
    startDate: string,
    endDate: string
  ): string[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];
    
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(this.formatDate(new Date(d)));
    }
    
    return dates;
  }
  
  /**
   * 相対日付の取得
   */
  static getRelativeDate(offset: number, from: Date = new Date()): string {
    const date = new Date(from);
    date.setDate(date.getDate() + offset);
    return this.formatDate(date);
  }
  
  /**
   * 今日の日付
   */
  static today(): string {
    return this.formatDate(new Date());
  }
  
  /**
   * 昨日の日付
   */
  static yesterday(): string {
    return this.getRelativeDate(-1);
  }
  
  /**
   * 明日の日付
   */
  static tomorrow(): string {
    return this.getRelativeDate(1);
  }
  
  /**
   * 週の開始日（月曜日）
   */
  static startOfWeek(date: Date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return this.formatDate(d);
  }
  
  /**
   * 月の開始日
   */
  static startOfMonth(date: Date = new Date()): string {
    const d = new Date(date);
    d.setDate(1);
    return this.formatDate(d);
  }
}
```

### 3. IDユーティリティ

```typescript
// src/utils/id-utils.ts
export interface ParsedReference {
  type: string;
  id: number;
}

export class IdUtils {
  /**
   * 参照文字列（type-id）の生成
   */
  static createReference(type: string, id: number): string {
    return `${type}-${id}`;
  }
  
  /**
   * 参照文字列のパース
   */
  static parseReference(reference: string): ParsedReference | null {
    const match = reference.match(/^(\w+)-(\d+)$/);
    if (!match) {
      return null;
    }
    
    return {
      type: match[1],
      id: parseInt(match[2], 10),
    };
  }
  
  /**
   * 参照文字列の検証
   */
  static isValidReference(reference: string): boolean {
    return /^\w+-\d+$/.test(reference);
  }
  
  /**
   * セッションIDの生成
   */
  static createSessionId(date: Date = new Date()): string {
    const pad = (n: number, width: number = 2) => 
      n.toString().padStart(width, '0');
    
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
      pad(date.getMilliseconds(), 3),
    ].join('-');
  }
  
  /**
   * セッションIDのパース
   */
  static parseSessionId(id: string): Date | null {
    const match = id.match(
      /^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{3})$/
    );
    
    if (!match) {
      return null;
    }
    
    const [, year, month, day, hour, minute, second, ms] = match;
    
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second),
      parseInt(ms)
    );
  }
  
  /**
   * UUIDの生成（簡易版）
   */
  static generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
```

### 4. パスユーティリティ

```typescript
// src/utils/path-utils.ts
export class PathUtils {
  /**
   * エンティティのファイルパス生成
   */
  static getEntityFilePath(
    baseDir: string,
    type: string,
    id: number
  ): string {
    const typeDir = path.join(baseDir, type);
    const filename = `${type}-${id}.md`;
    return path.join(typeDir, filename);
  }
  
  /**
   * セッションのファイルパス生成
   */
  static getSessionFilePath(
    baseDir: string,
    date: string,
    sessionId: string
  ): string {
    const dateDir = path.join(baseDir, date);
    const filename = `session-${sessionId}.md`;
    return path.join(dateDir, filename);
  }
  
  /**
   * サマリーのファイルパス生成
   */
  static getSummaryFilePath(
    baseDir: string,
    date: string
  ): string {
    const dateDir = path.join(baseDir, date);
    const filename = `summary-${date}.md`;
    return path.join(dateDir, filename);
  }
  
  /**
   * ファイルパスからエンティティ情報を抽出
   */
  static parseEntityPath(filePath: string): ParsedReference | null {
    const filename = path.basename(filePath);
    const match = filename.match(/^(\w+)-(\d+)\.md$/);
    
    if (!match) {
      return null;
    }
    
    return {
      type: match[1],
      id: parseInt(match[2], 10),
    };
  }
  
  /**
   * 安全なパス結合
   */
  static safejoin(...parts: string[]): string {
    return path.join(...parts.filter(Boolean));
  }
  
  /**
   * 相対パスの解決
   */
  static resolve(...parts: string[]): string {
    return path.resolve(...parts);
  }
}
```

### 5. 配列ユーティリティ

```typescript
// src/utils/array-utils.ts
export class ArrayUtils {
  /**
   * 配列の重複を除去
   */
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }
  
  /**
   * プロパティで重複を除去
   */
  static uniqueBy<T, K extends keyof T>(
    array: T[],
    key: K
  ): T[] {
    const seen = new Set<T[K]>();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }
  
  /**
   * 配列をグループ化
   */
  static groupBy<T, K extends string | number>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }
  
  /**
   * 配列をチャンクに分割
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * 配列の差分を取得
   */
  static difference<T>(array1: T[], array2: T[]): T[] {
    const set2 = new Set(array2);
    return array1.filter(item => !set2.has(item));
  }
  
  /**
   * 配列の共通部分を取得
   */
  static intersection<T>(array1: T[], array2: T[]): T[] {
    const set2 = new Set(array2);
    return array1.filter(item => set2.has(item));
  }
  
  /**
   * 配列をソート（日本語対応）
   */
  static sortByLocale<T>(
    array: T[],
    keyFn: (item: T) => string,
    locale: string = 'ja'
  ): T[] {
    return [...array].sort((a, b) => {
      return keyFn(a).localeCompare(keyFn(b), locale);
    });
  }
}
```

### 6. 文字列ユーティリティ

```typescript
// src/utils/string-utils.ts
export class StringUtils {
  /**
   * 文字列のトリム（全角スペース対応）
   */
  static trim(str: string): string {
    return str.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
  }
  
  /**
   * 文字列の切り詰め
   */
  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) {
      return str;
    }
    return str.slice(0, maxLength - suffix.length) + suffix;
  }
  
  /**
   * キャメルケースをケバブケースに変換
   */
  static camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  /**
   * ケバブケースをキャメルケースに変換
   */
  static kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  
  /**
   * 文字列のエスケープ
   */
  static escapeHtml(str: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    
    return str.replace(/[&<>"']/g, char => escapeMap[char]);
  }
  
  /**
   * 正規表現のエスケープ
   */
  static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * 文字列の正規化（NFKC）
   */
  static normalize(str: string): string {
    return str.normalize('NFKC');
  }
  
  /**
   * スラッグの生成
   */
  static slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 特殊文字を除去
      .replace(/[\s_-]+/g, '-') // スペースをハイフンに
      .replace(/^-+|-+$/g, ''); // 先頭末尾のハイフンを除去
  }
}
```

## 使用例

### Markdownユーティリティの使用

```typescript
// Before
const lines = content.split('\n');
let metadata = {};
// ... 30行のパース処理

// After
const { metadata, content } = MarkdownUtils.parse(markdown);
```

### 日付ユーティリティの使用

```typescript
// Before
const date = new Date();
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const formatted = `${year}-${month}-${day}`;

// After
const formatted = DateUtils.today();
```

### 配列ユーティリティの使用

```typescript
// Before
const grouped = {};
for (const item of items) {
  const key = item.type;
  if (!grouped[key]) {
    grouped[key] = [];
  }
  grouped[key].push(item);
}

// After
const grouped = ArrayUtils.groupBy(items, item => item.type);
```

## 移行計画

### Phase 1: ユーティリティ作成（2日）
1. 全ユーティリティクラスの実装
2. 単体テストの作成
3. ドキュメントの作成

### Phase 2: 段階的移行（3日）
1. 最も使用頻度の高い箇所から置き換え
2. テストを実行して動作確認
3. コードレビュー

### Phase 3: 完全移行（2日）
1. 残りの箇所を一括置き換え
2. 統合テストの実行
3. 不要なコードの削除

## 成功指標

### 定量的指標
- 重複コード削減: 2,000行以上
- ユーティリティ関数: 50個以上
- テストカバレッジ: 100%

### 定性的指標
- コードの一貫性向上
- バグの減少
- 新機能開発の高速化

## リスクと対策

### リスク1: 過度な抽象化
- **対策**: 3回以上使用される機能のみ共通化

### リスク2: パフォーマンス劣化
- **対策**: ベンチマークテストで検証

### リスク3: 既存コードの破壊
- **対策**: 段階的移行と十分なテスト