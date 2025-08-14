import { Command } from 'commander';
import chalk from 'chalk';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { ExportManager } from '../../services/export-manager.js';
import Table from 'cli-table3';
import path from 'path';

export function createExportCommand(): Command {
  const exportCmd = new Command('export')
    .description('Export items to files');

  const prisma = new PrismaClient();
  const exportManager = new ExportManager(prisma);

  // Export all or filtered items
  exportCmd
    .argument('[id]', 'Export specific item by ID or "state" for current state')
    .option('-t, --type <type>', 'Filter by type')
    .option('-s, --status <status...>', 'Filter by status')
    .option('--tags <tags...>', 'Filter by tags')
    .option('-l, --limit <number>', 'Limit number of items', parseInt)
    .option('-d, --dir <directory>', 'Export directory (overrides SHIROKUMA_EXPORT_DIR)')
    .option('--include-state', 'Include current system state in export')
    .option('--all-states', 'Export all system state history (with --include-state or "state" command)')
    .action(async (id, options) => {
      try {
        // Override export directory if specified with validation
        if (options.dir) {
          const normalizedPath = path.resolve(options.dir);
          // Ensure export directory is within project or a safe location
          const safeBasePath = path.resolve(process.cwd());
          if (!normalizedPath.startsWith(safeBasePath) && !normalizedPath.startsWith('/tmp')) {
            console.error(chalk.red('Error: Export directory must be within project directory or /tmp'));
            process.exit(1);
          }
          process.env.SHIROKUMA_EXPORT_DIR = normalizedPath;
        }

        let result;

        if (id === 'state') {
          // Export current state(s)
          const exportAll = options.allStates || false;
          console.log(chalk.cyan(exportAll ? 'Exporting all system states...' : 'Exporting current system state...'));
          const stateResult = await exportManager.exportCurrentState(exportAll);

          if (stateResult.exported) {
            if (stateResult.count && stateResult.count > 1) {
              console.log(chalk.green(`\n✓ Exported ${stateResult.count} system states to ${stateResult.directory}/.system/current_state/`));
            } else {
              console.log(chalk.green(`\n✓ Exported system state to ${stateResult.directory}/${stateResult.file}`));
            }
            console.log(chalk.gray(`  Latest symlink: ${stateResult.directory}/.system/current_state/latest.md`));
          } else {
            console.log(chalk.yellow('\n⚠ No system state found to export'));
          }

          await prisma.$disconnect();
          return;
        } else if (id) {
          // Export single item
          const itemId = parseInt(id);
          if (isNaN(itemId)) {
            console.error(chalk.red('Error: Invalid item ID'));
            process.exit(1);
          }

          console.log(chalk.cyan(`Exporting item ${itemId}...`));
          result = await exportManager.exportItem(itemId);
        } else {
          // Export multiple items
          console.log(chalk.cyan('Exporting items...'));

          result = await exportManager.exportItems({
            type: options.type,
            status: options.status,
            tags: options.tags,
            limit: options.limit,
            includeState: options.includeState,
            includeAllStates: options.allStates
          });
        }

        // Display results
        console.log(chalk.green(`\n✓ Exported ${result.exported} item(s) to ${result.directory}`));

        if (result.files.length > 0) {
          console.log(chalk.cyan('\nExported files:'));

          // Group files by type
          const filesByType = new Map<string, string[]>();
          for (const file of result.files) {
            const type = file.split('/')[0];
            if (!filesByType.has(type)) {
              filesByType.set(type, []);
            }
            filesByType.get(type)!.push(file);
          }

          // Display files by type
          for (const [type, files] of filesByType) {
            console.log(chalk.yellow(`\n  ${type}/`));
            for (const file of files) {
              const filename = file.split('/')[1];
              console.log(`    ${filename}`);
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

  // List exportable items (preview)
  exportCmd
    .command('preview')
    .description('Preview items that would be exported')
    .option('-t, --type <type>', 'Filter by type')
    .option('-s, --status <status...>', 'Filter by status')
    .option('--tags <tags...>', 'Filter by tags')
    .option('-l, --limit <number>', 'Limit number of items', parseInt)
    .action(async (options) => {
      try {
        // Build query
        const where: Record<string, unknown> = {};

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

        // Fetch items
        const items = await prisma.item.findMany({
          where,
          take: options.limit || 100,
          include: {
            status: true,
            tags: {
              include: {
                tag: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });

        if (items.length === 0) {
          console.log(chalk.yellow('No items found matching the criteria'));
          await prisma.$disconnect();
          return;
        }

        // Display items in table
        const table = new Table({
          head: ['ID', 'Type', 'Title', 'Status', 'Tags'],
          colWidths: [8, 15, 40, 15, 30],
          wordWrap: true
        });

        for (const item of items) {
          const tags = item.tags.map((t: { tag: { name: string } }) => t.tag.name).join(', ');
          table.push([
            item.id,
            item.type,
            item.title.substring(0, 37) + (item.title.length > 37 ? '...' : ''),
            item.status.name,
            tags || '-'
          ]);
        }

        console.log(chalk.cyan(`\nFound ${items.length} item(s) to export:\n`));
        console.log(table.toString());

        // Show export directory
        const exportDir = process.env.SHIROKUMA_EXPORT_DIR || 'docs/export';
        console.log(chalk.gray(`\nWould export to: ${exportDir}`));

        await prisma.$disconnect();
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        await prisma.$disconnect();
        process.exit(1);
      }
    });

  // Export all items including state
  exportCmd
    .command('all')
    .description('Export all items including system state')
    .option('-d, --dir <directory>', 'Export directory (overrides SHIROKUMA_EXPORT_DIR)')
    .action(async (options) => {
      try {
        // Override export directory if specified with validation
        if (options.dir) {
          const normalizedPath = path.resolve(options.dir);
          // Ensure export directory is within project or a safe location
          const safeBasePath = path.resolve(process.cwd());
          if (!normalizedPath.startsWith(safeBasePath) && !normalizedPath.startsWith('/tmp')) {
            console.error(chalk.red('Error: Export directory must be within project directory or /tmp'));
            process.exit(1);
          }
          process.env.SHIROKUMA_EXPORT_DIR = normalizedPath;
        }

        console.log(chalk.cyan('Exporting all items and system state...'));

        // Export all items with all states
        const result = await exportManager.exportItems({
          includeState: true,
          includeAllStates: true  // Export all state history
        });

        // Display results
        console.log(chalk.green(`\n✓ Exported ${result.exported} item(s) to ${result.directory}`));

        if (result.stateExported) {
          console.log(chalk.green('✓ Exported system state to .system/current_state/'));
        }

        if (result.files.length > 0) {
          console.log(chalk.cyan('\nExported files:'));

          // Group files by type
          const filesByType = new Map<string, string[]>();
          for (const file of result.files) {
            const type = file.split('/')[0];
            if (!filesByType.has(type)) {
              filesByType.set(type, []);
            }
            filesByType.get(type)!.push(file);
          }

          // Display files by type
          for (const [type, files] of filesByType) {
            console.log(chalk.yellow(`\n  ${type}/`));
            for (const file of files) {
              const filename = file.split('/').pop();
              console.log(`    ${filename}`);
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

  // Show export statistics
  exportCmd
    .command('stats')
    .description('Show export statistics by type')
    .action(async () => {
      try {
        // Get counts by type
        const stats = await prisma.item.groupBy({
          by: ['type'],
          _count: {
            _all: true
          }
        });

        // Sort by count manually
        stats.sort((a, b) => {
          const countA = typeof a._count === 'object' && a._count !== null ?
            (a._count as Record<string, number>)._all || 0 : 0;
          const countB = typeof b._count === 'object' && b._count !== null ?
            (b._count as Record<string, number>)._all || 0 : 0;
          return countB - countA;
        });

        if (stats.length === 0) {
          console.log(chalk.yellow('No items in database'));
          await prisma.$disconnect();
          return;
        }

        // Display statistics
        const table = new Table({
          head: ['Type', 'Count', 'Export Path'],
          colWidths: [20, 10, 50]
        });

        const exportDir = process.env.SHIROKUMA_EXPORT_DIR || 'docs/export';
        let total = 0;

        for (const stat of stats) {
          const count = typeof stat._count === 'object' && stat._count !== null ?
            (stat._count as Record<string, number>)._all || 0 : 0;
          table.push([
            stat.type,
            count,
            `${exportDir}/${stat.type}/`
          ]);
          total += count;
        }

        console.log(chalk.cyan('\nExport Statistics:\n'));
        console.log(table.toString());
        console.log(chalk.green(`\nTotal items: ${total}`));

        await prisma.$disconnect();
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        await prisma.$disconnect();
        process.exit(1);
      }
    });

  return exportCmd;
}