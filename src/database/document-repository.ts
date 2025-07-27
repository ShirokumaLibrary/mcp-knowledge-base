/**
 * @ai-context Unified repository for document types (doc/knowledge)
 * @ai-pattern Repository pattern with dual storage (Markdown + SQLite)
 * @ai-critical Replaces separate DocRepository and KnowledgeRepository
 * @ai-dependencies BaseRepository for shared functionality
 * @ai-filesystem Documents stored in {dataDir}/documents/{type}/{type}-{id}.md
 * @ai-database-schema Uses search_documents table with composite key (type, id)
 */

import type { Database } from './base.js';
import { BaseRepository } from './base.js';
import type { Document, DocumentSummary } from '../types/domain-types.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import { glob } from 'glob';
import { TagRepository } from './tag-repository.js';
// Type registry removed - using direct type names

/**
 * @ai-intent Repository for unified document management
 * @ai-pattern Combines doc and knowledge repositories
 * @ai-critical Uses type field to maintain separate ID sequences
 * @ai-related-files
 *   - src/database/doc-repository.ts (replaced)
 *   - src/database/knowledge-repository.ts (replaced)
 * @ai-data-flow
 *   1. Create/Update -> Write markdown file -> Sync to SQLite
 *   2. Read -> Load from markdown file
 *   3. Search -> Query SQLite -> Load details from files
 */
export class DocumentRepository extends BaseRepository {
  private documentsPath: string;
  private tagRepo: TagRepository;

  constructor(db: Database, documentsPath: string) {
    super(db, 'DocumentRepository');
    this.documentsPath = documentsPath;
    this.tagRepo = new TagRepository(db);
  }

  /**
   * @ai-intent Ensure documents directory structure exists
   * @ai-side-effects Creates directories if missing
   * @ai-filesystem Creates documents/docs and documents/knowledge subdirectories
   */
  async ensureDirectories(): Promise<void> {
    // Create main documents directory
    await fs.mkdir(this.documentsPath, { recursive: true });
  }

  /**
   * @ai-intent Normalize type to sequence type for consistency
   * @ai-logic Maps 'doc' to 'docs' but keeps others as-is
   * @ai-why Ensures consistent file naming across the system
   */
  private async normalizeSequenceType(type: string): Promise<string> {
    // Check if this type exists in sequences table
    const sequenceType = await this.getSequenceType(type);
    if (sequenceType) {
      return sequenceType;
    }


    // Default: return as-is
    return type;
  }

  /**
   * @ai-intent Get directory name for a given type
   * @ai-logic Documents are stored in a single documents directory
   * @ai-why Simplifies directory structure for document types
   */
  private getTypeDirectory(type: string): string {
    // All documents go in the same directory
    return '';
  }

  /**
   * @ai-intent Get all document patterns including custom types
   */
  private async getAllDocumentPatterns(): Promise<string[]> {
    const patterns: string[] = [];

    // Get all document types from sequences table
    const sequences = await this.db.allAsync(
      'SELECT type FROM sequences WHERE base_type = \'documents\''
    ) as Array<{ type: string }>;

    // Add pattern for each type in its subdirectory
    for (const seq of sequences) {
      patterns.push(`${this.documentsPath}/${seq.type}/${seq.type}-*.md`);
    }

    return patterns;
  }

  /**
   * @ai-intent Create new document with type-specific ID
   * @ai-flow 1. Get next ID for type -> 2. Create file -> 3. Sync to SQLite
   * @ai-critical Content is required for documents
   * @ai-side-effects Creates markdown file and SQLite record
   */
  async createDocument(
    type: string,  // Allow any type, not just 'doc' | 'knowledge'
    title: string,
    content: string,
    tags: string[] = [],
    description?: string,
    related_tasks?: string[],
    related_documents?: string[]
  ): Promise<Document> {
    await this.ensureDirectories();

    // Ensure documents directory exists
    await this.ensureDirectories();

    // Get next ID for the specific type
    const sequenceType = await this.normalizeSequenceType(type);
    const id = await this.getNextSequenceValue(sequenceType);

    const now = new Date().toISOString();
    const document: Document = {
      type,
      id,
      title,
      description,
      content,
      tags: tags || [],
      related_tasks: related_tasks || [],
      related_documents: related_documents || [],
      created_at: now,
      updated_at: now
    };

    // @ai-critical: Create file with type-specific naming
    const fileName = `${sequenceType}-${id}.md`;
    // Create in type-specific subdirectory
    const typeDir = path.join(this.documentsPath, sequenceType);
    await fs.mkdir(typeDir, { recursive: true });
    const filePath = path.join(typeDir, fileName);
    const metadata = {
      id: document.id,
      title: document.title,
      description: document.description,
      tags: document.tags,
      related_tasks: document.related_tasks,
      related_documents: document.related_documents,
      created_at: document.created_at,
      updated_at: document.updated_at
    };
    const markdown = generateMarkdown(metadata, document.content);

    await fs.writeFile(filePath, markdown, 'utf-8');
    await this.syncDocumentToSQLite(document);

    // @ai-side-effect: Auto-register tags
    if (tags && tags.length > 0) {
      await this.tagRepo.ensureTagsExist(tags);
    }

    return document;
  }

  /**
   * @ai-intent Get document by type and ID
   * @ai-flow 1. Check file exists -> 2. Parse markdown -> 3. Return document
   * @ai-return Document object or null if not found
   */
  async getDocument(type: string, id: number): Promise<Document | null> {
    // @ai-logic: Use type registry for consistent file naming
    const sequenceType = await this.normalizeSequenceType(type);
    const fileName = `${sequenceType}-${id}.md`;
    const typeDir = path.join(this.documentsPath, sequenceType);
    await fs.mkdir(typeDir, { recursive: true });
    const filePath = path.join(typeDir, fileName);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { metadata, content: markdownContent } = parseMarkdown(content);

      return {
        type,
        id,
        title: metadata.title,
        description: metadata.description,
        content: markdownContent,
        tags: metadata.tags || [],
        related_tasks: metadata.related_tasks || [],
        related_documents: metadata.related_documents || [],
        created_at: metadata.created_at,
        updated_at: metadata.updated_at
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * @ai-intent Update existing document
   * @ai-flow 1. Load current -> 2. Apply changes -> 3. Save -> 4. Sync
   * @ai-pattern Partial updates supported
   */
  async updateDocument(
    type: string,
    id: number,
    title?: string,
    content?: string,
    tags?: string[],
    description?: string,
    related_tasks?: string[],
    related_documents?: string[]
  ): Promise<boolean> {
    const current = await this.getDocument(type, id);
    if (!current) {
      return false;
    }

    // Apply updates
    if (title !== undefined) {
      current.title = title;
    }
    if (content !== undefined) {
      current.content = content;
    }
    if (description !== undefined) {
      current.description = description || undefined;
    }
    if (tags !== undefined) {
      current.tags = tags;
      await this.tagRepo.ensureTagsExist(tags);
    }
    if (related_tasks !== undefined) {
      current.related_tasks = related_tasks;
    }
    if (related_documents !== undefined) {
      current.related_documents = related_documents;
    }
    current.updated_at = new Date().toISOString();

    // Save to file with consistent naming
    const sequenceType = await this.normalizeSequenceType(type);
    const fileName = `${sequenceType}-${id}.md`;
    const typeDir = path.join(this.documentsPath, sequenceType);
    await fs.mkdir(typeDir, { recursive: true });
    const filePath = path.join(typeDir, fileName);
    const metadata = {
      id: current.id,
      title: current.title,
      description: current.description,
      tags: current.tags,
      related_tasks: current.related_tasks,
      related_documents: current.related_documents,
      created_at: current.created_at,
      updated_at: current.updated_at
    };
    const markdown = generateMarkdown(metadata, current.content);
    await fs.writeFile(filePath, markdown, 'utf-8');

    // Sync to SQLite
    await this.syncDocumentToSQLite(current);

    return true;
  }

  /**
   * @ai-intent Delete document by type and ID
   * @ai-flow 1. Delete file -> 2. Remove from SQLite
   * @ai-side-effects Permanent deletion, cascades to document_tags
   */
  async deleteDocument(type: string, id: number): Promise<boolean> {
    // @ai-logic: Delete file from type-specific subdirectory
    const sequenceType = await this.normalizeSequenceType(type);
    const fileName = `${sequenceType}-${id}.md`;
    const filePath = path.join(this.documentsPath, sequenceType, fileName);

    try {
      await fs.unlink(filePath);
      // CASCADE DELETE handles document_tags cleanup
      await this.db.runAsync(
        'DELETE FROM search_documents WHERE type = ? AND id = ?',
        [type, id]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * @ai-intent Get all documents of a specific type
   * @ai-flow 1. List files -> 2. Parse each -> 3. Return array
   * @ai-performance Consider pagination for large datasets
   */
  async getAllDocuments(type?: string): Promise<Document[]> {
    await this.ensureDirectories();

    // @ai-logic: Use type registry for pattern generation
    const patterns = type
      ? (() => {
        return [`${this.documentsPath}/${type}/${type}-*.md`];
      })()
      : await this.getAllDocumentPatterns();

    const documents: Document[] = [];

    for (const pattern of patterns) {
      const files = await glob(pattern);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const { metadata, content: markdownContent } = parseMarkdown(content);

        // Extract type from filename pattern
        const filename = path.basename(file);
        const match = filename.match(/^(\w+)-(\d+)\.md$/);
        if (!match) {
          continue;
        }

        const prefix = match[1];
        const id = parseInt(match[2]);

        // Find type by prefix
        let fileType = prefix;
        // Use the prefix as the type directly
        fileType = prefix;

        documents.push({
          type: fileType,
          id,
          title: metadata.title,
          description: metadata.description,
          content: markdownContent,
          tags: metadata.tags || [],
          related_tasks: metadata.related_tasks || [],
          related_documents: metadata.related_documents || [],
          created_at: metadata.created_at,
          updated_at: metadata.updated_at
        });
      }
    }

    return documents.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * @ai-intent Get document summaries for list views
   * @ai-performance Excludes content field for efficiency
   * @ai-return Lightweight summary objects
   */
  async getAllDocumentsSummary(type?: string): Promise<DocumentSummary[]> {
    const whereClause = type ? 'WHERE type = ?' : '';
    const params = type ? [type] : [];

    const rows = await this.db.allAsync(
      `SELECT type, id, title, summary as description, tags, created_at, updated_at 
       FROM search_documents ${whereClause}
       ORDER BY created_at DESC`,
      params
    );

    return rows.map((row: any) => ({
      type: row.type,
      id: row.id,
      title: row.title,
      description: row.description,
      tags: row.tags ? JSON.parse(row.tags) : [],
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  }

  /**
   * @ai-intent Search documents by tag
   * @ai-flow 1. Query document_tags -> 2. Load documents
   * @ai-pattern Uses JOIN for efficient tag filtering
   */
  async searchDocumentsByTag(tag: string, type?: string): Promise<Document[]> {
    const typeClause = type ? 'AND d.type = ?' : '';
    const params = type ? [tag, type] : [tag];

    const rows = await this.db.allAsync(
      `SELECT DISTINCT d.type, d.id 
       FROM search_documents d
       JOIN document_tags dt ON d.type = dt.document_type AND d.id = dt.document_id
       JOIN tags t ON dt.tag_id = t.id
       WHERE t.name = ? ${typeClause}`,
      params
    );

    const documents: Document[] = [];
    for (const row of rows) {
      const doc = await this.getDocument(String(row.type), Number(row.id));
      if (doc) {
        documents.push(doc);
      }
    }

    return documents;
  }

  /**
   * @ai-intent Sync document to SQLite for searching
   * @ai-flow 1. Prepare data -> 2. UPSERT to search table -> 3. Update tags
   * @ai-side-effects Updates search_documents and document_tags tables
   * @ai-critical Uses composite primary key (type, id)
   */
  async syncDocumentToSQLite(document: Document): Promise<void> {
    const tagList = Array.isArray(document.tags) ? document.tags : [];
    const tagsJson = JSON.stringify(tagList);

    await this.db.runAsync(`
      INSERT OR REPLACE INTO search_documents 
      (type, id, title, summary, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      document.type,
      document.id,
      document.title,
      document.description || null,
      document.content,
      tagsJson,
      document.created_at,
      document.updated_at
    ]
    );

    // Update document_tags relationship
    await this.db.runAsync(
      'DELETE FROM document_tags WHERE document_type = ? AND document_id = ?',
      [document.type, document.id]
    );

    if (tagList.length > 0) {
      const tagIdMap = await this.tagRepo.getTagIds(tagList);
      for (const [, tagId] of tagIdMap) {
        await this.db.runAsync(
          'INSERT INTO document_tags (document_type, document_id, tag_id) VALUES (?, ?, ?)',
          [document.type, document.id, tagId]
        );

        // Update related tasks
        await this.db.runAsync(
          'DELETE FROM related_tasks WHERE (source_type = ? AND source_id = ?)',
          [document.type, document.id]
        );

        if (document.related_tasks && document.related_tasks.length > 0) {
          for (const taskRef of document.related_tasks) {
            const [targetType, targetId] = taskRef.split('-');
            if (targetType && targetId) {
              await this.db.runAsync(
                'INSERT OR IGNORE INTO related_tasks (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)',
                [document.type, document.id, targetType, parseInt(targetId)]
              );
            }
          }
        }

        // Update related documents
        await this.db.runAsync(
          'DELETE FROM related_documents WHERE (source_type = ? AND source_id = ?)',
          [document.type, document.id.toString()]
        );

        if (document.related_documents && document.related_documents.length > 0) {
          for (const docRef of document.related_documents) {
            const [targetType, targetId] = docRef.split('-');
            if (targetType && targetId) {
              await this.db.runAsync(
                'INSERT OR IGNORE INTO related_documents (source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?)',
                [document.type, document.id.toString(), targetType, parseInt(targetId)]
              );
            }
          }
        }
      }
    }
  }

  /**
   * @ai-intent Initialize search_documents table
   * @ai-critical Must be called during database setup
   * @ai-side-effects Creates table and indexes if not exist
   */
  async initializeDatabase(): Promise<void> {
    // Create search_documents table
    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS search_documents (
        type TEXT NOT NULL,
        id INTEGER NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,  -- Keep column name for backward compatibility
        content TEXT,
        tags TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (type, id)
      )
    `);

    // Create document_tags relationship table
    await this.db.runAsync(`
      CREATE TABLE IF NOT EXISTS document_tags (
        document_type TEXT NOT NULL,
        document_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (document_type, document_id, tag_id),
        FOREIGN KEY (document_type, document_id) 
          REFERENCES search_documents(type, id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await this.db.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_documents_text 
       ON search_documents(title, content, summary)`
    );
    await this.db.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_documents_tags 
       ON search_documents(tags)`
    );
    await this.db.runAsync(
      `CREATE INDEX IF NOT EXISTS idx_document_tags_lookup 
       ON document_tags(tag_id)`
    );
  }
}