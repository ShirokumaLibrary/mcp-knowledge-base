#!/usr/bin/env node
/**
 * @ai-context Migration script to update tag format from comma-separated to JSON array
 * @ai-pattern One-time migration to standardize tag storage format
 * @ai-critical Must preserve all data while updating format
 * @ai-why JSON arrays properly handle tags with commas and spaces
 */
import { getConfig } from './config.js';
import { globSync } from 'glob';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { parseMarkdown, generateMarkdown } from './utils/markdown-parser.js';
async function migrateTagsToJson() {
    console.log('🔄 Starting tag format migration...\n');
    const config = getConfig();
    const databasePath = config.database.path;
    let totalFiles = 0;
    let updatedFiles = 0;
    // Define file patterns to migrate
    const patterns = [
        'issues/issue-*.md',
        'plans/plan-*.md',
        'docs/doc-*.md',
        'knowledge/knowledge-*.md',
        'sessions/**/session-*.md',
        'sessions/**/daily-summary-*.md'
    ];
    for (const pattern of patterns) {
        const files = globSync(path.join(databasePath, pattern));
        console.log(`📂 Processing ${pattern}: ${files.length} files`);
        for (const file of files) {
            totalFiles++;
            try {
                const content = readFileSync(file, 'utf-8');
                const parsed = parseMarkdown(content);
                // Check if tags exist and are not already in JSON format
                if (parsed.metadata.tags && Array.isArray(parsed.metadata.tags)) {
                    // Check if the original file had comma-separated format
                    const lines = content.split('\n');
                    let needsUpdate = false;
                    for (const line of lines) {
                        if (line.startsWith('tags:') && !line.includes('[')) {
                            // This is comma-separated format, needs update
                            needsUpdate = true;
                            break;
                        }
                    }
                    if (needsUpdate) {
                        // Regenerate the file with JSON format
                        const newContent = generateMarkdown(parsed.metadata, parsed.content);
                        writeFileSync(file, newContent, 'utf-8');
                        updatedFiles++;
                        console.log(`  ✅ Updated: ${path.basename(file)}`);
                    }
                }
            }
            catch (error) {
                console.error(`  ❌ Error processing ${file}:`, error);
            }
        }
    }
    console.log('\n📊 Migration complete:');
    console.log(`  - Total files processed: ${totalFiles}`);
    console.log(`  - Files updated: ${updatedFiles}`);
    console.log(`  - Files already in correct format: ${totalFiles - updatedFiles}`);
    if (updatedFiles > 0) {
        console.log('\n💡 Tip: Run "npm run rebuild-db" to update the search index.');
    }
}
// Run the migration
migrateTagsToJson().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=migrate-tags-to-json.js.map