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
async function findFilesToMigrate(dataDir) {
    const pattern = path.join(dataDir, '**/*.md');
    const files = await glob(pattern);
    const filesToMigrate = [];
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        if (content.includes('related_documents:') || content.includes('related_tasks:')) {
            filesToMigrate.push(file);
        }
    }
    return filesToMigrate;
}
function extractRelatedField(content, fieldName) {
    const regex = new RegExp(`^${fieldName}: (.*)$`, 'm');
    const match = content.match(regex);
    return match ? match[1] : '[]';
}
function mergeRelatedArrays(relatedDocs, relatedTasks) {
    if (relatedDocs === '[]' && relatedTasks === '[]') {
        return '[]';
    }
    if (relatedDocs === '[]') {
        return relatedTasks;
    }
    if (relatedTasks === '[]') {
        return relatedDocs;
    }
    try {
        const docs = JSON.parse(relatedDocs);
        const tasks = JSON.parse(relatedTasks);
        const merged = [...tasks, ...docs];
        return JSON.stringify(merged);
    }
    catch (e) {
        const docsContent = relatedDocs.replace(/^\[/, '').replace(/\]$/, '');
        const tasksContent = relatedTasks.replace(/^\[/, '').replace(/\]$/, '');
        if (docsContent && tasksContent) {
            return `[${tasksContent}, ${docsContent}]`;
        }
        else if (docsContent) {
            return `[${docsContent}]`;
        }
        else if (tasksContent) {
            return `[${tasksContent}]`;
        }
        return '[]';
    }
}
function migrateContent(content) {
    if (!content.startsWith('---\n')) {
        return { content, merged: '[]' };
    }
    const firstDelimiterEnd = 4;
    const secondDelimiterStart = content.indexOf('\n---\n', firstDelimiterEnd);
    if (secondDelimiterStart === -1) {
        return { content, merged: '[]' };
    }
    const frontmatter = content.substring(firstDelimiterEnd, secondDelimiterStart);
    const frontmatterEnd = secondDelimiterStart + 5;
    const afterFrontmatter = content.substring(frontmatterEnd);
    const relatedDocs = extractRelatedField('---\n' + frontmatter + '\n---', 'related_documents');
    const relatedTasks = extractRelatedField('---\n' + frontmatter + '\n---', 'related_tasks');
    const merged = mergeRelatedArrays(relatedDocs, relatedTasks);
    const lines = frontmatter.split('\n');
    const newLines = [];
    let relatedInserted = false;
    for (const line of lines) {
        if (line.match(/^related_documents:\s*/)) {
            if (!relatedInserted) {
                newLines.push(`related: ${merged}`);
                relatedInserted = true;
            }
        }
        else if (line.match(/^related_tasks:\s*/)) {
            if (!relatedInserted) {
                newLines.push(`related: ${merged}`);
                relatedInserted = true;
            }
        }
        else {
            newLines.push(line);
        }
    }
    const newFrontmatter = newLines.join('\n');
    const newContent = '---\n' + newFrontmatter + '\n---\n' + afterFrontmatter;
    return { content: newContent, merged };
}
async function migrateFile(file, createBackup) {
    try {
        const content = fs.readFileSync(file, 'utf-8');
        if (createBackup) {
            fs.writeFileSync(`${file}.bak`, content);
        }
        const { content: newContent, merged } = migrateContent(content);
        fs.writeFileSync(file, newContent);
        return {
            file,
            success: true,
            merged
        };
    }
    catch (error) {
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
    const files = await findFilesToMigrate(dataDir);
    if (files.length === 0) {
        console.log(`${colors.green}✅ No files need migration${colors.reset}`);
        return;
    }
    console.log(`Found ${files.length} files to migrate`);
    console.log('');
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
        }
        else {
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
main().catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
});
