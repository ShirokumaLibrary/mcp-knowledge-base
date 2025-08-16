import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateType } from '../utils/validation.js';

// Import options
export interface ImportOptions {
  mode?: 'default' | 'sync' | 'reset';
  preserveIds?: boolean;
  dryRun?: boolean;
  useTransaction?: boolean;
  type?: string;
  batchSize?: number;
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

// Front matter schema
const FrontMatterSchema = z.object({
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

export class ImportManager {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(private prisma: InstanceType<typeof PrismaClient>) {}

  /**
   * Import a single file
   */
  async importFile(filePath: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      // Validate file path
      this.validateFilePath(filePath);

      // Read file
      const content = await this.readFileWithSizeCheck(filePath);

      // Parse front matter
      const parsed = matter(content);
      
      // Validate and normalize data
      const validated = FrontMatterSchema.parse(parsed.data);
      
      // Validate type format
      const normalizedType = validateType(validated.type, true);

      // Check for existing item
      const existing = await this.prisma.item.findUnique({
        where: { id: validated.id }
      });

      // Handle based on mode
      if (existing) {
        return await this.handleExistingItem(existing, validated, parsed.content, options);
      } else {
        return await this.createNewItem(validated, parsed.content, options);
      }
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        throw new ImportError('VALIDATION_FAILED', `Invalid front matter format: ${JSON.stringify(error.errors)}`, error.errors);
      }
      throw new ImportError('IMPORT_FAILED', `Failed to import file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Import all files from a directory
   */
  async importDirectory(dirPath: string, options: ImportOptions = {}): Promise<ImportResult> {
    const results: ImportResult = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    try {
      // Validate directory path
      this.validateFilePath(dirPath);

      // Process based on transaction preference
      if (options.useTransaction) {
        return await this.prisma.$transaction(async (tx) => {
          const tempManager = new ImportManager(tx as any);
          return await tempManager.processDirectory(dirPath, options, results);
        });
      } else {
        return await this.processDirectory(dirPath, options, results);
      }
    } catch (error) {
      if (error instanceof ImportError) {
        throw error;
      }
      throw new ImportError('DIRECTORY_IMPORT_FAILED', `Failed to import directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Import all data including system state
   */
  async importAll(basePath: string, options: ImportOptions = {}): Promise<ImportResult> {
    const results: ImportResult = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      stateImported: false
    };

    try {
      // Import items
      const itemResults = await this.importDirectory(basePath, options);
      results.imported = itemResults.imported || 0;
      results.skipped = itemResults.skipped || 0;
      results.failed = itemResults.failed || 0;
      results.errors = itemResults.errors || [];

      // Import system state history
      const stateDir = path.join(basePath, '.system', 'current_state');
      try {
        await fs.access(stateDir);
        const stateFiles = await fs.readdir(stateDir);
        
        // Sort files to import in order (1.md, 2.md, ..., latest.md)
        const sortedFiles = stateFiles
          .filter(f => f.endsWith('.md'))
          .sort((a, b) => {
            // latest.md should be last
            if (a === 'latest.md') return 1;
            if (b === 'latest.md') return -1;
            // Numeric files sorted by number
            const numA = parseInt(a.replace('.md', ''));
            const numB = parseInt(b.replace('.md', ''));
            return numA - numB;
          });
        
        let importedCount = 0;
        for (const file of sortedFiles) {
          const filePath = path.join(stateDir, file);
          const stateContent = await fs.readFile(filePath, 'utf-8');
          const parsed = matter(stateContent);
          
          // Use original ID from file data if available
          const stateId = parsed.data.id;
          
          // Check if state with this ID already exists
          if (stateId) {
            const existing = await this.prisma.systemState.findUnique({
              where: { id: stateId }
            });
            if (existing) {
              // Update existing record
              await this.prisma.systemState.update({
                where: { id: stateId },
                data: {
                  version: parsed.data.version || 'v0.8.0',
                  content: parsed.content || '',
                  summary: parsed.data.summary || undefined,
                  metrics: parsed.data.metrics ? JSON.stringify(parsed.data.metrics) : undefined,
                  context: parsed.data.context ? JSON.stringify(parsed.data.context) : undefined,
                  checkpoint: parsed.data.checkpoint || undefined,
                  relatedItems: parsed.data.relatedItems ? JSON.stringify(parsed.data.relatedItems) : undefined,
                  metadata: parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : undefined,
                  createdAt: parsed.data.created ? new Date(parsed.data.created) : undefined,
                  updatedAt: parsed.data.updated ? new Date(parsed.data.updated) : undefined
                }
              });
              continue;
            }
          }
          
          await this.prisma.systemState.create({
            data: {
              id: stateId || undefined,  // Use ID from file or auto-generate
              version: parsed.data.version || 'v0.8.0',
              content: parsed.content || '',
              summary: parsed.data.summary || undefined,
              metrics: parsed.data.metrics ? JSON.stringify(parsed.data.metrics) : undefined,
              context: parsed.data.context ? JSON.stringify(parsed.data.context) : undefined,
              checkpoint: parsed.data.checkpoint || undefined,
              relatedItems: parsed.data.relatedItems ? JSON.stringify(parsed.data.relatedItems) : undefined,
              metadata: parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : undefined,
              createdAt: parsed.data.created ? new Date(parsed.data.created) : undefined,
              updatedAt: parsed.data.updated ? new Date(parsed.data.updated) : undefined
            }
          });
          importedCount++;
        }
        
        results.stateImported = true;
        console.log(`Imported ${importedCount} system state records`);
        
        // Adjust sequence for SQLite to match the highest imported ID
        const maxId = await this.prisma.systemState.findFirst({
          orderBy: { id: 'desc' },
          select: { id: true }
        });
        
        if (maxId) {
          // SQLite doesn't have SETVAL, but we can update sqlite_sequence
          await this.prisma.$executeRawUnsafe(
            `UPDATE sqlite_sequence SET seq = ${maxId.id} WHERE name = 'system_states'`
          );
        }
      } catch (error) {
        // System state is optional, but log the error for debugging
        if (error instanceof Error && !error.message.includes('ENOENT')) {
          // Only add to errors if it's not a "file not found" error
          results.errors?.push(
            new ImportError('STATE_IMPORT_WARNING', `System state import skipped: ${error.message}`)
          );
        }
      }

      return results;
    } catch (error) {
      throw new ImportError('IMPORT_ALL_FAILED', `Failed to import all: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process a directory recursively
   */
  private async processDirectory(dirPath: string, options: ImportOptions, results: ImportResult): Promise<ImportResult> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const mdFiles: string[] = [];
    const subDirs: string[] = [];

    // Collect files and directories
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip .system directory in normal import
        if (entry.name === '.system') continue;

        // If type filter is specified, only process matching directories
        if (options.type && entry.name !== options.type) continue;

        subDirs.push(fullPath);
      } else if (entry.name.endsWith('.md')) {
        mdFiles.push(fullPath);
      }
    }

    // Process files in batches
    const batchSize = options.batchSize || 5;
    for (let i = 0; i < mdFiles.length; i += batchSize) {
      const batch = mdFiles.slice(i, i + batchSize);
      
      // Process batch concurrently
      const batchResults = await Promise.allSettled(
        batch.map(filePath => this.importFile(filePath, options))
      );

      // Process results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          if (result.value.skipped) {
            results.skipped = (results.skipped as number) + 1;
          } else {
            results.imported = (results.imported as number) + 1;
          }
        } else {
          results.failed = (results.failed as number) + 1;
          results.errors?.push(result.reason as ImportError);
        }
      }
    }

    // Process subdirectories recursively
    for (const subDir of subDirs) {
      await this.processDirectory(subDir, options, results);
    }

    return results;
  }

  /**
   * Handle existing item based on mode
   */
  private async handleExistingItem(existing: any, data: any, content: string, options: ImportOptions): Promise<ImportResult> {
    switch (options.mode) {
      case 'reset':
        // Overwrite existing
        return await this.updateItem(existing.id, data, content);
      case 'sync':
        // Skip existing
        return { success: true, skipped: true, itemId: existing.id };
      default:
        // Default: skip
        return { success: true, skipped: true, itemId: existing.id };
    }
  }

  /**
   * Create new item
   */
  private async createNewItem(data: any, content: string, options: ImportOptions): Promise<ImportResult> {
    // Get status ID
    const status = await this.prisma.status.findUnique({
      where: { name: data.status }
    });
    
    if (!status) {
      throw new ImportError('INVALID_STATUS', `Status '${data.status}' not found`);
    }

    // Handle tags with findOrCreate pattern
    const tags = [];
    if (data.tags) {
      for (const tagName of data.tags) {
        let tag = await this.prisma.tag.findUnique({ where: { name: tagName } });
        if (!tag) {
          try {
            tag = await this.prisma.tag.create({ data: { name: tagName } });
          } catch (error) {
            // If creation fails due to race condition, try to find again
            tag = await this.prisma.tag.findUnique({ where: { name: tagName } });
            if (!tag) {
              // Skip this tag if we still can't find or create it
              continue;
            }
          }
        }
        tags.push(tag);
      }
    }

    // Create item with explicit ID
    const item = await this.prisma.item.create({
      data: {
        id: data.id,
        type: data.type,
        title: data.title,
        description: data.description || '',
        content: content || '',
        aiSummary: data.aiSummary || undefined,
        statusId: status.id,
        priority: data.priority,
        category: data.category || undefined,
        version: data.version || undefined,
        searchIndex: data.searchIndex || undefined,
        entities: data.entities || undefined,
        embedding: data.embedding ? Buffer.from(data.embedding, 'base64') : undefined,
        startDate: data.startDate ? (data.startDate instanceof Date ? data.startDate : new Date(data.startDate)) : undefined,
        endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : undefined,
        createdAt: data.created ? (data.created instanceof Date ? data.created : new Date(data.created)) : new Date(),
        updatedAt: data.updated ? (data.updated instanceof Date ? data.updated : new Date(data.updated)) : new Date(),
        tags: {
          create: tags.map(tag => ({ tagId: tag.id }))
        }
      }
    });

    // Handle keywords
    if (data.keywords && typeof data.keywords === 'object') {
      for (const [keyword, weight] of Object.entries(data.keywords)) {
        // Find or create keyword
        let keywordRecord = await this.prisma.keyword.findUnique({
          where: { word: keyword }
        });
        
        if (!keywordRecord) {
          try {
            keywordRecord = await this.prisma.keyword.create({
              data: { word: keyword }
            });
          } catch (error) {
            // If creation fails due to race condition, try to find again
            keywordRecord = await this.prisma.keyword.findUnique({
              where: { word: keyword }
            });
            if (!keywordRecord) {
              // Skip this keyword if we still can't find or create it
              continue;
            }
          }
        }
        
        // Create ItemKeyword relation
        await this.prisma.itemKeyword.create({
          data: {
            itemId: item.id,
            keywordId: keywordRecord.id,
            weight: weight as number
          }
        });
      }
    }

    // Handle concepts
    if (data.concepts && typeof data.concepts === 'object') {
      for (const [concept, confidence] of Object.entries(data.concepts)) {
        // Find or create concept
        let conceptRecord = await this.prisma.concept.findUnique({
          where: { name: concept }
        });
        
        if (!conceptRecord) {
          try {
            conceptRecord = await this.prisma.concept.create({
              data: { name: concept }
            });
          } catch (error) {
            // If creation fails due to race condition, try to find again
            conceptRecord = await this.prisma.concept.findUnique({
              where: { name: concept }
            });
            if (!conceptRecord) {
              // Skip this concept if we still can't find or create it
              continue;
            }
          }
        }
        
        // Create ItemConcept relation
        await this.prisma.itemConcept.create({
          data: {
            itemId: item.id,
            conceptId: conceptRecord.id,
            confidence: confidence as number
          }
        });
      }
    }

    // Handle relations - only create relations for existing items
    if (data.related && data.related.length > 0) {
      // Check which related items exist
      const existingRelatedItems = await this.prisma.item.findMany({
        where: {
          id: { in: data.related }
        },
        select: { id: true }
      });
      
      const existingIds = existingRelatedItems.map(i => i.id);
      
      if (existingIds.length > 0) {
        await this.prisma.itemRelation.createMany({
          data: existingIds.map((targetId: number) => ({
            sourceId: item.id,
            targetId
          }))
        });
      }
    }

    return { success: true, itemId: item.id };
  }

  /**
   * Update existing item
   */
  private async updateItem(id: number, data: any, content: string): Promise<ImportResult> {
    // Get status ID
    const status = await this.prisma.status.findUnique({
      where: { name: data.status }
    });
    
    if (!status) {
      throw new ImportError('INVALID_STATUS', `Status '${data.status}' not found`);
    }

    // Update item
    const item = await this.prisma.item.update({
      where: { id },
      data: {
        type: data.type,
        title: data.title,
        description: data.description || '',
        content: content || '',
        aiSummary: data.aiSummary || undefined,
        statusId: status.id,
        priority: data.priority,
        category: data.category || undefined,
        version: data.version || undefined,
        searchIndex: data.searchIndex || undefined,
        entities: data.entities || undefined,
        embedding: data.embedding ? Buffer.from(data.embedding, 'base64') : undefined,
        startDate: data.startDate ? (data.startDate instanceof Date ? data.startDate : new Date(data.startDate)) : undefined,
        endDate: data.endDate ? (data.endDate instanceof Date ? data.endDate : new Date(data.endDate)) : undefined,
        updatedAt: data.updated ? (data.updated instanceof Date ? data.updated : new Date(data.updated)) : new Date()
      }
    });

    return { success: true, itemId: item.id };
  }

  /**
   * Validate file path for security
   */
  private validateFilePath(filePath: string): void {
    // Normalize the path
    const normalized = path.normalize(filePath);
    const resolved = path.resolve(filePath);
    
    // Check for path traversal attempts
    if (normalized.includes('..') || normalized.includes('..\\')) {
      throw new ImportError('INVALID_PATH', 'Invalid file path: path traversal detected');
    }

    // Platform-aware system directory check
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      // Windows system paths
      const systemPaths = ['C:\\Windows', 'C:\\Program Files', 'C:\\Program Files (x86)'];
      if (systemPaths.some(p => resolved.toUpperCase().startsWith(p.toUpperCase()))) {
        throw new ImportError('INVALID_PATH', 'Invalid file path: system directory access denied');
      }
    } else {
      // Unix-like system paths
      if (normalized.startsWith('/etc') || normalized.startsWith('/usr') || normalized.startsWith('/bin') || normalized.startsWith('/sys')) {
        throw new ImportError('INVALID_PATH', 'Invalid file path: system directory access denied');
      }
    }

    // Check for home directory shortcuts
    if (normalized.startsWith('~')) {
      throw new ImportError('INVALID_PATH', 'Invalid file path: home directory shortcuts not allowed');
    }
  }

  /**
   * Read file with size check
   */
  private async readFileWithSizeCheck(filePath: string): Promise<string> {
    const stats = await fs.stat(filePath).catch(() => null);
    
    if (!stats) {
      throw new ImportError('FILE_NOT_FOUND', `File not found: ${filePath}`);
    }

    if (stats.size > this.MAX_FILE_SIZE) {
      throw new ImportError('FILE_TOO_LARGE', `File too large: ${stats.size} bytes (max ${this.MAX_FILE_SIZE})`);
    }

    return await fs.readFile(filePath, 'utf-8');
  }
}