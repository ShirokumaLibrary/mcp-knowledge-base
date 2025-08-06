import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { TypeRepository } from '../database/type-repository.js';
import { TypeHandlers } from '../handlers/type-handlers.js';
import { FileIssueDatabase } from '../database/index.js';

describe('Type Management', () => {
  let testDataDir: string;
  let sqlitePath: string;
  let db: FileIssueDatabase;
  let typeRepo: TypeRepository;

  beforeEach(async () => {
    // Create temporary test directory with unique suffix to avoid conflicts
    testDataDir = await fs.mkdtemp(path.join(os.tmpdir(), `type-test-${process.pid}-${Date.now()}-`));
    sqlitePath = path.join(testDataDir, 'test.db');
    db = new FileIssueDatabase(testDataDir, sqlitePath);
    await db.initialize();
    // Use the TypeRepository instance from FileIssueDatabase instead of creating a new one
    typeRepo = db.getTypeRepository();
  });

  afterEach(async () => {
    // Close database connection
    await db.close();
    
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
      expect(guideline?.description).toBeUndefined(); // No description provided
      // is_custom is deprecated, all types are treated equally
      
      // Verify directory was created in correct location (flat structure, not nested)
      const typeDir = path.join(testDataDir, 'guideline');
      const dirExists = await fs.stat(typeDir).then(() => true).catch(() => false);
      expect(dirExists).toBe(true);
    });

    it('should create a new type with description', async () => {
      await typeRepo.createType('recipe', 'documents', 'Recipe collection with ingredients and instructions');
      
      const types = await typeRepo.getAllTypes();
      const recipe = types.find(t => t.type === 'recipe');
      
      expect(recipe).toBeDefined();
      expect(recipe?.base_type).toBe('documents');
      expect(recipe?.description).toBe('Recipe collection with ingredients and instructions');
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

    it('should delete types', async () => {
      await typeRepo.createType('temp_type');

      await typeRepo.deleteType('temp_type');
      
      const types = await typeRepo.getAllTypes();
      expect(types.filter(t => t.type === 'temp_type')).toHaveLength(0);
    });

    it('should update type description', async () => {
      await typeRepo.createType('update_type', 'documents', 'Original description');
      
      await typeRepo.updateType('update_type', 'Updated description');
      
      const types = await typeRepo.getAllTypes();
      const updatedType = types.find(t => t.type === 'update_type');
      expect(updatedType?.description).toBe('Updated description');
    });

    it('should get all types including default types with descriptions', async () => {
      const allTypes = await typeRepo.getAllTypes();
      
      // Should include default types
      const typeNames = allTypes.map(t => t.type);
      expect(typeNames).toContain('issues');
      expect(typeNames).toContain('plans');
      expect(typeNames).toContain('docs');
      expect(typeNames).toContain('knowledge');
      
      // Check default types have descriptions
      const issues = allTypes.find(t => t.type === 'issues');
      expect(issues?.description).toContain('Bug reports');
      
      const docs = allTypes.find(t => t.type === 'docs');
      expect(docs?.description).toContain('Technical documentation');
      
      allTypes.forEach(type => {
        expect(type.base_type).toBeDefined();
      });
    });

    it('should not allow creating existing types', async () => {
      // Test all initial configuration types
      await expect(typeRepo.createType('issues'))
        .rejects.toThrow('Type "issues" already exists');
      
      await expect(typeRepo.createType('plans'))
        .rejects.toThrow('Type "plans" already exists');
      
      await expect(typeRepo.createType('docs'))
        .rejects.toThrow('Type "docs" already exists');
      
      await expect(typeRepo.createType('knowledge'))
        .rejects.toThrow('Type "knowledge" already exists');
    });

    it('should not allow creating sessions or dailies types', async () => {
      // Sessions and dailies are special types that use date-based IDs
      await expect(typeRepo.createType('sessions'))
        .rejects.toThrow('Type "sessions" already exists');
      
      await expect(typeRepo.createType('dailies'))
        .rejects.toThrow('Type "dailies" already exists');
    });

    it('should prevent deleting types with existing documents', async () => {
      await typeRepo.createType('used_type');

      // Simulate having documents of this type
      // @ai-note: Unified structure stores items directly by type, not nested under base_type
      const docPath = path.join(testDataDir, 'used_type', 'used_type-1.md');
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
      // @ai-note: Unified structure stores items directly by type
      const docPath = path.join(testDataDir, 'check_type', 'check_type-1.md');
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

    it('should handle create_type tool with description', async () => {
      const result = await typeHandlers.handleCreateType({
        name: 'tutorial',
        base_type: 'documents',
        description: 'Step-by-step tutorials and how-to guides'
      });

      expect(result.content[0].text).toContain('Type "tutorial" created successfully');
      
      // Verify type exists with description
      const types = await typeRepo.getAllTypes();
      const tutorial = types.find(t => t.type === 'tutorial');
      expect(tutorial).toBeDefined();
      expect(tutorial?.description).toBe('Step-by-step tutorials and how-to guides');
    });

    it('should handle get_types tool', async () => {
      // Create a test type first
      await typeRepo.createType('test_type', 'documents', 'Test type for unit tests');

      const result = await typeHandlers.handleGetTypes({});

      expect(result.content[0].text).toContain('Available Types');
      expect(result.content[0].text).toContain('issues');
      expect(result.content[0].text).toContain('test_type');
      expect(result.content[0].text).toContain('Test type for unit tests');
      
      // Check for Special Types section
      expect(result.content[0].text).toContain('Special Types');
      expect(result.content[0].text).toContain('sessions');
      expect(result.content[0].text).toContain('dailies');
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

    it('should handle update_type tool', async () => {
      // First create a type
      await typeHandlers.handleCreateType({
        name: 'test_update',
        description: 'Original description'
      });

      // Update the description
      const result = await typeHandlers.handleUpdateType({
        name: 'test_update',
        description: 'New updated description'
      });

      expect(result.content[0].text).toContain('Type "test_update" description updated successfully');
      
      // Verify the description was updated
      const types = await typeRepo.getAllTypes();
      const updated = types.find(t => t.type === 'test_update');
      expect(updated?.description).toBe('New updated description');
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
      const filePath = path.join(testDataDir, 'recipe', 'recipe-1.md');
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