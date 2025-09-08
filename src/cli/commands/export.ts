import { Command } from 'commander';
import chalk from 'chalk';
import { AppDataSource } from '../../data-source.js';
import { ExportManager } from '../../services/export-manager.js';
import { Item } from '../../entities/Item.js';
import { Status } from '../../entities/Status.js';
import { ItemTag } from '../../entities/ItemTag.js';
import Table from 'cli-table3';
import path from 'path';

export function createExportCommand(): Command {
  const exportCmd = new Command('export')
    .description('Export items to files');

  const exportManager = new ExportManager();

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
        // Initialize data source
        if (!AppDataSource.isInitialized) {
          await AppDataSource.initialize();
        }

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

          await AppDataSource.destroy();
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

        await AppDataSource.destroy();
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        await AppDataSource.destroy();
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
        // Initialize data source
        if (!AppDataSource.isInitialized) {
          await AppDataSource.initialize();
        }

        const itemRepo = AppDataSource.getRepository(Item);
        const statusRepo = AppDataSource.getRepository(Status);
        const itemTagRepo = AppDataSource.getRepository(ItemTag);

        // Build query
        const query = itemRepo.createQueryBuilder('item')
          .leftJoinAndSelect('item.status', 'status');

        if (options.type) {
          query.andWhere('item.type = :type', { type: options.type });
        }

        if (options.status && options.status.length > 0) {
          query.andWhere('status.name IN (:...statuses)', { statuses: options.status });
        }

        if (options.tags && options.tags.length > 0) {
          query.innerJoin('item_tags', 'it', 'it.item_id = item.id')
               .innerJoin('tags', 't', 't.id = it.tag_id')
               .andWhere('t.name IN (:...tags)', { tags: options.tags });
        }

        if (options.limit) {
          query.limit(options.limit);
        } else {
          query.limit(100);
        }

        query.orderBy('item.updatedAt', 'DESC');

        const items = await query.getMany();

        if (items.length === 0) {
          console.log(chalk.yellow('No items found matching the criteria'));
          await AppDataSource.destroy();
          return;
        }

        // Display items in table
        const table = new Table({
          head: ['ID', 'Type', 'Title', 'Status', 'Tags'],
          colWidths: [8, 15, 40, 15, 30],
          wordWrap: true
        });

        for (const item of items) {
          // Get tags for this item
          const itemTags = await itemTagRepo.find({
            where: { itemId: item.id },
            relations: ['tag']
          });
          const tags = itemTags.map(it => it.tag.name).join(', ');

          // Get status name
          const status = await statusRepo.findOne({ where: { id: item.statusId } });

          table.push([
            item.id,
            item.type,
            item.title.substring(0, 37) + (item.title.length > 37 ? '...' : ''),
            status?.name || 'Unknown',
            tags || '-'
          ]);
        }

        console.log(chalk.cyan(`\nFound ${items.length} item(s) to export:\n`));
        console.log(table.toString());

        // Show export directory
        const exportDir = process.env.SHIROKUMA_EXPORT_DIR || 'docs/export';
        console.log(chalk.gray(`\nWould export to: ${exportDir}`));

        await AppDataSource.destroy();
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        await AppDataSource.destroy();
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
        // Initialize data source
        if (!AppDataSource.isInitialized) {
          await AppDataSource.initialize();
        }

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
              const filename = file.split('/').slice(1).join('/');
              console.log(`    ${filename}`);
            }
          }
        }

        await AppDataSource.destroy();
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        await AppDataSource.destroy();
        process.exit(1);
      }
    });

  return exportCmd;
}