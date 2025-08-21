import fs from 'fs/promises';
import path from 'path';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
// Types are defined inline in method signatures

// Constants
const SYSTEM_DIR = '.system';
const CURRENT_STATE_DIR = 'current_state';
const MAX_FILENAME_LENGTH = 100;

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
  constructor(private prisma: InstanceType<typeof PrismaClient>) {}

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

    // Remove trailing dots, underscores or spaces (Windows compatibility)
    sanitized = sanitized.replace(/[._\s]+$/, '');

    return sanitized || 'untitled';
  }

  /**
   * Export items to files
   */
  async exportItems(options: ExportOptions = {}): Promise<ExportResult> {
    // Get export directory from environment or use default
    const baseDir = process.env.SHIROKUMA_EXPORT_DIR || 'docs/export';

    // Build query
    interface ItemWhereInput {
      type?: string;
      status?: { name: { in: string[] } };
      tags?: { some: { tag: { name: { in: string[] } } } };
    }
    const where: ItemWhereInput = {};

    if (options.type) {
      where.type = options.type;
    }

    if (options.status && options.status.length > 0) {
      where.status = {
        name: { in: options.status }
      };
    }

    if (options.tags && options.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: options.tags }
          }
        }
      };
    }

    // Fetch items with relations (excluding internal data)
    const items = await this.prisma.item.findMany({
      where,
      take: options.limit,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        content: true,
        aiSummary: true,
        priority: true,
        category: true,
        startDate: true,
        endDate: true,
        version: true,
        // Exclude internal data: searchIndex, entities, embedding
        createdAt: true,
        updatedAt: true,
        status: {
          select: { name: true }
        },
        tags: {
          include: {
            tag: true
          }
        },
        keywords: {
          include: {
            keyword: true
          }
        },
        concepts: {
          include: {
            concept: true
          }
        },
        relationsFrom: {
          include: {
            target: {
              select: { id: true, title: true, type: true }
            }
          }
        },
        relationsTo: {
          include: {
            source: {
              select: { id: true, title: true, type: true }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

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
    const itemsByType = new Map<string, typeof items>();
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
        const filename = `${item.id}-${this.sanitizeFilename(item.title)}.md`;
        const filepath = path.join(typeDir, filename);

        // Check if file with same ID exists and remove it
        const files = await fs.readdir(typeDir).catch(() => []);
        const existingFile = files.find(f => f.startsWith(`${item.id}-`));
        if (existingFile && existingFile !== filename) {
          await fs.unlink(path.join(typeDir, existingFile)).catch(() => {});
        }

        const content = this.formatItemAsMarkdown(item);
        await fs.writeFile(filepath, content, 'utf-8');

        exportResult.files.push(path.relative(baseDir, filepath));
        exportResult.exported++;
      }
    }

    return exportResult;
  }

  /**
   * Format item as Markdown with Front Matter
   */
  private formatItemAsMarkdown(item: {
    id: number;
    type: string;
    title: string;
    status: { name: string };
    priority?: string | null;
    category?: string | null;
    version?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    tags?: { tag: { name: string } }[];
    keywords?: { keyword: { word: string }; weight: number }[];
    concepts?: { concept: { name: string }; confidence: number }[];
    relationsFrom?: { target: { id: number } }[];
    relationsTo?: { source: { id: number } }[];
    createdAt: Date;
    updatedAt: Date;
    description?: string | null;
    content?: string | null;
    aiSummary?: string | null;
    // Removed: embedding, searchIndex, entities (internal data)
  }): string {
    // Front Matter
    let md = '---\n';
    md += `id: ${item.id}\n`;
    md += `type: ${item.type}\n`;
    md += `title: "${item.title.replace(/"/g, '\\"')}"\n`;
    if (item.description) {
      md += `description: "${item.description.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
    }
    md += `status: ${item.status.name}\n`;
    md += `priority: ${item.priority || 'MEDIUM'}\n`;

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

    // AI Summary in Front Matter
    if (item.aiSummary) {
      md += `aiSummary: "${item.aiSummary.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
    }

    // Tags in Front Matter (JSON array)
    if (item.tags && item.tags.length > 0) {
      const tags = item.tags.map((t) => t.tag.name);
      md += `tags: ${JSON.stringify(tags)}\n`;
    }

    // Keywords in Front Matter (object format: {"word": weight, ...})
    if (item.keywords && item.keywords.length > 0) {
      const keywords: Record<string, number> = {};
      item.keywords
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
        .forEach((k) => {
          keywords[k.keyword.word] = parseFloat(k.weight.toFixed(2));
        });
      md += `keywords: ${JSON.stringify(keywords)}\n`;
    }

    // Concepts in Front Matter (object format: {"name": confidence, ...})
    if (item.concepts && item.concepts.length > 0) {
      const concepts: Record<string, number> = {};
      item.concepts
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
        .forEach((c) => {
          concepts[c.concept.name] = parseFloat(c.confidence.toFixed(2));
        });
      md += `concepts: ${JSON.stringify(concepts)}\n`;
    }

    // Embedding excluded from export (internal data)

    // Related items in Front Matter (simple ID array for manual relations)
    const relatedIds: number[] = [];

    if (item.relationsFrom) {
      item.relationsFrom.forEach((r) => {
        relatedIds.push(r.target.id);
      });
    }

    if (item.relationsTo) {
      item.relationsTo.forEach((r) => {
        relatedIds.push(r.source.id);
      });
    }

    if (relatedIds.length > 0) {
      // Remove duplicates
      const uniqueRelated = [...new Set(relatedIds)];
      md += `related: ${JSON.stringify(uniqueRelated)}\n`;
    }

    // Search index and entities excluded from export (internal data)

    // Metadata
    md += `created: ${item.createdAt.toISOString()}\n`;
    md += `updated: ${item.updatedAt.toISOString()}\n`;
    md += '---\n\n';

    // Main content only (Title and Description are in front matter)
    if (item.content) {
      md += item.content;
    }

    // AI Summary, Keywords, and Concepts are now included only in front matter
    // Not duplicated in the content section to keep exports clean


    return md;
  }

  /**
   * Export current system state(s)
   * @param exportAll - If true, exports all system states; if false, only the latest
   */
  async exportCurrentState(exportAll: boolean = false): Promise<StateExportResult> {
    // Get system states based on exportAll flag
    const systemStates = exportAll
      ? await this.prisma.systemState.findMany({
        orderBy: {
          updatedAt: 'desc'
        }
      })
      : await this.prisma.systemState.findMany({
        orderBy: {
          updatedAt: 'desc'
        },
        take: 1
      });

    if (!systemStates || systemStates.length === 0) {
      return {
        exported: false,
        directory: process.env.SHIROKUMA_EXPORT_DIR || 'docs/export',
        file: null,
        count: 0
      };
    }

    const baseDir = process.env.SHIROKUMA_EXPORT_DIR || 'docs/export';
    const currentStateDir = path.join(baseDir, SYSTEM_DIR, CURRENT_STATE_DIR);

    // Create directory if it doesn't exist
    await fs.mkdir(currentStateDir, { recursive: true });

    const latestState = systemStates[0];
    let exportedCount = 0;

    // Export all states
    for (const systemState of systemStates) {
      // Format system state as markdown
      const content = this.formatSystemStateAsMarkdown(systemState);

      // Write to file with ID
      const filename = `${systemState.id}.md`;
      const filepath = path.join(currentStateDir, filename);
      await fs.writeFile(filepath, content, 'utf-8');
      exportedCount++;
    }

    // Create latest.md pointing to the most recent state
    if (latestState) {
      const latestContent = this.formatSystemStateAsMarkdown(latestState);
      const latestPath = path.join(currentStateDir, 'latest.md');
      try {
        await fs.unlink(latestPath).catch(() => {}); // Remove existing symlink/file if exists
        await fs.writeFile(latestPath, latestContent, 'utf-8'); // Create latest copy
      } catch {
        console.warn('Could not create latest.md symlink');
      }
    }

    return {
      exported: true,
      directory: baseDir,
      file: path.relative(baseDir, path.join(currentStateDir, `${latestState.id}.md`)),
      count: exportedCount
    };
  }

  /**
   * Format system state as Markdown with Front Matter
   */
  private formatSystemStateAsMarkdown(state: {
    id: number;
    version: string;
    metrics?: string | null;
    context?: string | null;
    checkpoint?: string | null;
    tags?: string | { tag: { name: string } }[];
    createdAt: Date;
    updatedAt: Date;
    content: string;
    summary?: string | null;
    relatedItems?: string | null;
    metadata?: string | null;
  }): string {
    let md = '---\n';
    md += `id: ${state.id}\n`;
    md += `version: ${state.version}\n`;

    // Parse and include metrics
    if (state.metrics) {
      try {
        const metrics = JSON.parse(state.metrics);
        md += 'metrics:\n';
        for (const [key, value] of Object.entries(metrics)) {
          md += `  ${key}: ${value}\n`;
        }
      } catch {
        // If parsing fails, include as string
        console.warn('Failed to parse metrics as JSON, using raw value');
        md += `metrics: ${state.metrics}\n`;
      }
    }

    // Parse and include context
    if (state.context) {
      try {
        const context = JSON.parse(state.context);
        md += 'context:\n';
        for (const [key, value] of Object.entries(context)) {
          md += `  ${key}: ${JSON.stringify(value)}\n`;
        }
      } catch {
        console.warn('Failed to parse context as JSON, using raw value');
        md += `context: ${state.context}\n`;
      }
    }

    // Include checkpoint if present
    if (state.checkpoint) {
      md += `checkpoint: ${state.checkpoint}\n`;
    }

    // Parse and include related items
    if (state.relatedItems) {
      try {
        const items = JSON.parse(state.relatedItems);
        md += `relatedItems: ${JSON.stringify(items)}\n`;
      } catch {
        console.warn('Failed to parse relatedItems as JSON, using raw value');
        md += `relatedItems: ${state.relatedItems}\n`;
      }
    }

    // Parse and include tags
    if (state.tags) {
      if (typeof state.tags === 'string') {
        try {
          const tags = JSON.parse(state.tags);
          md += `tags: ${JSON.stringify(tags)}\n`;
        } catch {
          console.warn('Failed to parse tags as JSON, using raw value');
          md += `tags: ${state.tags}\n`;
        }
      } else {
        // tags is an array of { tag: { name: string } }
        const tagNames = state.tags.map(t => t.tag.name);
        md += `tags: ${JSON.stringify(tagNames)}\n`;
      }
    }

    // Parse and include metadata
    if (state.metadata) {
      try {
        const metadata = JSON.parse(state.metadata);
        md += 'metadata:\n';
        for (const [key, value] of Object.entries(metadata)) {
          md += `  ${key}: ${JSON.stringify(value)}\n`;
        }
      } catch {
        console.warn('Failed to parse metadata as JSON, using raw value');
        md += `metadata: ${state.metadata}\n`;
      }
    }

    // Timestamps
    md += `created: ${state.createdAt.toISOString()}\n`;
    md += `updated: ${state.updatedAt.toISOString()}\n`;
    md += '---\n\n';

    // Title
    md += '# System State\n\n';

    // Summary
    if (state.summary) {
      md += '## Summary\n\n';
      md += `${state.summary}\n\n`;
    }

    // Main content
    md += '## Content\n\n';
    md += `${state.content}\n\n`;


    return md;
  }

  /**
   * Export single item by ID
   */
  async exportItem(id: number): Promise<ExportResult> {
    const item = await this.prisma.item.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        content: true,
        aiSummary: true,
        priority: true,
        category: true,
        startDate: true,
        endDate: true,
        version: true,
        // Exclude internal data: searchIndex, entities, embedding  
        createdAt: true,
        updatedAt: true,
        status: {
          select: { name: true }
        },
        tags: {
          include: {
            tag: true
          }
        },
        keywords: {
          include: {
            keyword: true
          }
        },
        concepts: {
          include: {
            concept: true
          }
        },
        relationsFrom: {
          include: {
            target: {
              select: { id: true, title: true, type: true }
            }
          }
        },
        relationsTo: {
          include: {
            source: {
              select: { id: true, title: true, type: true }
            }
          }
        }
      }
    });

    if (!item) {
      throw new Error(`Item with ID ${id} not found`);
    }

    const baseDir = process.env.SHIROKUMA_EXPORT_DIR || 'docs/export';
    const typeDir = path.join(baseDir, item.type);

    // Create directory if it doesn't exist
    await fs.mkdir(typeDir, { recursive: true });

    // Export item
    const filename = `${item.id}-${this.sanitizeFilename(item.title)}.md`;
    const filepath = path.join(typeDir, filename);

    // Check if file with same ID exists and remove it
    const files = await fs.readdir(typeDir).catch(() => []);
    const existingFile = files.find(f => f.startsWith(`${item.id}-`));
    if (existingFile && existingFile !== filename) {
      await fs.unlink(path.join(typeDir, existingFile)).catch(() => {});
    }

    const content = this.formatItemAsMarkdown(item);
    await fs.writeFile(filepath, content, 'utf-8');

    return {
      exported: 1,
      directory: baseDir,
      files: [path.relative(baseDir, filepath)]
    };
  }
}