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
});