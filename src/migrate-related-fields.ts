#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

interface MigrationResult {
  file: string;
  success: boolean;
  merged: string;
  error?: string;
}

async function findFilesToMigrate(dataDir: string): Promise<string[]> {
  const pattern = path.join(dataDir, '**/*.md');
  const files = await glob(pattern);
  
  const filesToMigrate: string[] = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('related_documents:') || content.includes('related_tasks:')) {
      filesToMigrate.push(file);
    }
  }
  
  return filesToMigrate;
}

function extractRelatedField(content: string, fieldName: string): string {
  const regex = new RegExp(`^${fieldName}: (.*)$`, 'm');
  const match = content.match(regex);
  return match ? match[1] : '[]';
}

function mergeRelatedArrays(relatedDocs: string, relatedTasks: string): string {
  // Handle empty arrays
  if (relatedDocs === '[]' && relatedTasks === '[]') {
    return '[]';
  }
  if (relatedDocs === '[]') {
    return relatedTasks;
  }
  if (relatedTasks === '[]') {
    return relatedDocs;
  }
  
  // Parse and merge arrays
  try {
    const docs = JSON.parse(relatedDocs);
    const tasks = JSON.parse(relatedTasks);
    const merged = [...tasks, ...docs];
    return JSON.stringify(merged);
  } catch (e) {
    // If parsing fails, try to merge as strings
    const docsContent = relatedDocs.replace(/^\[/, '').replace(/\]$/, '');
    const tasksContent = relatedTasks.replace(/^\[/, '').replace(/\]$/, '');
    
    if (docsContent && tasksContent) {
      return `[${tasksContent}, ${docsContent}]`;
    } else if (docsContent) {
      return `[${docsContent}]`;
    } else if (tasksContent) {
      return `[${tasksContent}]`;
    }
    return '[]';
  }
}

function migrateContent(content: string): { content: string; merged: string } {
  const relatedDocs = extractRelatedField(content, 'related_documents');
  const relatedTasks = extractRelatedField(content, 'related_tasks');
  const merged = mergeRelatedArrays(relatedDocs, relatedTasks);
  
  // Find frontmatter boundaries
  const firstDelimiter = content.indexOf('---');
  const secondDelimiter = content.indexOf('---', firstDelimiter + 3);
  
  if (firstDelimiter === -1 || secondDelimiter === -1) {
    // No frontmatter found, return as is
    return { content, merged: '[]' };
  }
  
  // Split content into parts
  const beforeFrontmatter = content.substring(0, firstDelimiter);
  const frontmatter = content.substring(firstDelimiter, secondDelimiter + 3);
  const afterFrontmatter = content.substring(secondDelimiter + 3);
  
  // Process only frontmatter
  let newFrontmatter = frontmatter;
  let relatedInserted = false;
  
  // Replace related_documents with related field
  newFrontmatter = newFrontmatter.replace(/^related_documents:.*$/m, (match) => {
    if (!relatedInserted) {
      relatedInserted = true;
      return `related: ${merged}`;
    }
    return '';
  });
  
  // Remove related_tasks (or replace if related_documents wasn't found)
  newFrontmatter = newFrontmatter.replace(/^related_tasks:.*$/m, (match) => {
    if (!relatedInserted) {
      relatedInserted = true;
      return `related: ${merged}`;
    }
    return '';
  });
  
  // Clean up empty lines in frontmatter only
  newFrontmatter = newFrontmatter.replace(/\n\n+/g, '\n');
  
  // Reconstruct content
  const newContent = beforeFrontmatter + newFrontmatter + afterFrontmatter;
  
  return { content: newContent, merged };
}

async function migrateFile(file: string, createBackup: boolean): Promise<MigrationResult> {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Create backup if requested
    if (createBackup) {
      fs.writeFileSync(`${file}.bak`, content);
    }
    
    const { content: newContent, merged } = migrateContent(content);
    
    // Write migrated content
    fs.writeFileSync(file, newContent);
    
    return {
      file,
      success: true,
      merged
    };
  } catch (error) {
    return {
      file,
      success: false,
      merged: '[]',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const createBackup = !args.includes('--no-backup');
  const dataDir = process.env.MCP_DATABASE_PATH || '.shirokuma/data';
  
  console.log('🔄 Migrating related_documents/related_tasks to unified related field');
  console.log(`Directory: ${dataDir}`);
  console.log(`Backup: ${createBackup ? 'Yes' : 'No'}`);
  console.log('');
  
  // Find files to migrate
  const files = await findFilesToMigrate(dataDir);
  
  if (files.length === 0) {
    console.log(`${colors.green}✅ No files need migration${colors.reset}`);
    return;
  }
  
  console.log(`Found ${files.length} files to migrate`);
  console.log('');
  
  // Migrate each file
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    process.stdout.write(`Processing: ${relativePath}... `);
    
    const result = await migrateFile(file, createBackup);
    
    if (result.success) {
      console.log(`${colors.green}✅${colors.reset}`);
      console.log(`  Related: ${result.merged}`);
      successCount++;
    } else {
      console.log(`${colors.red}❌${colors.reset}`);
      console.log(`  Error: ${result.error}`);
      errorCount++;
    }
  }
  
  console.log('');
  console.log(`${colors.green}✅ Migration complete${colors.reset}`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  
  if (createBackup) {
    console.log('');
    console.log('Backup files created with .bak extension');
    console.log(`To remove backups: find ${dataDir} -name '*.bak' -delete`);
  }
  
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run if called directly
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});