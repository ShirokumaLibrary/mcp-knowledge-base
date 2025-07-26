import { DocumentRepository } from '../database/document-repository.js';
import { DatabaseConnection } from '../database/base.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('DocumentRepository', () => {
  let db: any;
  let repo: DocumentRepository;
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test data
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-documents-'));
    
    // Initialize database
    const connection = new DatabaseConnection(':memory:');
    await connection.initialize();
    db = connection.getDatabase();
    
    // Create repository
    repo = new DocumentRepository(db, testDir);
    await repo.initializeDatabase();
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('createDocument', () => {
    it('should create a doc with proper ID sequence', async () => {
      const doc = await repo.createDocument(
        'docs',
        'Test Document',
        'This is test content',
        ['test', 'doc'],
        'Test description'
      );

      expect(doc.type).toBe('docs');
      expect(doc.id).toBe(1);
      expect(doc.title).toBe('Test Document');
      expect(doc.content).toBe('This is test content');
      expect(doc.tags).toEqual(['test', 'doc']);
      expect(doc.description).toBe('Test description');

      // Verify file was created with plural prefix
      const filePath = path.join(testDir, 'docs', 'docs-1.md');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create a knowledge with proper ID sequence', async () => {
      const knowledge = await repo.createDocument(
        'knowledge',
        'Test Knowledge',
        'This is knowledge content',
        ['test', 'knowledge']
      );

      expect(knowledge.type).toBe('knowledge');
      expect(knowledge.id).toBe(1);
      expect(knowledge.title).toBe('Test Knowledge');
      expect(knowledge.content).toBe('This is knowledge content');
      expect(knowledge.tags).toEqual(['test', 'knowledge']);

      // Verify file was created
      const filePath = path.join(testDir, 'knowledge', 'knowledge-1.md');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should maintain separate ID sequences for docs and knowledge', async () => {
      // Create multiple documents of each type
      const doc1 = await repo.createDocument('docs', 'Doc 1', 'Content 1');
      const knowledge1 = await repo.createDocument('knowledge', 'Knowledge 1', 'Content 1');
      const doc2 = await repo.createDocument('docs', 'Doc 2', 'Content 2');
      const knowledge2 = await repo.createDocument('knowledge', 'Knowledge 2', 'Content 2');

      expect(doc1.id).toBe(1);
      expect(doc2.id).toBe(2);
      expect(knowledge1.id).toBe(1);
      expect(knowledge2.id).toBe(2);
    });
  });

  describe('getDocument', () => {
    it('should retrieve document by type and ID', async () => {
      const created = await repo.createDocument(
        'docs',
        'Test Document',
        'Test content',
        ['test']
      );

      const retrieved = await repo.getDocument('docs', created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.type).toBe('docs');
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.title).toBe('Test Document');
      expect(retrieved!.content).toBe('Test content');
    });

    it('should return null for non-existent document', async () => {
      const result = await repo.getDocument('docs', 999);
      expect(result).toBeNull();
    });
  });

  describe('updateDocument', () => {
    it('should update document fields', async () => {
      const created = await repo.createDocument(
        'knowledge',
        'Original Title',
        'Original content',
        ['original']
      );

      const success = await repo.updateDocument(
        'knowledge',
        created.id,
        'Updated Title',
        'Updated content',
        ['updated', 'tag'],
        'Updated description'
      );

      expect(success).toBe(true);

      const updated = await repo.getDocument('knowledge', created.id);
      expect(updated!.title).toBe('Updated Title');
      expect(updated!.content).toBe('Updated content');
      expect(updated!.tags).toEqual(['updated', 'tag']);
      expect(updated!.description).toBe('Updated description');
    });
  });

  describe('deleteDocument', () => {
    it('should delete document', async () => {
      const created = await repo.createDocument('docs', 'To Delete', 'Content');
      
      const success = await repo.deleteDocument('docs', created.id);
      expect(success).toBe(true);

      const retrieved = await repo.getDocument('docs', created.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('getAllDocuments', () => {
    it('should retrieve all documents of specific type', async () => {
      await repo.createDocument('docs', 'Doc 1', 'Content 1');
      await repo.createDocument('docs', 'Doc 2', 'Content 2');
      await repo.createDocument('knowledge', 'Knowledge 1', 'Content 1');

      const docs = await repo.getAllDocuments('docs');
      expect(docs).toHaveLength(2);
      expect(docs.every(d => d.type === 'docs')).toBe(true);

      const knowledge = await repo.getAllDocuments('knowledge');
      expect(knowledge).toHaveLength(1);
      expect(knowledge[0].type).toBe('knowledge');
    });

    it('should retrieve all documents when type not specified', async () => {
      await repo.createDocument('docs', 'Doc 1', 'Content 1');
      await repo.createDocument('knowledge', 'Knowledge 1', 'Content 1');

      const all = await repo.getAllDocuments();
      expect(all).toHaveLength(2);
      expect(all.some(d => d.type === 'docs')).toBe(true);
      expect(all.some(d => d.type === 'knowledge')).toBe(true);
    });
  });

  describe('searchDocumentsByTag', () => {
    it('should find documents by tag', async () => {
      await repo.createDocument('docs', 'Doc 1', 'Content 1', ['shared', 'doc']);
      await repo.createDocument('knowledge', 'Knowledge 1', 'Content 1', ['shared', 'knowledge']);
      await repo.createDocument('docs', 'Doc 2', 'Content 2', ['other']);

      const results = await repo.searchDocumentsByTag('shared');
      expect(results).toHaveLength(2);
      expect(results.some(d => d.type === 'docs' && d.title === 'Doc 1')).toBe(true);
      expect(results.some(d => d.type === 'knowledge' && d.title === 'Knowledge 1')).toBe(true);
    });

    it('should filter by type when specified', async () => {
      await repo.createDocument('docs', 'Doc 1', 'Content 1', ['shared']);
      await repo.createDocument('knowledge', 'Knowledge 1', 'Content 1', ['shared']);

      const docs = await repo.searchDocumentsByTag('shared', 'docs');
      expect(docs).toHaveLength(1);
      expect(docs[0].type).toBe('docs');
    });
  });
});