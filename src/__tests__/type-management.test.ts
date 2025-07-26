import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { TypeRepository } from '../database/type-repository.js';
import { TypeHandlers } from '../handlers/type-handlers.js';
import { FileIssueDatabase } from '../database/index.js';
import * as os from 'os';

describe('Type Management', () => {
  let testDataDir: string;
  let sqlitePath: string;
  let db: FileIssueDatabase;
  let typeRepo: TypeRepository;

  beforeEach(async () => {
    // Create temporary test directory
    testDataDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp', 'type-test-'));
    sqlitePath = path.join(testDataDir, 'test.db');
    db = new FileIssueDatabase(testDataDir, sqlitePath);
    await db.initialize();
    typeRepo = new TypeRepository(db);
    await typeRepo.init();
  });

  afterEach(async () => {
    // Close database connection
    db.close();
    
    // Clean up test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('TypeRepository', () => {
    it('should create a new type', async () => {
      await typeRepo.createType('guideline');
      
      // Verify type was created in sequences table
      const types = await typeRepo.getAllTypes();
      const guideline = types.find(t => t.type === 'guideline');
      
      expect(guideline).toBeDefined();
      expect(guideline?.base_type).toBe('documents');
      // is_custom is deprecated, all types are treated equally
      
      // Verify directory was created
      const typeDir = path.join(testDataDir, 'documents', 'guideline');
      const dirExists = await fs.stat(typeDir).then(() => true).catch(() => false);
      expect(dirExists).toBe(true);
    });

    it('should not allow creating duplicate types', async () => {
      await typeRepo.createType('test_type');

      await expect(typeRepo.createType('test_type'))
        .rejects.toThrow('already exists');
    });

    it('should not allow invalid type names', async () => {
      await expect(typeRepo.createType('Test-Type'))
        .rejects.toThrow('Type name must start with a letter and contain only lowercase letters');
    });

    it('should delete custom types', async () => {
      await typeRepo.createType('temp_type');

      await typeRepo.deleteType('temp_type');
      
      const types = await typeRepo.getAllTypes();
      expect(types.filter(t => t.type === 'temp_type')).toHaveLength(0);
    });

    it('should get all types including default types', async () => {
      const allTypes = await typeRepo.getAllTypes();
      
      // Should include default types
      const typeNames = allTypes.map(t => t.type);
      expect(typeNames).toContain('issues');
      expect(typeNames).toContain('plans');
      expect(typeNames).toContain('docs');
      expect(typeNames).toContain('knowledge');
      
      allTypes.forEach(type => {
        expect(type.base_type).toBeDefined();
        expect(type.base_type).toBeDefined();
      });
    });

    it('should prevent deleting types with existing documents', async () => {
      await typeRepo.createType('used_type');

      // Simulate having documents of this type
      const docPath = path.join(testDataDir, 'documents', 'used_type', 'used_types-1.md');
      await fs.mkdir(path.dirname(docPath), { recursive: true });
      await fs.writeFile(docPath, '---\ntitle: Test\n---\n\nContent');
      
      await expect(typeRepo.deleteType('used_type')).rejects.toThrow('has existing documents');
    });

    it('should properly check if type exists', async () => {
      await typeRepo.createType('exists_type');

      const exists = await typeRepo.typeExists('exists_type');
      expect(exists).toBe(true);
      
      const notExists = await typeRepo.typeExists('does_not_exist');
      expect(notExists).toBe(false);
    });

    it('should check if type has items', async () => {
      await typeRepo.createType('check_type');

      const hasItems = await typeRepo.hasDocumentsOfType('check_type');
      expect(hasItems).toBe(false);
      
      // Create a document
      const docPath = path.join(testDataDir, 'documents', 'check_type', 'check_types-1.md');
      await fs.mkdir(path.dirname(docPath), { recursive: true });
      await fs.writeFile(docPath, '---\ntitle: Test\n---\n\nContent');
      
      const hasItemsAfter = await typeRepo.hasDocumentsOfType('check_type');
      expect(hasItemsAfter).toBe(true);
    });
  });

  describe('TypeHandlers', () => {
    let typeHandlers: TypeHandlers;

    beforeEach(async () => {
      typeHandlers = new TypeHandlers(db);
      await typeHandlers.init();
    });

    it('should handle create_type tool', async () => {
      const result = await typeHandlers.handleCreateType({
        name: 'recipe'
      });

      expect(result.content[0].text).toContain('Type "recipe" created successfully');
      
      // Verify type exists
      const types = await typeRepo.getAllTypes();
      const recipe = types.find(t => t.type === 'recipe');
      expect(recipe).toBeDefined();
    });

    it('should handle get_types tool', async () => {
      // Create a custom type first
      await typeRepo.createType('custom_test');

      const result = await typeHandlers.handleGetTypes({});

      expect(result.content[0].text).toContain('Available Types');
      expect(result.content[0].text).toContain('issues');
      expect(result.content[0].text).toContain('custom_test');
    });

    it('should handle delete_type tool', async () => {
      await typeRepo.createType('to_delete');

      const result = await typeHandlers.handleDeleteType({
        name: 'to_delete'
      });

      expect(result.content[0].text).toContain('Type "to_delete" deleted successfully');
      
      // Verify type is gone
      const exists = await typeRepo.typeExists('to_delete');
      expect(exists).toBe(false);
    });

    it('should create task type with base_type', async () => {
      const result = await typeHandlers.handleCreateType({
        name: 'bugs',
        base_type: 'tasks'
      });

      expect(result.content[0].text).toContain('Type "bugs" created successfully with base_type "tasks"');
      
      // Verify type exists with correct base_type
      const types = await typeRepo.getAllTypes();
      const bugs = types.find(t => t.type === 'bugs');
      expect(bugs).toBeDefined();
      expect(bugs?.base_type).toBe('tasks');
    });
  });

  describe('Integration with create_item', () => {
    it('should allow creating items with custom types', async () => {
      // Create a custom type
      await typeRepo.createType('recipe');

      // Create an item with the custom type
      const item = await db.createDocument('recipe', 'Chocolate Cake', 'A delicious chocolate cake recipe', ['dessert', 'baking']);
      
      expect(item.type).toBe('recipe');
      expect(item.id).toBe(1);
      expect(item.title).toBe('Chocolate Cake');
      
      // Verify file was created in type-specific subdirectory
      const filePath = path.join(testDataDir, 'documents', 'recipe', 'recipe-1.md');
      const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should allow retrieving items with custom types', async () => {
      // Create a custom type and add items
      await typeRepo.createType('recipe');
      await db.createDocument('recipe', 'Pasta', 'Italian pasta recipe', ['italian']);
      await db.createDocument('recipe', 'Pizza', 'Pizza recipe', ['italian']);

      // Get all items of custom type
      const items = await db.getAllDocumentsSummary('recipe');
      
      expect(items).toHaveLength(2);
      expect(items[0].type).toBe('recipe');
      expect(items.map(i => i.title)).toContain('Pasta');
      expect(items.map(i => i.title)).toContain('Pizza');
    });
  });
});