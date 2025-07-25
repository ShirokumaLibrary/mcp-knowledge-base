#!/usr/bin/env node
/**
 * @ai-context Migration script for doc/knowledge unification
 * @ai-intent Migrate existing doc and knowledge files to unified document structure
 * @ai-critical One-time migration - must handle errors gracefully
 * @ai-pattern Preserves original files, creates new structure
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { parseMarkdown } from './utils/markdown-parser.js';
import { DatabaseConnection } from './database/base.js';
import { DocumentRepository } from './database/document-repository.js';
import { getConfig } from './config.js';
async function migrateDocuments() {
    console.log('Starting doc/knowledge unification migration...');
    const config = getConfig();
    const dataDir = config.database.path;
    const documentsPath = path.join(dataDir, 'documents');
    // Initialize database
    const connection = new DatabaseConnection(config.database.sqlitePath);
    await connection.initialize();
    const db = connection.getDatabase();
    // Create document repository
    const docRepo = new DocumentRepository(db, documentsPath);
    await docRepo.initializeDatabase();
    // Ensure target directories exist
    await fs.mkdir(path.join(documentsPath, 'doc'), { recursive: true });
    await fs.mkdir(path.join(documentsPath, 'knowledge'), { recursive: true });
    // Track migration results
    const results = {
        docs: { success: 0, failed: 0 },
        knowledge: { success: 0, failed: 0 }
    };
    // Migrate docs
    console.log('\nMigrating doc files...');
    const docFiles = await glob(path.join(dataDir, 'docs', 'doc-*.md'));
    for (const filePath of docFiles) {
        try {
            const filename = path.basename(filePath);
            const match = filename.match(/doc-(\d+)\.md/);
            if (!match) {
                console.error(`  ✗ Skipping invalid filename: ${filename}`);
                results.docs.failed++;
                continue;
            }
            const id = parseInt(match[1]);
            const content = await fs.readFile(filePath, 'utf-8');
            const { metadata, content: docContent } = parseMarkdown(content);
            // Create new file in documents/doc directory
            const newPath = path.join(documentsPath, 'doc', filename);
            await fs.writeFile(newPath, content, 'utf-8');
            // Sync to SQLite
            const document = {
                type: 'doc',
                id,
                title: metadata.title || '',
                description: metadata.description,
                content: docContent,
                tags: metadata.tags || [],
                created_at: metadata.created_at || new Date().toISOString(),
                updated_at: metadata.updated_at || new Date().toISOString()
            };
            // Update SQLite search index
            await db.runAsync(`
        INSERT OR REPLACE INTO search_documents 
        (type, id, title, summary, content, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                document.type,
                document.id,
                document.title,
                document.description || null,
                document.content,
                JSON.stringify(document.tags),
                document.created_at,
                document.updated_at
            ]);
            console.log(`  ✓ Migrated ${filename}`);
            results.docs.success++;
        }
        catch (error) {
            console.error(`  ✗ Failed to migrate ${path.basename(filePath)}:`, error);
            results.docs.failed++;
        }
    }
    // Migrate knowledge
    console.log('\nMigrating knowledge files...');
    const knowledgeFiles = await glob(path.join(dataDir, 'knowledge', 'knowledge-*.md'));
    for (const filePath of knowledgeFiles) {
        try {
            const filename = path.basename(filePath);
            const match = filename.match(/knowledge-(\d+)\.md/);
            if (!match) {
                console.error(`  ✗ Skipping invalid filename: ${filename}`);
                results.knowledge.failed++;
                continue;
            }
            const id = parseInt(match[1]);
            const content = await fs.readFile(filePath, 'utf-8');
            const { metadata, content: knowledgeContent } = parseMarkdown(content);
            // Create new file in documents/knowledge directory
            const newPath = path.join(documentsPath, 'knowledge', filename);
            await fs.writeFile(newPath, content, 'utf-8');
            // Sync to SQLite
            const document = {
                type: 'knowledge',
                id,
                title: metadata.title || '',
                description: metadata.description,
                content: knowledgeContent,
                tags: metadata.tags || [],
                created_at: metadata.created_at || new Date().toISOString(),
                updated_at: metadata.updated_at || new Date().toISOString()
            };
            // Update SQLite search index
            await db.runAsync(`
        INSERT OR REPLACE INTO search_documents 
        (type, id, title, summary, content, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                document.type,
                document.id,
                document.title,
                document.description || null,
                document.content,
                JSON.stringify(document.tags),
                document.created_at,
                document.updated_at
            ]);
            console.log(`  ✓ Migrated ${filename}`);
            results.knowledge.success++;
        }
        catch (error) {
            console.error(`  ✗ Failed to migrate ${path.basename(filePath)}:`, error);
            results.knowledge.failed++;
        }
    }
    // Print summary
    console.log('\n=== Migration Summary ===');
    console.log(`Docs: ${results.docs.success} succeeded, ${results.docs.failed} failed`);
    console.log(`Knowledge: ${results.knowledge.success} succeeded, ${results.knowledge.failed} failed`);
    console.log('\nOriginal files have been preserved.');
    console.log('New files created in:', documentsPath);
    // Close database
    connection.close();
    if (results.docs.failed > 0 || results.knowledge.failed > 0) {
        process.exit(1);
    }
}
// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateDocuments().catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate-to-unified-documents.js.map