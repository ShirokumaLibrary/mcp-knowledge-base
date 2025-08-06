import { z } from 'zod';
import { FileIndexer } from '../indexing/file-indexer.js';
import { join } from 'path';
import { existsSync, readFileSync, statSync } from 'fs';
import { config } from '../config.js';
import { createLogger } from '../utils/logger.js';
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
export class FileIndexHandlers {
    database;
    indexers = new Map();
    logger = createLogger('FileIndexHandlers');
    constructor(database) {
        this.database = database;
    }
    getIndexer(projectPath) {
        if (!this.indexers.has(projectPath)) {
            this.indexers.set(projectPath, new FileIndexer({
                projectRoot: projectPath
            }));
        }
        return this.indexers.get(projectPath);
    }
    createHandlers() {
        return {
            index_codebase: async (_args) => {
                const _typedArgs = _args;
                const projectPath = process.cwd();
                const indexer = this.getIndexer(projectPath);
                let indexed = 0;
                let total = 0;
                const startTime = Date.now();
                await indexer.indexAll((file, current, totalFiles) => {
                    indexed = current;
                    total = totalFiles;
                    if (current % 10 === 0 || current === totalFiles) {
                        this.logger.info(`Indexing progress: ${current}/${totalFiles} files`);
                    }
                });
                const stats = indexer.getStats();
                const duration = Date.now() - startTime;
                return {
                    content: [{
                            type: 'text',
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
            search_code: async (_args) => {
                const args = _args;
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
                                type: 'text',
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
                            type: 'text',
                            text: `🔍 Found ${results.length} results for: "${args.query}"\n\n${resultText}`
                        }]
                };
            },
            get_related_files: async (_args) => {
                const args = _args;
                const projectPath = process.cwd();
                const indexPath = join(config.database.path, 'index.db');
                if (!existsSync(indexPath)) {
                    throw new Error('No index found. Please run index_codebase first.');
                }
                const indexer = this.getIndexer(projectPath);
                const baseFilePath = join(projectPath, args.file);
                if (!existsSync(baseFilePath)) {
                    throw new Error(`File not found: ${args.file}`);
                }
                const baseContent = readFileSync(baseFilePath, 'utf-8');
                const snippets = baseContent
                    .split('\n')
                    .filter((line) => {
                    const trimmed = line.trim();
                    return trimmed.length > 10 &&
                        !trimmed.startsWith('//') &&
                        !trimmed.startsWith('*') &&
                        !trimmed.startsWith('import') &&
                        !trimmed.startsWith('export');
                })
                    .slice(0, 5)
                    .join(' ');
                const results = await indexer.search(snippets, {
                    limit: 20
                });
                const relatedFiles = new Map();
                for (const result of results) {
                    if (result.filePath !== args.file) {
                        const existing = relatedFiles.get(result.filePath);
                        if (existing) {
                            existing.similarity = Math.max(existing.similarity, result.similarity);
                            existing.chunks++;
                        }
                        else {
                            relatedFiles.set(result.filePath, {
                                similarity: result.similarity,
                                chunks: 1
                            });
                        }
                    }
                }
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
                                type: 'text',
                                text: `No related files found for: ${args.file}`
                            }]
                    };
                }
                const resultText = sortedFiles
                    .map((item, i) => `${i + 1}. ${item.file} (relevance: ${item.score.toFixed(3)})`)
                    .join('\n');
                return {
                    content: [{
                            type: 'text',
                            text: `📁 Related files for: ${args.file}\n\n${resultText}`
                        }]
                };
            },
            get_index_status: async (_args) => {
                const projectPath = process.cwd();
                const indexPath = join(config.database.path, 'index.db');
                if (!existsSync(indexPath)) {
                    return {
                        content: [{
                                type: 'text',
                                text: '❌ No index found.\n\nRun `index_codebase` to create an index for semantic search.'
                            }]
                    };
                }
                const indexer = this.getIndexer(projectPath);
                const stats = indexer.getStats();
                const indexStat = statSync(indexPath);
                return {
                    content: [{
                            type: 'text',
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
    async cleanup() {
        for (const indexer of this.indexers.values()) {
            indexer.close();
        }
        this.indexers.clear();
    }
}
