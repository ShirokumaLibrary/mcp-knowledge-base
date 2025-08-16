import { Command } from 'commander';
import chalk from 'chalk';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { ImportManager } from '../../services/import-manager.js';
import Table from 'cli-table3';
import path from 'path';
import fs from 'fs/promises';

export function createImportCommand(): Command {
  const importCmd = new Command('import')
    .description('Import items from markdown files');

  const prisma = new PrismaClient();
  const importManager = new ImportManager(prisma);

  // Import a single file or directory
  importCmd
    .argument('<path>', 'File or directory to import')
    .option('-m, --mode <mode>', 'Import mode: default, sync, or reset', 'default')
    .option('-t, --type <type>', 'Filter by type (for directory import)')
    .option('--dry-run', 'Preview import without making changes')
    .option('--use-transaction', 'Use database transaction for batch imports')
    .action(async (importPath, options) => {
      try {
        // Resolve path
        const resolvedPath = path.resolve(importPath);
        
        // Check if path exists
        const stats = await fs.stat(resolvedPath).catch(() => null);
        if (!stats) {
          console.error(chalk.red(`Error: Path not found: ${importPath}`));
          process.exit(1);
        }

        // Validate mode
        if (!['default', 'sync', 'reset'].includes(options.mode)) {
          console.error(chalk.red(`Error: Invalid mode: ${options.mode}. Use 'default', 'sync', or 'reset'`));
          process.exit(1);
        }

        console.log(chalk.cyan(`Importing from ${importPath}...`));
        console.log(chalk.gray(`Mode: ${options.mode}`));
        if (options.dryRun) {
          console.log(chalk.yellow('DRY RUN: No changes will be made'));
        }

        let result;

        if (stats.isFile()) {
          // Import single file
          if (!resolvedPath.endsWith('.md')) {
            console.error(chalk.red('Error: Only markdown files can be imported'));
            process.exit(1);
          }

          result = await importManager.importFile(resolvedPath, {
            mode: options.mode as 'default' | 'sync' | 'reset',
            dryRun: options.dryRun
          });

          if (result.success) {
            if (result.skipped) {
              console.log(chalk.yellow(`⚠ Item already exists (ID: ${result.itemId}), skipped`));
            } else {
              console.log(chalk.green(`✓ Imported item (ID: ${result.itemId})`));
            }
          }
        } else if (stats.isDirectory()) {
          // Import directory
          result = await importManager.importDirectory(resolvedPath, {
            mode: options.mode as 'default' | 'sync' | 'reset',
            type: options.type,
            dryRun: options.dryRun,
            useTransaction: options.useTransaction
          });

          // Display results
          console.log(chalk.green(`\n✓ Import completed`));
          console.log(chalk.cyan(`  Imported: ${result.imported || 0} item(s)`));
          console.log(chalk.yellow(`  Skipped: ${result.skipped || 0} item(s)`));
          if (result.failed && result.failed > 0) {
            console.log(chalk.red(`  Failed: ${result.failed} item(s)`));
          }

          // Show errors if any
          if (result.errors && result.errors.length > 0) {
            console.log(chalk.red('\nErrors:'));
            for (const error of result.errors) {
              console.log(chalk.red(`  - ${error.message}`));
            }
          }
        }

        await prisma.$disconnect();
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        await prisma.$disconnect();
        process.exit(1);
      }
    });

  // Import all exported data
  importCmd
    .command('all')
    .description('Import all exported data including system state')
    .argument('<directory>', 'Export directory to import from')
    .option('-m, --mode <mode>', 'Import mode: default, sync, or reset', 'default')
    .option('--dry-run', 'Preview import without making changes')
    .action(async (directory, options) => {
      try {
        const resolvedPath = path.resolve(directory);
        
        // Check if directory exists
        const stats = await fs.stat(resolvedPath).catch(() => null);
        if (!stats || !stats.isDirectory()) {
          console.error(chalk.red(`Error: Directory not found: ${directory}`));
          process.exit(1);
        }

        // Validate mode
        if (!['default', 'sync', 'reset'].includes(options.mode)) {
          console.error(chalk.red(`Error: Invalid mode: ${options.mode}. Use 'default', 'sync', or 'reset'`));
          process.exit(1);
        }

        console.log(chalk.cyan(`Importing all data from ${directory}...`));
        console.log(chalk.gray(`Mode: ${options.mode}`));
        if (options.dryRun) {
          console.log(chalk.yellow('DRY RUN: No changes will be made'));
        }

        // Import all data including system state
        const result = await importManager.importAll(resolvedPath, {
          mode: options.mode as 'default' | 'sync' | 'reset',
          dryRun: options.dryRun,
          useTransaction: true
        });

        // Display results
        console.log(chalk.green(`\n✓ Import completed`));
        console.log(chalk.cyan(`  Imported: ${result.imported || 0} item(s)`));
        console.log(chalk.yellow(`  Skipped: ${result.skipped || 0} item(s)`));
        if (result.failed && result.failed > 0) {
          console.log(chalk.red(`  Failed: ${result.failed} item(s)`));
        }

        if (result.stateImported) {
          console.log(chalk.green('  ✓ System state imported'));
        }

        // Show errors if any
        if (result.errors && result.errors.length > 0) {
          console.log(chalk.red('\nErrors:'));
          for (const error of result.errors) {
            console.log(chalk.red(`  - ${error.message}`));
          }
        }

        await prisma.$disconnect();
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        await prisma.$disconnect();
        process.exit(1);
      }
    });

  // Preview import without making changes
  importCmd
    .command('preview')
    .description('Preview what would be imported')
    .argument('<path>', 'File or directory to preview')
    .action(async (importPath) => {
      try {
        const resolvedPath = path.resolve(importPath);
        
        // Check if path exists
        const stats = await fs.stat(resolvedPath).catch(() => null);
        if (!stats) {
          console.error(chalk.red(`Error: Path not found: ${importPath}`));
          process.exit(1);
        }

        const items: Array<{
          id: number;
          type: string;
          title: string;
          status: string;
          priority: string;
          file: string;
        }> = [];

        if (stats.isFile()) {
          // Preview single file
          if (!resolvedPath.endsWith('.md')) {
            console.error(chalk.red('Error: Only markdown files can be imported'));
            process.exit(1);
          }

          const matter = (await import('gray-matter')).default;
          const content = await fs.readFile(resolvedPath, 'utf-8');
          const parsed = matter(content);
          
          items.push({
            id: parsed.data.id,
            type: parsed.data.type,
            title: parsed.data.title,
            status: parsed.data.status,
            priority: parsed.data.priority || 'MEDIUM',
            file: path.basename(resolvedPath)
          });
        } else if (stats.isDirectory()) {
          // Preview directory recursively
          async function scanDirectory(dirPath: string): Promise<void> {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
              const fullPath = path.join(dirPath, entry.name);
              
              if (entry.isDirectory() && entry.name !== '.system') {
                await scanDirectory(fullPath);
              } else if (entry.name.endsWith('.md')) {
                try {
                  const matter = (await import('gray-matter')).default;
                  const content = await fs.readFile(fullPath, 'utf-8');
                  const parsed = matter(content);
                  
                  if (parsed.data.id && parsed.data.type && parsed.data.title) {
                    items.push({
                      id: parsed.data.id,
                      type: parsed.data.type,
                      title: parsed.data.title,
                      status: parsed.data.status,
                      priority: parsed.data.priority || 'MEDIUM',
                      file: path.relative(resolvedPath, fullPath)
                    });
                  }
                } catch {
                  // Skip invalid files
                }
              }
            }
          }

          await scanDirectory(resolvedPath);
        }

        if (items.length === 0) {
          console.log(chalk.yellow('No valid items found to import'));
          await prisma.$disconnect();
          return;
        }

        // Sort items by ID
        items.sort((a, b) => a.id - b.id);

        // Display items in table
        const table = new Table({
          head: ['ID', 'Type', 'Title', 'Status', 'Priority', 'File'],
          colWidths: [8, 15, 35, 15, 10, 40],
          wordWrap: true
        });

        for (const item of items) {
          table.push([
            item.id,
            item.type,
            item.title.substring(0, 32) + (item.title.length > 32 ? '...' : ''),
            item.status,
            item.priority,
            item.file
          ]);
        }

        console.log(chalk.cyan(`\nFound ${items.length} item(s) to import:\n`));
        console.log(table.toString());

        // Check for existing items
        const existingIds = await prisma.item.findMany({
          where: {
            id: { in: items.map(i => i.id) }
          },
          select: { id: true }
        });

        if (existingIds.length > 0) {
          console.log(chalk.yellow(`\n⚠ ${existingIds.length} item(s) already exist in database`));
          console.log(chalk.gray('  Use --mode sync to skip existing items'));
          console.log(chalk.gray('  Use --mode reset to overwrite existing items'));
        }

        await prisma.$disconnect();
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        await prisma.$disconnect();
        process.exit(1);
      }
    });

  // Show import help
  importCmd
    .command('help')
    .description('Show detailed import help')
    .action(() => {
      console.log(chalk.cyan('\nImport Command Usage:\n'));
      
      console.log(chalk.yellow('Import Modes:'));
      console.log('  default - Import new items, skip existing (default behavior)');
      console.log('  sync    - Import new items only, skip all existing');
      console.log('  reset   - Import all items, overwrite existing\n');

      console.log(chalk.yellow('Examples:'));
      console.log('  # Import a single file');
      console.log('  shirokuma-kb import docs/export/issue/1-bug.md\n');
      
      console.log('  # Import a directory');
      console.log('  shirokuma-kb import docs/export/\n');
      
      console.log('  # Import with reset mode (overwrite)');
      console.log('  shirokuma-kb import docs/export/ --mode reset\n');
      
      console.log('  # Import specific type only');
      console.log('  shirokuma-kb import docs/export/ --type issue\n');
      
      console.log('  # Preview without importing');
      console.log('  shirokuma-kb import preview docs/export/\n');
      
      console.log('  # Import all including system state');
      console.log('  shirokuma-kb import all docs/export/\n');

      console.log(chalk.yellow('Security:'));
      console.log('  - Path traversal attempts are blocked');
      console.log('  - Files larger than 10MB are rejected');
      console.log('  - Invalid YAML is rejected\n');
    });

  return importCmd;
}