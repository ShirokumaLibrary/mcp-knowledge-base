import fs from 'fs/promises';
import path from 'path';
import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source.js';
import { Item } from '../entities/Item.js';
import { SystemState } from '../entities/SystemState.js';
import { Status } from '../entities/Status.js';
import { ItemTag } from '../entities/ItemTag.js';
import { ItemKeyword } from '../entities/ItemKeyword.js';
import { ItemConcept } from '../entities/ItemConcept.js';
import { ItemRelation } from '../entities/ItemRelation.js';
import { AutoExportConfig } from '../types/export.types.js';

// Constants
const SYSTEM_DIR = '.system';
const CURRENT_STATE_DIR = 'current_state';
const MAX_FILENAME_LENGTH = 100;
const DEFAULT_EXPORT_TIMEOUT = 2000;

export interface ExportOptions {
  type?: string;
  status?: string[];
  tags?: string[];
  limit?: number;
  format?: 'markdown' | 'json';
  includeState?: boolean;
  includeAllStates?: boolean;  // Export all system state history
}

export interface ExportResult {
  exported: number;
  directory: string;
  files: string[];
  stateExported?: boolean;
}

export interface StateExportResult {
  exported: boolean;
  directory: string;
  file: string | null;
  count?: number;
}

export class ExportManager {
  private itemRepo: Repository<Item>;
  private stateRepo: Repository<SystemState>;
  private statusRepo: Repository<Status>;
  private itemTagRepo: Repository<ItemTag>;
  private itemKeywordRepo: Repository<ItemKeyword>;
  private itemConceptRepo: Repository<ItemConcept>;
  private itemRelationRepo: Repository<ItemRelation>;
  private autoExportConfig: AutoExportConfig;

  constructor() {
    this.itemRepo = AppDataSource.getRepository(Item);
    this.stateRepo = AppDataSource.getRepository(SystemState);
    this.statusRepo = AppDataSource.getRepository(Status);
    this.itemTagRepo = AppDataSource.getRepository(ItemTag);
    this.itemKeywordRepo = AppDataSource.getRepository(ItemKeyword);
    this.itemConceptRepo = AppDataSource.getRepository(ItemConcept);
    this.itemRelationRepo = AppDataSource.getRepository(ItemRelation);
    this.autoExportConfig = this.loadAutoExportConfig();
  }

  /**
   * Load auto-export configuration from environment variables
   */
  private loadAutoExportConfig(): AutoExportConfig {
    const exportDir = process.env.SHIROKUMA_EXPORT_DIR;
    const timeout = process.env.SHIROKUMA_EXPORT_TIMEOUT;
    
    return {
      enabled: !!exportDir,
      baseDir: exportDir || '',
      timeout: timeout && !isNaN(Number(timeout)) ? Number(timeout) : DEFAULT_EXPORT_TIMEOUT
    };
  }

  /**
   * Get current auto-export configuration (for testing)
   */
  getAutoExportConfig(): AutoExportConfig {
    // Reload configuration to get current environment values
    this.autoExportConfig = this.loadAutoExportConfig();
    return this.autoExportConfig;
  }

  /**
   * Automatically export an item (non-blocking)
   */
  async autoExportItem(item: Item): Promise<void> {
    // Reload configuration to get current environment values
    const config = this.loadAutoExportConfig();
    if (!config.enabled) {
      return;
    }

    try {
      // Update the cached config for internal methods
      this.autoExportConfig = config;
      await this.exportWithTimeout(item, config.timeout);
    } catch (error) {
      // Log error but don't propagate it
      console.error('Auto export failed for item', { itemId: item.id, error });
    }
  }

  /**
   * Automatically export current state (non-blocking)
   */
  async autoExportCurrentState(state: SystemState): Promise<void> {
    // Reload configuration to get current environment values
    const config = this.loadAutoExportConfig();
    if (!config.enabled) {
      return;
    }

    try {
      // Update the cached config for internal methods
      this.autoExportConfig = config;
      await this.exportCurrentStateWithTimeout(state, config.timeout);
    } catch (error) {
      // Log error but don't propagate it
      console.error('Current state auto export failed', { error });
    }
  }

  /**
   * Export item with timeout
   */
  private async exportWithTimeout(item: Item, timeout: number): Promise<void> {
    return Promise.race([
      this.exportItemToFile(item),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Export timeout')), timeout)
      )
    ]);
  }

  /**
   * Export current state with timeout
   */
  private async exportCurrentStateWithTimeout(state: SystemState, timeout: number): Promise<void> {
    return Promise.race([
      this.exportSystemStateToFile(state),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Export timeout')), timeout)
      )
    ]);
  }

  /**
   * Export a single item to file (internal method for auto-export)
   */
  private async exportItemToFile(item: Item): Promise<void> {
    const typeDir = path.join(this.autoExportConfig.baseDir, item.type);
    
    // Create directory if it doesn't exist
    await fs.mkdir(typeDir, { recursive: true });
    
    // Get enriched item with all relations
    const enrichedItem = await this.getEnrichedItem(item);
    
    // Generate filename
    const filename = `${item.id}-${this.sanitizeFilename(item.title)}.md`;
    const filepath = path.join(typeDir, filename);
    
    // Check if file with same ID exists and remove it
    const files = await fs.readdir(typeDir).catch(() => []);
    const existingFile = files.find(f => f.startsWith(`${item.id}-`));
    if (existingFile && existingFile !== filename) {
      await fs.unlink(path.join(typeDir, existingFile)).catch(() => {});
    }
    
    // Write file
    const content = this.formatItemAsMarkdown(enrichedItem);
    await fs.writeFile(filepath, content, 'utf-8');
  }

  /**
   * Export system state to file (internal method for auto-export)
   */
  private async exportSystemStateToFile(state: SystemState): Promise<void> {
    const stateDir = path.join(this.autoExportConfig.baseDir, SYSTEM_DIR, CURRENT_STATE_DIR);
    
    // Create directory if it doesn't exist
    await fs.mkdir(stateDir, { recursive: true });
    
    // Generate filename
    const filename = `${state.id}.md`;
    const filepath = path.join(stateDir, filename);
    
    // Write file
    const content = this.formatSystemStateAsMarkdown(state);
    await fs.writeFile(filepath, content, 'utf-8');
    
    // Update latest symlink/copy
    const latestPath = path.join(stateDir, 'latest.md');
    await fs.unlink(latestPath).catch(() => {});
    await fs.copyFile(filepath, latestPath);
  }

  /**
   * Build item export path (for testing and external use)
   */
  buildItemPath(item: { id: number; type: string; title: string }): string {
    // Reload configuration to get current environment values
    const config = this.loadAutoExportConfig();
    const filename = `${item.id}-${this.sanitizeFilename(item.title)}.md`;
    return path.join(config.baseDir, item.type, filename);
  }

  /**
   * Build current state export path (for testing and external use)
   */
  buildCurrentStatePath(): string {
    // Reload configuration to get current environment values
    const config = this.loadAutoExportConfig();
    return path.join(config.baseDir, SYSTEM_DIR, CURRENT_STATE_DIR);
  }

  /**
   * Sanitize filename by replacing invalid characters
   */
  private sanitizeFilename(title: string): string {
    // Replace filesystem-invalid characters and whitespace with underscore
    let sanitized = title
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')  // Windows/Unix invalid chars
      .replace(/[\s\t\r\n]+/g, '_')  // Replace all whitespace (space, tab, newline, etc.) with underscore
      .replace(/_+/g, '_')  // Collapse multiple underscores into one
      .trim();

    // Limit length to maximum filename length
    if (sanitized.length > MAX_FILENAME_LENGTH) {
      sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH);
    }

    // Remove leading and trailing dots, underscores or spaces (Windows compatibility)
    sanitized = sanitized.replace(/^[._\s]+/, '').replace(/[._\s]+$/, '');

    return sanitized || 'untitled';
  }

  /**
   * Export single item by ID
   */
  async exportItem(id: number): Promise<ExportResult> {
    const item = await this.itemRepo.findOne({
      where: { id }
    });

    if (!item) {
      throw new Error(`Item with ID ${id} not found`);
    }

    // Get export directory from environment or use default
    const baseDir = process.env.SHIROKUMA_EXPORT_DIR || 'docs/export';
    const typeDir = path.join(baseDir, item.type);

    // Create directory if it doesn't exist
    await fs.mkdir(typeDir, { recursive: true });

    // Get related data
    const enrichedItem = await this.getEnrichedItem(item);

    // Export item
    const filename = `${item.id}-${this.sanitizeFilename(item.title)}.md`;
    const filepath = path.join(typeDir, filename);

    // Check if file with same ID exists and remove it
    const files = await fs.readdir(typeDir).catch(() => []);
    const existingFile = files.find(f => f.startsWith(`${item.id}-`));
    if (existingFile && existingFile !== filename) {
      await fs.unlink(path.join(typeDir, existingFile)).catch(() => {});
    }

    const content = this.formatItemAsMarkdown(enrichedItem);
    await fs.writeFile(filepath, content, 'utf-8');

    return {
      exported: 1,
      directory: baseDir,
      files: [path.relative(baseDir, filepath)]
    };
  }

  /**
   * Export items to files
   */
  async exportItems(options: ExportOptions = {}): Promise<ExportResult> {
    // Get export directory from environment or use default
    const baseDir = process.env.SHIROKUMA_EXPORT_DIR || 'docs/export';

    // Build query
    const query = this.itemRepo.createQueryBuilder('item')
      .leftJoinAndSelect('item.status', 'status');

    if (options.type) {
      query.andWhere('item.type = :type', { type: options.type });
    }

    if (options.status && options.status.length > 0) {
      query.andWhere('status.name IN (:...statuses)', { statuses: options.status });
    }

    if (options.tags && options.tags.length > 0) {
      query.innerJoin('item_tags', 'it', 'it.item_id = item.id')
           .innerJoin('tags', 't', 't.id = it.tag_id')
           .andWhere('t.name IN (:...tags)', { tags: options.tags });
    }

    if (options.limit) {
      query.limit(options.limit);
    }

    query.orderBy('item.updatedAt', 'DESC');

    const items = await query.getMany();

    const exportResult: ExportResult = {
      exported: 0,
      directory: baseDir,
      files: []
    };

    // Export current state if requested
    if (options.includeState) {
      const stateResult = await this.exportCurrentState(options.includeAllStates || false);
      exportResult.stateExported = stateResult.exported;
      if (stateResult.exported && stateResult.count) {
        // Add all exported state files to the files list
        const stateDir = path.join(SYSTEM_DIR, CURRENT_STATE_DIR);
        if (stateResult.count === 1) {
          exportResult.files.push(stateResult.file!);
        } else {
          // For multiple states, add directory reference
          exportResult.files.push(`${stateDir}/ (${stateResult.count} states)`);
        }
      }
    }

    // Group items by type
    const itemsByType = new Map<string, Item[]>();
    for (const item of items) {
      if (!itemsByType.has(item.type)) {
        itemsByType.set(item.type, []);
      }
      itemsByType.get(item.type)!.push(item);
    }

    // Export each type to its own directory
    for (const [type, typeItems] of itemsByType) {
      const typeDir = path.join(baseDir, type);

      // Create directory if it doesn't exist
      await fs.mkdir(typeDir, { recursive: true });

      // Export each item
      for (const item of typeItems) {
        // Get enriched item with all relations
        const enrichedItem = await this.getEnrichedItem(item);

        const filename = `${item.id}-${this.sanitizeFilename(item.title)}.md`;
        const filepath = path.join(typeDir, filename);

        // Check if file with same ID exists and remove it
        const files = await fs.readdir(typeDir).catch(() => []);
        const existingFile = files.find(f => f.startsWith(`${item.id}-`));
        if (existingFile && existingFile !== filename) {
          await fs.unlink(path.join(typeDir, existingFile)).catch(() => {});
        }

        const content = this.formatItemAsMarkdown(enrichedItem);
        await fs.writeFile(filepath, content, 'utf-8');

        exportResult.files.push(path.relative(baseDir, filepath));
        exportResult.exported++;
      }
    }

    return exportResult;
  }

  /**
   * Export current system state
   */
  async exportCurrentState(exportAll = false): Promise<StateExportResult> {
    const baseDir = process.env.SHIROKUMA_EXPORT_DIR || 'docs/export';
    const stateDir = path.join(baseDir, SYSTEM_DIR, CURRENT_STATE_DIR);

    // Create directory if it doesn't exist
    await fs.mkdir(stateDir, { recursive: true });

    const states = exportAll
      ? await this.stateRepo.find({ order: { id: 'DESC' } })
      : await this.stateRepo.find({ order: { id: 'DESC' }, take: 1 });

    if (states.length === 0) {
      return {
        exported: false,
        directory: baseDir,
        file: null
      };
    }

    // Export each state
    let latestFile = '';
    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const filename = `${state.id}.md`;
      const filepath = path.join(stateDir, filename);

      if (i === 0) {
        latestFile = filepath;
      }

      const content = this.formatSystemStateAsMarkdown(state);
      await fs.writeFile(filepath, content, 'utf-8');
    }

    // Create/update symlink to latest
    if (latestFile) {
      const latestPath = path.join(stateDir, 'latest.md');
      // Remove existing symlink/file
      await fs.unlink(latestPath).catch(() => {});
      // Copy latest file (not symlink for better compatibility)
      await fs.copyFile(latestFile, latestPath);
    }

    return {
      exported: true,
      directory: baseDir,
      file: exportAll ? null : path.relative(baseDir, path.join(SYSTEM_DIR, CURRENT_STATE_DIR, `${states[0].id}.md`)),
      count: states.length
    };
  }

  /**
   * Get enriched item with all relations
   */
  private async getEnrichedItem(item: Item): Promise<any> {
    // Get status
    const status = await this.statusRepo.findOne({ where: { id: item.statusId } });

    // Get tags
    const itemTags = await this.itemTagRepo.find({
      where: { itemId: item.id },
      relations: ['tag']
    });

    // Get keywords
    const itemKeywords = await this.itemKeywordRepo.find({
      where: { itemId: item.id },
      relations: ['keyword']
    });

    // Get concepts
    const itemConcepts = await this.itemConceptRepo.find({
      where: { itemId: item.id },
      relations: ['concept']
    });

    // Get relations (both directions)
    const relationsFrom = await this.itemRelationRepo.find({
      where: { sourceId: item.id }
    });

    const relationsTo = await this.itemRelationRepo.find({
      where: { targetId: item.id }
    });

    // Combine all related item IDs
    const relatedIds = [
      ...relationsFrom.map(r => r.targetId),
      ...relationsTo.map(r => r.sourceId)
    ];

    return {
      ...item,
      status: { name: status?.name || 'Open' },
      tags: itemTags.map(it => ({ tag: { name: it.tag.name } })),
      keywords: itemKeywords.map(ik => ({ keyword: { word: ik.keyword.word }, weight: ik.weight })),
      concepts: itemConcepts.map(ic => ({ concept: { name: ic.concept.name }, confidence: ic.confidence })),
      related: [...new Set(relatedIds)] // Remove duplicates
    };
  }

  /**
   * Format item as Markdown with Front Matter
   */
  private formatItemAsMarkdown(item: any): string {
    // Front Matter
    let md = '---\n';
    md += `id: ${item.id}\n`;
    md += `type: ${item.type}\n`;
    md += `title: "${item.title.replace(/"/g, '\\"')}"\n`;
    md += `status: ${item.status.name}\n`;
    md += `priority: ${item.priority || 'MEDIUM'}\n`;
    
    // Description in Front Matter
    if (item.description) {
      md += `description: ${JSON.stringify(item.description)}\n`;
    }
    
    // AI Summary in Front Matter
    if (item.aiSummary) {
      md += `aiSummary: ${JSON.stringify(item.aiSummary)}\n`;
    }

    if (item.category) {
      md += `category: "${item.category}"\n`;
    }
    if (item.version) {
      md += `version: "${item.version}"\n`;
    }
    if (item.startDate) {
      md += `startDate: ${item.startDate.toISOString()}\n`;
    }
    if (item.endDate) {
      md += `endDate: ${item.endDate.toISOString()}\n`;
    }

    // Tags in Front Matter (JSON array)
    if (item.tags && item.tags.length > 0) {
      const tags = item.tags.map((t: any) => t.tag.name);
      md += `tags: ${JSON.stringify(tags)}\n`;
    }

    // Related items in Front Matter (simple ID array)
    if (item.related && item.related.length > 0) {
      md += `related: ${JSON.stringify(item.related)}\n`;
    }

    // Keywords in Front Matter (object format: {"word": weight, ...})
    if (item.keywords && item.keywords.length > 0) {
      const keywords: Record<string, number> = {};
      item.keywords
        .sort((a: any, b: any) => b.weight - a.weight)
        .slice(0, 5)
        .forEach((k: any) => {
          keywords[k.keyword.word] = parseFloat(k.weight.toFixed(2));
        });
      md += `keywords: ${JSON.stringify(keywords)}\n`;
    }

    // Concepts in Front Matter (object format: {"name": confidence, ...})
    if (item.concepts && item.concepts.length > 0) {
      const concepts: Record<string, number> = {};
      item.concepts
        .sort((a: any, b: any) => b.confidence - a.confidence)
        .slice(0, 5)
        .forEach((c: any) => {
          concepts[c.concept.name] = parseFloat(c.confidence.toFixed(2));
        });
      md += `concepts: ${JSON.stringify(concepts)}\n`;
    }

    // Embedding in Front Matter (base64 encoded)
    if (item.embedding) {
      // Convert Buffer to base64 string
      const embeddingBase64 = Buffer.from(item.embedding).toString('base64');
      md += `embedding: "${embeddingBase64}"\n`;
    }

    // Timestamps
    md += `createdAt: ${item.createdAt.toISOString()}\n`;
    md += `updatedAt: ${item.updatedAt.toISOString()}\n`;

    md += '---\n\n';

    // Content only (everything else is in front matter)
    if (item.content) {
      md += item.content;
    }

    return md;
  }

  /**
   * Format system state as Markdown
   */
  private formatSystemStateAsMarkdown(state: SystemState): string {
    let md = '---\n';
    md += `id: ${state.id}\n`;
    md += `type: system_state\n`;
    md += `version: "${state.version}"\n`;

    // Parse and add tags
    const tags = state.tags ? JSON.parse(state.tags) : [];
    if (tags.length > 0) {
      md += `tags: ${JSON.stringify(tags)}\n`;
    }

    // Parse and add related items
    const relatedItems = state.relatedItems ? JSON.parse(state.relatedItems) : [];
    if (relatedItems.length > 0) {
      md += `relatedItems: ${JSON.stringify(relatedItems)}\n`;
    }

    // Parse and add metrics
    if (state.metrics) {
      try {
        const metrics = JSON.parse(state.metrics);
        md += `metrics: ${JSON.stringify(metrics)}\n`;
      } catch {
        // If not valid JSON, include as string
        md += `metrics: "${state.metrics}"\n`;
      }
    }

    // Parse and add context
    if (state.context) {
      try {
        const context = JSON.parse(state.context);
        md += `context: ${JSON.stringify(context)}\n`;
      } catch {
        // If not valid JSON, include as string
        md += `context: "${state.context}"\n`;
      }
    }

    // Parse and add checkpoint
    if (state.checkpoint) {
      md += `checkpoint: "${state.checkpoint}"\n`;
    }

    // Parse and add metadata
    if (state.metadata) {
      try {
        const metadata = JSON.parse(state.metadata);
        if (Object.keys(metadata).length > 0) {
          md += `metadata: ${JSON.stringify(metadata)}\n`;
        }
      } catch {
        md += `metadata: "${state.metadata}"\n`;
      }
    }

    // Add active status
    md += `isActive: ${state.isActive}\n`;

    // Summary in Front Matter
    if (state.summary) {
      md += `summary: ${JSON.stringify(state.summary)}\n`;
    }

    // Timestamps
    md += `createdAt: ${state.createdAt.toISOString()}\n`;
    md += `updatedAt: ${state.updatedAt.toISOString()}\n`;

    md += '---\n\n';

    // Content only (everything else is in front matter)
    if (state.content) {
      md += state.content;
    }

    return md;
  }
}