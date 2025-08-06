/**
 * @ai-context Test for version field functionality (issues-81)
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { FileIssueDatabase } from '../database.js';
import type { ItemRepository } from '../database/item-repository.js';
import type { CreateItemParams } from '../types/unified-types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseMarkdown } from '../utils/markdown-parser.js';

describe('Version Field Implementation', () => {
  let db: FileIssueDatabase;
  let itemRepo: ItemRepository;
  const testDatabaseRoot = './test-db-version';
  const testDbPath = path.join(testDatabaseRoot, 'test-version.db');

  beforeEach(async () => {
    // Setup test database
    await fs.mkdir(testDatabaseRoot, { recursive: true });
    db = new FileIssueDatabase(testDatabaseRoot, testDbPath);
    await db.initialize();

    // Get item repository from database
    itemRepo = db.getItemRepository();

    // Create test directories
    await fs.mkdir(path.join(testDatabaseRoot, 'issues'), { recursive: true });
    await fs.mkdir(path.join(testDatabaseRoot, 'docs'), { recursive: true });
    await fs.mkdir(path.join(testDatabaseRoot, 'knowledge'), { recursive: true });
  });

  afterEach(async () => {
    await db.close();
    await fs.rm(testDatabaseRoot, { recursive: true, force: true });
  });

  it('should save version field to markdown file', async () => {
    const params: CreateItemParams = {
      type: 'issues',
      title: 'Test Issue with Version',
      description: 'Testing version field',
      content: 'This is a test issue',
      priority: 'high',
      status: 'Open',
      version: '1.2.3',
      tags: ['test', 'version']
    };

    const item = await itemRepo.createItem(params);
    
    // Check that item has version
    expect(item.version).toBe('1.2.3');

    // Read markdown file directly
    const filePath = path.join(testDatabaseRoot, 'issues', `issues-${item.id}.md`);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { metadata } = parseMarkdown(fileContent);

    // Debug: Print file content
    console.log('File content:', fileContent);
    console.log('Metadata:', metadata);
    
    // Check that version is saved in markdown
    expect(metadata.version).toBe('1.2.3');
  });

  it('should retrieve version field when getting item', async () => {
    const params: CreateItemParams = {
      type: 'docs',
      title: 'Test Doc with Version',
      content: 'Documentation content',
      version: '2.0.0',
      tags: ['docs']
    };

    const created = await itemRepo.createItem(params);
    const retrieved = await itemRepo.getItem('docs', created.id);

    expect(retrieved).toBeTruthy();
    expect(retrieved!.version).toBe('2.0.0');
  });

  it('should update version field', async () => {
    const params: CreateItemParams = {
      type: 'knowledge',
      title: 'Knowledge with Version',
      content: 'Knowledge content',
      version: '1.0.0',
      tags: ['knowledge']
    };

    const created = await itemRepo.createItem(params);
    
    // Update version
    const updated = await itemRepo.updateItem({
      type: 'knowledge',
      id: created.id,
      version: '1.1.0'
    });

    expect(updated).toBeTruthy();
    expect(updated!.version).toBe('1.1.0');

    // Verify in markdown
    const filePath = path.join(testDatabaseRoot, 'knowledge', `knowledge-${created.id}.md`);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { metadata } = parseMarkdown(fileContent);
    expect(metadata.version).toBe('1.1.0');
  });

  it('should handle items without version field', async () => {
    const params: CreateItemParams = {
      type: 'issues',
      title: 'Issue without Version',
      content: 'No version specified',
      priority: 'medium',
      status: 'Open',
      tags: []
    };

    const item = await itemRepo.createItem(params);
    
    expect(item.version).toBeUndefined();

    // Check markdown
    const filePath = path.join(testDatabaseRoot, 'issues', `issues-${item.id}.md`);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { metadata } = parseMarkdown(fileContent);
    
    // When version is not specified, it's saved as empty value and parsed as null
    expect(metadata.version).toBe(null);
  });

  it('should handle various version formats', async () => {
    const versions = [
      'v1.0.0',
      '2.1.3-beta',
      '0.7.11',
      '2024.01.15',
      'release-3.0',
      '1.0.0-alpha.1'
    ];

    for (const version of versions) {
      const params: CreateItemParams = {
        type: 'issues',
        title: `Issue with version ${version}`,
        content: 'Testing version formats',
        priority: 'low',
        status: 'Open',
        version: version,
        tags: ['version-test']
      };

      const item = await itemRepo.createItem(params);
      expect(item.version).toBe(version);

      // Verify retrieval
      const retrieved = await itemRepo.getItem('issues', item.id);
      expect(retrieved!.version).toBe(version);
    }
  });

  it('should preserve version during partial updates', async () => {
    const params: CreateItemParams = {
      type: 'docs',
      title: 'Doc with Version',
      content: 'Initial content',
      version: '1.5.0',
      tags: ['test']
    };

    const created = await itemRepo.createItem(params);
    
    // Update other fields without touching version
    const updated = await itemRepo.updateItem({
      type: 'docs',
      id: created.id,
      title: 'Updated Title',
      content: 'Updated content'
    });

    expect(updated!.version).toBe('1.5.0'); // Version should be preserved
    expect(updated!.title).toBe('Updated Title');
  });

  it('should clear version when explicitly set to null', async () => {
    const params: CreateItemParams = {
      type: 'knowledge',
      title: 'Knowledge with Version',
      content: 'Content',
      version: '3.0.0',
      tags: []
    };

    const created = await itemRepo.createItem(params);
    expect(created.version).toBe('3.0.0');

    // Clear version by setting to undefined
    const updated = await itemRepo.updateItem({
      type: 'knowledge',
      id: created.id,
      version: undefined
    });

    expect(updated!.version).toBeUndefined();
  });

  it('should handle version in different item types', async () => {
    const itemTypes = [
      { type: 'issues', status: 'Open', priority: 'high' as const },
      { type: 'plans', status: 'Open', priority: 'medium' as const },
      { type: 'docs' },
      { type: 'knowledge' }
    ];

    for (const itemType of itemTypes) {
      const params: CreateItemParams = {
        type: itemType.type,
        title: `${itemType.type} with version`,
        content: 'Testing version across types',
        version: '1.0.0',
        tags: ['test'],
        ...(itemType.status && { status: itemType.status }),
        ...(itemType.priority && { priority: itemType.priority })
      };

      const item = await itemRepo.createItem(params);
      expect(item.version).toBe('1.0.0');
      expect(item.type).toBe(itemType.type);
    }
  });

  it('should include version in search results', async () => {
    // Create items with versions
    await itemRepo.createItem({
      type: 'issues',
      title: 'Issue with Version',
      content: 'Searchable content',
      priority: 'high',
      status: 'Open',
      version: '2.0.0',
      tags: ['searchme']
    });

    await itemRepo.createItem({
      type: 'docs',
      title: 'Doc with Version',
      content: 'Searchable content',
      version: '3.0.0',
      tags: ['searchme']
    });

    // Search by tag
    const results = await itemRepo.searchItemsByTag('searchme');
    
    // Check that version is included in results
    const issueResult = results.find(r => r.type === 'issues');
    const docResult = results.find(r => r.type === 'docs');
    
    expect(issueResult).toBeDefined();
    expect(issueResult!.version).toBe('2.0.0');
    expect(docResult).toBeDefined();
    expect(docResult!.version).toBe('3.0.0');
  });

  it('should handle version in list operations', async () => {
    // Create multiple items with versions
    await itemRepo.createItem({
      type: 'issues',
      title: 'Issue 1',
      content: 'Content 1',
      priority: 'high',
      status: 'Open',
      version: '1.0.0',
      tags: []
    });

    await itemRepo.createItem({
      type: 'issues',
      title: 'Issue 2',
      content: 'Content 2',
      priority: 'medium',
      status: 'Open',
      version: '2.0.0',
      tags: []
    });

    await itemRepo.createItem({
      type: 'issues',
      title: 'Issue 3',
      content: 'Content 3',
      priority: 'low',
      status: 'Open',
      tags: []
      // No version
    });

    // Get all items
    const items = await itemRepo.getItems('issues');
    
    expect(items.length).toBeGreaterThanOrEqual(3);
    
    const issue1 = items.find(i => i.title === 'Issue 1');
    const issue2 = items.find(i => i.title === 'Issue 2');
    const issue3 = items.find(i => i.title === 'Issue 3');
    
    expect(issue1!.version).toBe('1.0.0');
    expect(issue2!.version).toBe('2.0.0');
    expect(issue3!.version).toBeUndefined();
  });
});