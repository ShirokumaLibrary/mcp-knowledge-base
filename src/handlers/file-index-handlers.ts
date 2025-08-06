/**
 * @ai-context MCP handlers for file indexing functionality
 * @ai-pattern Handler pattern for MCP tool implementation
 */

import { z } from 'zod';
import { FileIndexer } from '../indexing/file-indexer.js';
import { join } from 'path';
import { existsSync, readFileSync, statSync } from 'fs';
import { config } from '../config.js';
import { createLogger } from '../utils/logger.js';

/**
 * Schema definitions for file indexing tools
 */
export const fileIndexSchemas = {
  index_codebase: z.object({
    force: z.boolean().optional().describe('Force re-index all files'),
    exclude: z.array(z.string()).optional().describe('Additional exclude patterns')
  }),

  search_code: z.object({
    query: z.string().describe('Search query (natural language or code snippet)'),
    limit: z.number().optional().default(10).describe('Maximum number of results'),
    fileTypes: z.array(z.string()).optional().describe('Filter by file extensions (e.g., ["js", "ts"])')
  }),

  get_related_files: z.object({
    file: z.string().describe('Base file path to find related files'),
    depth: z.number().optional().default(1).describe('Depth of relation search')
  }),

  get_index_status: z.object({})
};

/**
 * File indexing handlers
 */
export class FileIndexHandlers {
  private indexers: Map<string, FileIndexer> = new Map();
  private logger = createLogger('FileIndexHandlers');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private database: any) {}

  /**
   * Get or create indexer for a project
   */
  private getIndexer(projectPath: string): FileIndexer {
    if (!this.indexers.has(projectPath)) {
      this.indexers.set(projectPath, new FileIndexer({
        projectRoot: projectPath
      }));
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.indexers.get(projectPath)!;
  }

  /**
   * Create handlers map
   */
  createHandlers(): Record<string, (args: unknown) => Promise<{ content: { type: 'text'; text: string }[] }>> {
    return {
      index_codebase: async (_args: unknown) => {
        const _typedArgs = _args as z.infer<typeof fileIndexSchemas.index_codebase>;
        const projectPath = process.cwd();

        const indexer = this.getIndexer(projectPath);

        // Progress tracking
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let indexed = 0;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let total = 0;
        const startTime = Date.now();

        await indexer.indexAll((file, current, totalFiles) => {
          indexed = current;
          total = totalFiles;

          // Log progress every 10 files
          if (current % 10 === 0 || current === totalFiles) {
            this.logger.info(`Indexing progress: ${current}/${totalFiles} files`);
          }
        });

        const stats = indexer.getStats();
        const duration = Date.now() - startTime;

        return {
          content: [{
            type: 'text' as const,
            text: `✅ Indexing completed successfully!

📊 Statistics:
- Files indexed: ${stats.totalFiles}
- Total chunks: ${stats.totalChunks}
- Index size: ${(stats.indexSize / 1024 / 1024).toFixed(2)}MB
- Duration: ${(duration / 1000).toFixed(1)}s
- Average: ${(duration / stats.totalFiles).toFixed(0)}ms per file

The codebase is now indexed and ready for semantic search.`
          }]
        };
      },

      search_code: async (_args: unknown) => {
        const args = _args as z.infer<typeof fileIndexSchemas.search_code>;
        const projectPath = process.cwd();
        const indexPath = join(config.database.path, 'index.db');

        if (!existsSync(indexPath)) {
          throw new Error('No index found. Please run index_codebase first.');
        }

        const indexer = this.getIndexer(projectPath);
        const results = await indexer.search(args.query, {
          limit: args.limit,
          fileTypes: args.fileTypes
        });

        if (results.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No results found for query: "${args.query}"\n\nTry:\n- Using different keywords\n` +
                '- Checking if the codebase is indexed\n- Being more specific or general'
            }]
          };
        }

        const resultText = results
          .map((result, i) => {
            const preview = result.content
              .split('\n')
              .slice(0, 3)
              .map(line => `  ${line}`)
              .join('\n');

            return `${i + 1}. ${result.filePath}:${result.startLine}-${result.endLine} ` +
              `(similarity: ${result.similarity.toFixed(3)})\n${preview}` +
              `${result.content.split('\n').length > 3 ? '\n  ...' : ''}`;
          })
          .join('\n\n');

        return {
          content: [{
            type: 'text' as const,
            text: `🔍 Found ${results.length} results for: "${args.query}"\n\n${resultText}`
          }]
        };
      },

      get_related_files: async (_args: unknown) => {
        const args = _args as z.infer<typeof fileIndexSchemas.get_related_files>;
        const projectPath = process.cwd();
        const indexPath = join(config.database.path, 'index.db');

        if (!existsSync(indexPath)) {
          throw new Error('No index found. Please run index_codebase first.');
        }

        const indexer = this.getIndexer(projectPath);

        // Get content of the base file
        const baseFilePath = join(projectPath, args.file);
        if (!existsSync(baseFilePath)) {
          throw new Error(`File not found: ${args.file}`);
        }

        const baseContent = readFileSync(baseFilePath, 'utf-8');

        // Extract meaningful snippets from the file
        const snippets = baseContent
          .split('\n')
          .filter((line: string) => {
            const trimmed = line.trim();
            return trimmed.length > 10 &&
                     !trimmed.startsWith('//') &&
                     !trimmed.startsWith('*') &&
                     !trimmed.startsWith('import') &&
                     !trimmed.startsWith('export');
          })
          .slice(0, 5)
          .join(' ');

        // Search for related files
        const results = await indexer.search(snippets, {
          limit: 20
        });

        // Filter out the base file and group by file
        const relatedFiles = new Map<string, { similarity: number; chunks: number }>();

        for (const result of results) {
          if (result.filePath !== args.file) {
            const existing = relatedFiles.get(result.filePath);
            if (existing) {
              existing.similarity = Math.max(existing.similarity, result.similarity);
              existing.chunks++;
            } else {
              relatedFiles.set(result.filePath, {
                similarity: result.similarity,
                chunks: 1
              });
            }
          }
        }

        // Sort by relevance (combination of similarity and number of matching chunks)
        const sortedFiles = Array.from(relatedFiles.entries())
          .map(([file, data]) => ({
            file,
            score: data.similarity * Math.log(data.chunks + 1)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        if (sortedFiles.length === 0) {
          return {
            content: [{
              type: 'text' as const,
              text: `No related files found for: ${args.file}`
            }]
          };
        }

        const resultText = sortedFiles
          .map((item, i) => `${i + 1}. ${item.file} (relevance: ${item.score.toFixed(3)})`)
          .join('\n');

        return {
          content: [{
            type: 'text' as const,
            text: `📁 Related files for: ${args.file}\n\n${resultText}`
          }]
        };
      },

      get_index_status: async (_args: unknown) => {
        const projectPath = process.cwd();
        const indexPath = join(config.database.path, 'index.db');

        if (!existsSync(indexPath)) {
          return {
            content: [{
              type: 'text' as const,
              text: '❌ No index found.\n\nRun `index_codebase` to create an index for semantic search.'
            }]
          };
        }

        const indexer = this.getIndexer(projectPath);
        const stats = indexer.getStats();
        const indexStat = statSync(indexPath);

        return {
          content: [{
            type: 'text' as const,
            text: `📊 File Index Status

✅ Index exists at: ${indexPath}

Statistics:
- Total files: ${stats.totalFiles}
- Total chunks: ${stats.totalChunks}
- Index size: ${(stats.indexSize / 1024 / 1024).toFixed(2)}MB
- Last updated: ${indexStat.mtime.toLocaleString()}

Configuration:
- Project root: ${projectPath}
- Chunk size: 30 lines
- Max file size: 10MB

To update the index, run \`index_codebase\`.`
          }]
        };
      }
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    for (const indexer of this.indexers.values()) {
      indexer.close();
    }
    this.indexers.clear();
  }
}