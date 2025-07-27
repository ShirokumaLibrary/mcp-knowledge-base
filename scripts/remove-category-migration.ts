#!/usr/bin/env ts-node

/**
 * @ai-context Migration script to remove category field from session markdown files
 * @ai-intent Clean up session files after removing category feature
 * @ai-critical Preserves all other session data
 * @ai-why Category field is redundant with tags
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { getConfig } from '../src/config.js';

/**
 * @ai-intent Parse and update session markdown files
 * @ai-flow 1. Find session files -> 2. Read content -> 3. Remove category -> 4. Write back
 * @ai-critical Preserves exact formatting except category line
 * @ai-pattern YAML frontmatter processing
 */
async function migrateSessionFiles() {
  const config = getConfig();
  const sessionsPath = config.database.sessionsPath;
  
  console.log('Starting category field removal migration...');
  console.log(`Sessions directory: ${sessionsPath}`);
  
  // Find all session markdown files
  const sessionFiles = await glob('**/session-*.md', {
    cwd: sessionsPath,
    absolute: true
  });
  
  console.log(`Found ${sessionFiles.length} session files to process`);
  
  let processedCount = 0;
  let updatedCount = 0;
  
  for (const filePath of sessionFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file has frontmatter with category field
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      
      if (frontMatterMatch) {
        const frontMatter = frontMatterMatch[1];
        const body = frontMatterMatch[2];
        
        // Check if category field exists
        if (frontMatter.includes('category:')) {
          // Remove category line
          const updatedFrontMatter = frontMatter
            .split('\n')
            .filter(line => !line.startsWith('category:'))
            .join('\n');
          
          // Reconstruct file content
          const updatedContent = `---\n${updatedFrontMatter}\n---\n${body}`;
          
          // Write back to file
          fs.writeFileSync(filePath, updatedContent, 'utf8');
          updatedCount++;
          console.log(`Updated: ${path.relative(sessionsPath, filePath)}`);
        }
      }
      
      processedCount++;
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }
  
  console.log('\nMigration complete!');
  console.log(`Processed: ${processedCount} files`);
  console.log(`Updated: ${updatedCount} files`);
  console.log(`Skipped: ${processedCount - updatedCount} files (no category field)`);
}

// Run migration
migrateSessionFiles().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});