import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import chalk from 'chalk';
import { AppDataSource } from '../data-source.js';
import { Item } from '../entities/Item.js';
import { Status } from '../entities/Status.js';
import { Tag } from '../entities/Tag.js';
import { ItemTag } from '../entities/ItemTag.js';
import { ItemRelation } from '../entities/ItemRelation.js';
import { Keyword } from '../entities/Keyword.js';
import { ItemKeyword } from '../entities/ItemKeyword.js';
import { Concept } from '../entities/Concept.js';
import { ItemConcept } from '../entities/ItemConcept.js';
import { SystemState } from '../entities/SystemState.js';
import { validateType } from '../utils/validation.js';

// Import options
export interface ImportOptions {
  mode?: 'default' | 'sync' | 'reset';
  preserveIds?: boolean;
  dryRun?: boolean;
  useTransaction?: boolean;
  type?: string;
  batchSize?: number;
  clear?: boolean;
}

// Import result
export interface ImportResult {
  success?: boolean;
  imported?: number;
  skipped?: boolean | number;
  failed?: number;
  errors?: ImportError[];
  itemId?: number;
  stateImported?: boolean;
}

// Import error
export class ImportError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

// Front matter schema for regular item Markdown files
const ItemFrontMatterSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string(),
  status: z.string(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL']).optional().default('MEDIUM'),
  description: z.string().optional(),
  aiSummary: z.string().optional(),
  category: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.record(z.string(), z.number()).optional(),
  concepts: z.record(z.string(), z.number()).optional(),
  embedding: z.string().optional(),
  related: z.array(z.number()).optional(),
  searchIndex: z.string().optional(),
  entities: z.string().optional(),
  created: z.union([z.string(), z.date()]).optional(),
  updated: z.union([z.string(), z.date()]).optional(),
  startDate: z.union([z.string(), z.date()]).optional(),
  endDate: z.union([z.string(), z.date()]).optional()
});

// Front matter schema for system state Markdown files
const SystemStateFrontMatterSchema = z.object({
  id: z.number(),
  version: z.string(),
  metrics: z.any().optional(),
  context: z.any().optional(),
  relatedItems: z.array(z.number()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.any().optional(),
  created: z.union([z.string(), z.date()]).optional(),
  updated: z.union([z.string(), z.date()]).optional()
});

export class ImportManagerTypeORM {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  async importPath(importPath: string, options: ImportOptions = {}): Promise<ImportResult> {
    // Initialize database if needed
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Run migrations to ensure tables exist
    console.log(chalk.gray('Ensuring database schema...'));
    await AppDataSource.runMigrations();

    // Check if path is file or directory
    const stats = await fs.stat(importPath);
    
    if (stats.isFile()) {
      // Check if it's JSON or Markdown
      if (importPath.endsWith('.json')) {
        return await this.importJSON(importPath, options);
      } else if (importPath.endsWith('.md')) {
        return await this.importMarkdownFile(importPath, options);
      } else {
        throw new ImportError('INVALID_FILE', 'Only JSON and Markdown files are supported');
      }
    } else if (stats.isDirectory()) {
      return await this.importDirectory(importPath, options);
    } else {
      throw new ImportError('INVALID_PATH', 'Path must be a file or directory');
    }
  }

  /**
   * Import from JSON file (existing functionality)
   */
  async importJSON(filePath: string, options: ImportOptions = {}): Promise<ImportResult> {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    console.log(chalk.bold.cyan('📥 Data Import\n'));
    console.log(chalk.gray(`File: ${filePath}`));
    console.log(chalk.gray(`Items to import: ${data.items?.length || 0}`));

    // Clear existing data if requested
    if (options.clear) {
      await this.clearDatabase();
    }

    // Import items
    const result = await this.importItems(data.items || [], options);

    // Import system state
    if (data.systemState) {
      await this.importSystemState(data.systemState);
      result.stateImported = true;
    }

    console.log(chalk.bold.green(`\n✨ Import completed! Imported ${result.imported} items`));
    
    return result;
  }

  /**
   * Import a single Markdown file
   */
  async importMarkdownFile(filePath: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      // Read file
      const content = await fs.readFile(filePath, 'utf-8');

      // Parse front matter
      const parsed = matter(content);
      
      // Check if this is a system state file
      if (parsed.data.type === 'system_state' || 
          ('version' in parsed.data && !('title' in parsed.data) && !('status' in parsed.data))) {
        return await this.importSystemStateFile(filePath, parsed, options);
      }
      
      // Validate and normalize data for regular item
      const validated = ItemFrontMatterSchema.parse(parsed.data);
      
      // Validate type format
      const normalizedType = validateType(validated.type, true);

      // Get or create status
      const statusRepo = AppDataSource.getRepository(Status);
      let status = await statusRepo.findOne({ where: { name: validated.status } });
      if (!status) {
        status = await statusRepo.save({
          name: validated.status,
          isClosable: false,
          sortOrder: 999
        });
      }

      // Create or update item
      const itemRepo = AppDataSource.getRepository(Item);
      const itemData: any = {
        type: normalizedType,
        title: validated.title,
        description: validated.description || '',
        content: parsed.content?.trim() || '',
        statusId: status.id,
        priority: validated.priority || 'MEDIUM',
        category: validated.category,
        version: validated.version,
        aiSummary: validated.aiSummary,
        searchIndex: validated.searchIndex,
        entities: validated.entities,
        embedding: validated.embedding ? Buffer.from(validated.embedding, 'base64') : undefined,
        startDate: validated.startDate ? new Date(validated.startDate) : undefined,
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      };

      // If ID is provided in frontmatter, use it (will update if exists, create new otherwise)
      if (validated.id) {
        itemData.id = validated.id;
      }
      
      const item = await itemRepo.save(itemData);

      // Import tags
      if (validated.tags && validated.tags.length > 0) {
        await this.importTags(item.id, validated.tags);
      }

      // Import keywords
      if (validated.keywords) {
        await this.importKeywords(item.id, validated.keywords);
      }

      // Import concepts
      if (validated.concepts) {
        await this.importConcepts(item.id, validated.concepts);
      }

      // Import relations
      if (validated.related && validated.related.length > 0) {
        await this.importRelations(item.id, validated.related);
      }

      return {
        success: true,
        imported: 1,
        itemId: item.id
      };
    } catch (error) {
      throw new ImportError(
        'IMPORT_FAILED',
        `Failed to import ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Import a system state Markdown file
   */
  async importSystemStateFile(filePath: string, parsed: matter.GrayMatterFile<string>, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      // Validate system state data
      const validated = SystemStateFrontMatterSchema.parse(parsed.data);
      
      const stateRepo = AppDataSource.getRepository(SystemState);
      
      // Prepare system state data
      const stateData: any = {
        version: validated.version,
        content: parsed.content?.trim() || '',
        summary: '', // Extract from content if needed
        metrics: typeof validated.metrics === 'object' 
          ? JSON.stringify(validated.metrics) 
          : validated.metrics,
        context: typeof validated.context === 'object'
          ? JSON.stringify(validated.context)
          : validated.context,
        relatedItems: validated.relatedItems 
          ? JSON.stringify(validated.relatedItems)
          : '[]',
        tags: validated.tags
          ? JSON.stringify(validated.tags)
          : '[]',
        metadata: typeof validated.metadata === 'object'
          ? JSON.stringify(validated.metadata)
          : validated.metadata,
        isActive: false // Set to true for the latest/current state
      };
      
      // If ID is provided in frontmatter, use it (will update if exists, create new otherwise)
      if (parsed.data.id) {
        stateData.id = parsed.data.id;
      }
      
      // Save system state (will update if ID exists, create new otherwise)
      const state = await stateRepo.save(stateData);
      
      return {
        success: true,
        imported: 0, // System states don't count as items
        stateImported: true
      };
    } catch (error) {
      throw new ImportError(
        'SYSTEM_STATE_IMPORT_FAILED',
        `Failed to import system state ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Import a directory of Markdown files
   */
  async importDirectory(dirPath: string, options: ImportOptions = {}): Promise<ImportResult> {
    console.log(chalk.bold.cyan('📥 Directory Import\n'));
    console.log(chalk.gray(`Directory: ${dirPath}`));

    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    // Clear database if requested
    if (options.clear) {
      await this.clearDatabase();
    }

    // Recursively find all markdown files
    const files = await this.findMarkdownFiles(dirPath);
    console.log(chalk.gray(`Found ${files.length} markdown files`));

    // Import each file
    for (const file of files) {
      try {
        // Filter by type if specified
        if (options.type) {
          const content = await fs.readFile(file, 'utf-8');
          const parsed = matter(content);
          if (parsed.data.type !== options.type) {
            result.skipped = (result.skipped as number) + 1;
            continue;
          }
        }

        const fileResult = await this.importMarkdownFile(file, options);
        if (fileResult.success) {
          result.imported = (result.imported || 0) + 1;
          console.log(chalk.green(`✓ Imported: ${path.basename(file)}`));
        }
      } catch (error) {
        result.failed = (result.failed || 0) + 1;
        result.errors?.push(new ImportError(
          'FILE_IMPORT_FAILED',
          `Failed to import ${file}: ${error instanceof Error ? error.message : String(error)}`
        ));
        console.log(chalk.red(`✗ Failed: ${path.basename(file)}`));
      }
    }

    // Import system states from numbered files (skip latest.md)
    const stateDir = path.join(dirPath, '.system', 'current_state');
    try {
      const stateDirStats = await fs.stat(stateDir);
      if (stateDirStats.isDirectory()) {
        const stateFiles = await fs.readdir(stateDir);
        
        // Filter for numbered files only (1.md, 2.md, etc.)
        const numberedFiles = stateFiles.filter(file => 
          file.endsWith('.md') && /^\d+\.md$/.test(file)
        ).sort((a, b) => {
          const numA = parseInt(a.replace('.md', ''));
          const numB = parseInt(b.replace('.md', ''));
          return numA - numB;
        });
        
        let statesImported = 0;
        for (const file of numberedFiles) {
          try {
            const stateFile = path.join(stateDir, file);
            const content = await fs.readFile(stateFile, 'utf-8');
            const parsed = matter(content);
            
            // Use importSystemStateFile for proper validation and processing
            const stateResult = await this.importSystemStateFile(stateFile, parsed, options);
            if (stateResult.stateImported) {
              statesImported++;
              console.log(chalk.green(`✓ Imported system state: ${file}`));
            }
          } catch (error) {
            console.log(chalk.yellow(`⚠ Failed to import ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        }
        
        if (statesImported > 0) {
          result.stateImported = true;
          console.log(chalk.green(`✓ Imported ${statesImported} system state(s)`));
        }
      }
    } catch (error) {
      // System state directory not found, skip
      console.log(chalk.gray(`System state import skipped: ${error instanceof Error ? error.message : 'Directory not found'}`));
    }

    return result;
  }

  /**
   * Find all markdown files in a directory recursively
   */
  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip .system directory (handled separately)
        if (entry.name === '.system') {
          continue;
        }
        // Recurse into subdirectory
        const subFiles = await this.findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Import items from JSON data
   */
  private async importItems(items: any[], options: ImportOptions = {}): Promise<ImportResult> {
    const itemRepo = AppDataSource.getRepository(Item);
    const statusRepo = AppDataSource.getRepository(Status);
    
    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      failed: 0
    };

    const idMap = new Map<number, number>(); // old ID -> new ID

    for (const itemData of items) {
      try {
        // Get or create status
        let statusId = 1;
        if (itemData.status) {
          let status = await statusRepo.findOne({ where: { name: itemData.status } });
          if (!status) {
            status = await statusRepo.save({
              name: itemData.status,
              isClosable: false,
              sortOrder: 999
            });
          }
          statusId = status.id;
        }

        // Create item
        const item = await itemRepo.save({
          type: itemData.type,
          title: itemData.title,
          description: itemData.description || '',
          content: itemData.content || '',
          statusId,
          priority: itemData.priority || 'MEDIUM',
          category: itemData.category,
          startDate: itemData.startDate ? new Date(itemData.startDate) : undefined,
          endDate: itemData.endDate ? new Date(itemData.endDate) : undefined,
          version: itemData.version,
          aiSummary: itemData.aiSummary,
          searchIndex: itemData.searchIndex,
          entities: itemData.entities,
          embedding: itemData.embedding ? Buffer.from(itemData.embedding, 'base64') : undefined,
        });

        idMap.set(itemData.id, item.id);

        // Import tags
        if (itemData.tags && Array.isArray(itemData.tags)) {
          await this.importTags(item.id, itemData.tags);
        }

        result.imported = (result.imported || 0) + 1;
      } catch (error) {
        result.failed = (result.failed || 0) + 1;
      }
    }

    // Import relations (second pass)
    console.log(chalk.gray('\nImporting relations...'));
    for (const itemData of items) {
      if (itemData.related && Array.isArray(itemData.related)) {
        const sourceId = idMap.get(itemData.id);
        if (!sourceId) continue;

        await this.importRelations(sourceId, itemData.related.map((oldId: number) => idMap.get(oldId)).filter(Boolean));
      }
    }

    return result;
  }

  /**
   * Import tags for an item
   */
  private async importTags(itemId: number, tagNames: string[]): Promise<void> {
    const tagRepo = AppDataSource.getRepository(Tag);
    const itemTagRepo = AppDataSource.getRepository(ItemTag);

    for (const tagName of tagNames) {
      let tag = await tagRepo.findOne({ where: { name: tagName } });
      if (!tag) {
        tag = await tagRepo.save({ name: tagName });
      }
      
      // Check if relation exists
      const existing = await itemTagRepo.findOne({
        where: { itemId, tagId: tag.id }
      });
      if (!existing) {
        await itemTagRepo.save({ itemId, tagId: tag.id });
      }
    }
  }

  /**
   * Import keywords for an item
   */
  private async importKeywords(itemId: number, keywords: Record<string, number>): Promise<void> {
    const keywordRepo = AppDataSource.getRepository(Keyword);
    const itemKeywordRepo = AppDataSource.getRepository(ItemKeyword);

    for (const [word, weight] of Object.entries(keywords)) {
      let keyword = await keywordRepo.findOne({ where: { word } });
      if (!keyword) {
        keyword = await keywordRepo.save({ word });
      }
      
      // Check if relation exists
      const existing = await itemKeywordRepo.findOne({
        where: { itemId, keywordId: keyword.id }
      });
      if (!existing) {
        await itemKeywordRepo.save({ itemId, keywordId: keyword.id, weight });
      }
    }
  }

  /**
   * Import concepts for an item
   */
  private async importConcepts(itemId: number, concepts: Record<string, number>): Promise<void> {
    const conceptRepo = AppDataSource.getRepository(Concept);
    const itemConceptRepo = AppDataSource.getRepository(ItemConcept);

    for (const [name, confidence] of Object.entries(concepts)) {
      let concept = await conceptRepo.findOne({ where: { name } });
      if (!concept) {
        concept = await conceptRepo.save({ name });
      }
      
      // Check if relation exists
      const existing = await itemConceptRepo.findOne({
        where: { itemId, conceptId: concept.id }
      });
      if (!existing) {
        await itemConceptRepo.save({ itemId, conceptId: concept.id, confidence });
      }
    }
  }

  /**
   * Import relations for an item
   */
  private async importRelations(sourceId: number, targetIds: number[]): Promise<void> {
    const relationRepo = AppDataSource.getRepository(ItemRelation);

    for (const targetId of targetIds) {
      if (!targetId) continue;
      
      // Check if relation exists
      const existing = await relationRepo.findOne({
        where: { sourceId, targetId }
      });
      if (!existing) {
        await relationRepo.save({ sourceId, targetId });
      }
    }
  }

  /**
   * Import system state
   */
  private async importSystemState(stateData: any): Promise<void> {
    const stateRepo = AppDataSource.getRepository(SystemState);
    
    await stateRepo.save({
      version: stateData.version,
      content: stateData.content || '',
      summary: stateData.summary,
      metrics: typeof stateData.metrics === 'object' 
        ? JSON.stringify(stateData.metrics) 
        : stateData.metrics,
      context: typeof stateData.context === 'object'
        ? JSON.stringify(stateData.context)
        : stateData.context,
      checkpoint: typeof stateData.checkpoint === 'object'
        ? JSON.stringify(stateData.checkpoint)
        : stateData.checkpoint,
      relatedItems: Array.isArray(stateData.relatedItems)
        ? JSON.stringify(stateData.relatedItems)
        : stateData.relatedItems || '[]',
      tags: Array.isArray(stateData.tags)
        ? JSON.stringify(stateData.tags)
        : stateData.tags || '[]',
      metadata: typeof stateData.metadata === 'object'
        ? JSON.stringify(stateData.metadata)
        : stateData.metadata,
      isActive: true
    });
    console.log(chalk.gray('System state imported'));
  }

  /**
   * Clear the database
   */
  private async clearDatabase(): Promise<void> {
    console.log(chalk.yellow('\n⚠️  Clearing existing data...'));
    
    // Delete in correct order due to foreign keys
    await AppDataSource.getRepository(ItemConcept).clear();
    await AppDataSource.getRepository(ItemKeyword).clear();
    await AppDataSource.getRepository(ItemRelation).clear();
    await AppDataSource.getRepository(ItemTag).clear();
    await AppDataSource.getRepository(Item).clear();
    await AppDataSource.getRepository(Concept).clear();
    await AppDataSource.getRepository(Keyword).clear();
    await AppDataSource.getRepository(Tag).clear();
    await AppDataSource.getRepository(Status).clear();
    await AppDataSource.getRepository(SystemState).clear();
    
    console.log(chalk.gray('Existing data cleared'));
  }
}