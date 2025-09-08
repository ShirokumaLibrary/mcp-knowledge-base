#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { AppDataSource } from '../data-source.js';
import { ItemRepository } from '../repositories/ItemRepository.js';
import { SystemStateRepository } from '../repositories/SystemStateRepository.js';
import { runMigration } from './commands/migrate.js';
import { createExportCommand } from './commands/export.js';
import { importData } from './commands/import.js';
import { createConfigCommand } from './commands/config.js';
import { Item } from '../entities/Item.js';
import { Status } from '../entities/Status.js';
import { Tag } from '../entities/Tag.js';
import { ItemTag } from '../entities/ItemTag.js';
import { ItemRelation } from '../entities/ItemRelation.js';

const program = new Command();

program
  .name('shirokuma-kb')
  .description('Shirokuma Knowledge Base CLI (TypeORM)')
  .version('0.9.0');

// Helper to ensure database is initialized
async function ensureDb() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}

// Create command
program
  .command('create')
  .description('Create a new item')
  .requiredOption('-t, --type <type>', 'Item type')
  .requiredOption('-T, --title <title>', 'Item title')
  .option('-d, --description <description>', 'Item description')
  .option('-c, --content <content>', 'Item content')
  .option('-s, --status <status>', 'Status', 'Open')
  .option('-p, --priority <priority>', 'Priority', 'MEDIUM')
  .option('--tags <tags>', 'Comma-separated tags')
  .action(async (options) => {
    try {
      await ensureDb();
      
      // Get or create status
      const statusRepo = AppDataSource.getRepository(Status);
      let status = await statusRepo.findOne({ where: { name: options.status } });
      if (!status) {
        status = await statusRepo.save({
          name: options.status,
          isClosable: false,
          sortOrder: 0
        });
      }

      // Create item
      const itemRepo = new ItemRepository();
      const item = await itemRepo.create({
        type: options.type,
        title: options.title,
        description: options.description || '',
        content: options.content || '',
        statusId: status.id,
        priority: options.priority
      });

      // Handle tags
      if (options.tags) {
        const tagRepo = AppDataSource.getRepository(Tag);
        const itemTagRepo = AppDataSource.getRepository(ItemTag);
        const tagNames = options.tags.split(',').map((t: string) => t.trim());
        
        for (const tagName of tagNames) {
          let tag = await tagRepo.findOne({ where: { name: tagName } });
          if (!tag) {
            tag = await tagRepo.save({ name: tagName });
          }
          await itemTagRepo.save({ itemId: item.id, tagId: tag.id });
        }
      }

      console.log(chalk.green(`✅ Created item #${item.id}: ${item.title}`));
      await AppDataSource.destroy();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List items')
  .option('-t, --type <type>', 'Filter by type')
  .option('-s, --status <status>', 'Filter by status')
  .option('-l, --limit <limit>', 'Limit results', '20')
  .action(async (options) => {
    try {
      await ensureDb();
      
      const itemRepo = new ItemRepository();
      const items = await itemRepo.findAll({
        type: options.type,
        status: options.status,
        limit: parseInt(options.limit)
      });

      if (items.length === 0) {
        console.log(chalk.yellow('No items found'));
      } else {
        const table = new Table({
          head: ['ID', 'Type', 'Title', 'Status', 'Priority'],
          colWidths: [8, 15, 40, 15, 10]
        });

        for (const item of items) {
          // Get status name
          const statusRepo = AppDataSource.getRepository(Status);
          const status = await statusRepo.findOne({ where: { id: item.statusId } });
          
          table.push([
            item.id,
            item.type,
            item.title.substring(0, 38),
            status?.name || 'Unknown',
            item.priority
          ]);
        }

        console.log(table.toString());
        console.log(chalk.gray(`\nTotal: ${items.length} items`));
      }

      await AppDataSource.destroy();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Get command
program
  .command('get <id>')
  .description('Get an item by ID')
  .action(async (id) => {
    try {
      await ensureDb();
      
      const itemRepo = new ItemRepository();
      const item = await itemRepo.findById(parseInt(id));
      
      if (!item) {
        console.log(chalk.yellow(`Item #${id} not found`));
      } else {
        // Get status
        const statusRepo = AppDataSource.getRepository(Status);
        const status = await statusRepo.findOne({ where: { id: item.statusId } });
        
        // Get tags
        const itemTagRepo = AppDataSource.getRepository(ItemTag);
        const tagRepo = AppDataSource.getRepository(Tag);
        const itemTags = await itemTagRepo.find({ where: { itemId: item.id } });
        const tags = [];
        for (const it of itemTags) {
          const tag = await tagRepo.findOne({ where: { id: it.tagId } });
          if (tag) tags.push(tag.name);
        }

        console.log(chalk.bold.cyan(`\n📄 Item #${item.id}\n`));
        console.log(chalk.bold('Title:'), item.title);
        console.log(chalk.bold('Type:'), item.type);
        console.log(chalk.bold('Status:'), status?.name || 'Unknown');
        console.log(chalk.bold('Priority:'), item.priority);
        
        if (tags.length > 0) {
          console.log(chalk.bold('Tags:'), tags.join(', '));
        }
        
        if (item.description) {
          console.log(chalk.bold('\nDescription:'));
          console.log(item.description);
        }
        
        if (item.content) {
          console.log(chalk.bold('\nContent:'));
          console.log(item.content);
        }
        
        console.log(chalk.gray(`\nCreated: ${item.createdAt}`));
        console.log(chalk.gray(`Updated: ${item.updatedAt}`));
      }

      await AppDataSource.destroy();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Search command
program
  .command('search <query>')
  .description('Search items')
  .action(async (query) => {
    try {
      await ensureDb();
      
      const itemRepo = new ItemRepository();
      const items = await itemRepo.search(query);

      if (items.length === 0) {
        console.log(chalk.yellow('No items found'));
      } else {
        console.log(chalk.bold.cyan(`\n🔍 Search Results (${items.length} items)\n`));
        
        for (const item of items) {
          console.log(chalk.cyan(`[${item.id}]`), chalk.bold(item.title));
          console.log(chalk.gray(`  Type: ${item.type} | Priority: ${item.priority}`));
          
          if (item.description) {
            const preview = item.description.substring(0, 80);
            console.log(chalk.gray(`  ${preview}${item.description.length > 80 ? '...' : ''}`));
          }
          console.log();
        }
      }

      await AppDataSource.destroy();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Migrate command
program
  .command('migrate')
  .description('Run database migrations')
  .option('--reset', 'Reset database before migration')
  .option('--seed', 'Seed database after migration')
  .action(async (options) => {
    await runMigration(options);
  });

// Export command
program.addCommand(createExportCommand());

// Config command
program.addCommand(createConfigCommand());

// Import command
program
  .command('import <file>')
  .description('Import data from JSON file')
  .option('--clear', 'Clear existing data before import')
  .action(async (file, options) => {
    await importData({ file, ...options });
  });

// Serve command
program
  .command('serve')
  .description('Start MCP server')
  .action(async () => {
    console.log(chalk.cyan('Starting MCP server (TypeORM)...'));
    console.log(chalk.gray('Use Ctrl+C to stop'));
    
    const { startServer } = await import('../mcp/server.js');
    await startServer();
  });

// Stats command
program
  .command('stats')
  .description('Show database statistics')
  .action(async () => {
    try {
      await ensureDb();
      
      const itemRepo = new ItemRepository();
      const statusRepo = AppDataSource.getRepository(Status);
      const tagRepo = AppDataSource.getRepository(Tag);
      
      const itemCount = await itemRepo.count();
      const statusCount = await statusRepo.count();
      const tagCount = await tagRepo.count();

      console.log(chalk.bold.cyan('\n📊 Database Statistics\n'));
      
      const table = new Table({
        head: ['Entity', 'Count'],
        colWidths: [20, 10]
      });

      table.push(
        ['Items', itemCount],
        ['Statuses', statusCount],
        ['Tags', tagCount]
      );

      console.log(table.toString());
      
      // Get items by type
      const items = await AppDataSource.getRepository(Item).find();
      const typeGroups = new Map<string, number>();
      for (const item of items) {
        typeGroups.set(item.type, (typeGroups.get(item.type) || 0) + 1);
      }

      if (typeGroups.size > 0) {
        console.log(chalk.bold('\nItems by Type:'));
        const typeTable = new Table({
          head: ['Type', 'Count'],
          colWidths: [20, 10]
        });
        
        for (const [type, count] of typeGroups) {
          typeTable.push([type, count]);
        }
        console.log(typeTable.toString());
      }

      await AppDataSource.destroy();
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse();