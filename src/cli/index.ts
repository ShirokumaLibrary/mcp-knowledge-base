#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
// import { z } from 'zod'; // Not used
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { validateType } from '../utils/validation.js';
import { createConfigCommand } from './commands/config.js';
import { createExportCommand } from './commands/export.js';
import { createImportCommand } from './commands/import.js';
import { ConfigManager } from '../services/config-manager.js';

// Parse --env option early to load the correct environment file
function parseEnvOption(): string | undefined {
  const envArgIndex = process.argv.indexOf('--env');
  if (envArgIndex !== -1 && process.argv[envArgIndex + 1]) {
    return process.argv[envArgIndex + 1];
  }
  return undefined;
}

// Initialize ConfigManager and load environment file
const configManager = new ConfigManager();
const envName = parseEnvOption();
await configManager.loadEnvFile(envName);

// Auto-configure SHIROKUMA_DATABASE_URL from SHIROKUMA_DATA_DIR if needed
if (!process.env.SHIROKUMA_DATABASE_URL) {
  const config = configManager.getConfig();
  process.env.SHIROKUMA_DATABASE_URL = config.SHIROKUMA_DATABASE_URL;
}

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Check for DATABASE_URL for non-migrate commands
function checkDatabaseUrl(command: string) {
  // migrate command handles DATABASE_URL internally
  if (command === 'migrate') {
    return;
  }

  // SHIROKUMA_DATABASE_URL is already set at the top of the file
  // This function now just logs the configuration
  const defaultDataDir = path.join(os.homedir(), '.shirokuma', 'data');
  const dataDir = process.env.SHIROKUMA_DATA_DIR || defaultDataDir;
  console.log(chalk.gray(`📁 Using database from ${dataDir}: ${process.env.SHIROKUMA_DATABASE_URL}`));
}

const prisma = new PrismaClient();
const program = new Command();

program
  .name('shirokuma')
  .description('Shirokuma MCP Knowledge Base CLI')
  .version('0.8.3')
  .option('--env <name>', 'Environment name (e.g., dev, test, prod) to load .env.<name> file');

// Helper functions
async function getStatusId(statusName: string): Promise<number> {
  // Try exact match first
  let status = await prisma.status.findUnique({
    where: { name: statusName }
  });

  // If not found, try case-insensitive match
  if (!status) {
    const allStatuses = await prisma.status.findMany();
    status = allStatuses.find(s =>
      s.name.toLowerCase() === statusName.toLowerCase()
    ) || null;
  }

  if (!status) {
    throw new Error(`Status '${statusName}' not found`);
  }
  return status.id;
}

async function ensureTags(tagNames: string[]): Promise<{ id: number; name: string }[]> {
  const tags = [];
  for (const name of tagNames) {
    let tag = await prisma.tag.findUnique({ where: { name } });
    if (!tag) {
      tag = await prisma.tag.create({ data: { name } });
    }
    tags.push(tag);
  }
  return tags;
}

function formatDate(date: Date | null): string {
  if (!date) {
    return '';
  }
  return date.toISOString().split('T')[0];
}

interface ItemWithRelations {
  id: number;
  type: string;
  title: string;
  description: string;
  content: string;
  category: string | null;
  startDate: Date | null;
  endDate: Date | null;
  priority: string;
  status: { name: string };
  tags: Array<{ tag: { name: string } }>;
  createdAt: Date;
  updatedAt: Date;
}

function printItem(item: ItemWithRelations) {
  console.log(chalk.bold.cyan(`\n[${item.id}] ${item.title}`));
  console.log(chalk.gray(`Type: ${item.type} | Status: ${item.status.name} | Priority: ${item.priority}`));

  if (item.description) {
    console.log(chalk.white(`\nDescription: ${item.description}`));
  }

  if (item.category) {
    console.log(chalk.gray(`Category: ${item.category}`));
  }

  if (item.startDate || item.endDate) {
    console.log(chalk.gray(`Period: ${formatDate(item.startDate)} - ${formatDate(item.endDate)}`));
  }

  if (item.tags && item.tags.length > 0) {
    const tagNames = item.tags.map((t) => t.tag.name).join(', ');
    console.log(chalk.magenta(`Tags: ${tagNames}`));
  }

  // Note: Related items are now managed through ItemRelation table

  if (item.content) {
    console.log(chalk.white(`\n${item.content}`));
  }

  console.log(chalk.gray(`\nCreated: ${item.createdAt.toISOString()} | Updated: ${item.updatedAt.toISOString()}`));
}

// Create command
program
  .command('create')
  .description('Create a new item')
  .requiredOption('-t, --type <type>', 'Item type (lowercase, numbers, underscores only)')
  .requiredOption('-T, --title <title>', 'Item title')
  .option('-d, --description <description>', 'Item description')
  .option('-c, --content <content>', 'Item content')
  .option('-s, --status <status>', 'Item status', 'Open')
  .option('-p, --priority <priority>', 'Item priority (CRITICAL|HIGH|MEDIUM|LOW|MINIMAL)', 'MEDIUM')
  .option('-C, --category <category>', 'Item category')
  .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
  .option('--end-date <date>', 'End date (YYYY-MM-DD)')
  .option('-v, --version <version>', 'Version')
  .option('-r, --related <ids>', 'Related item IDs (comma-separated)')
  .option('--tags <tags>', 'Tags (comma-separated)')
  .action(async (options) => {
    checkDatabaseUrl('create');
    try {
      // Validate type format
      const validatedType = validateType(options.type, true); // Auto-normalize for CLI

      const statusId = await getStatusId(options.status);
      const tags = options.tags ? await ensureTags(options.tags.split(',').map((t: string) => t.trim())) : [];
      const item = await prisma.item.create({
        data: {
          type: validatedType,
          title: options.title,
          description: options.description || '',
          content: options.content || '',
          statusId,
          priority: options.priority,
          category: options.category || null,
          startDate: options.startDate ? new Date(options.startDate) : null,
          endDate: options.endDate ? new Date(options.endDate) : null,
          version: options.version || null,
          tags: {
            create: tags.map((tag) => ({ tagId: tag.id }))
          }
        },
        include: {
          status: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      console.log(chalk.green(`✓ Item created with ID: ${item.id}`));
      printItem(item);
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Get command
program
  .command('get <id>')
  .description('Get an item by ID')
  .action(async (id) => {
    checkDatabaseUrl('get');
    try {
      const item = await prisma.item.findUnique({
        where: { id: parseInt(id) },
        include: {
          status: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      if (!item) {
        console.error(chalk.red(`Item with ID ${id} not found`));
        process.exit(1);
      }

      printItem(item);
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List items')
  .option('-t, --type <type>', 'Filter by type')
  .option('-s, --status <status>', 'Filter by status')
  .option('-p, --priority <priority>', 'Filter by priority')
  .option('-C, --category <category>', 'Filter by category')
  .option('--tags <tags>', 'Filter by tags (comma-separated)')
  .option('-l, --limit <limit>', 'Limit results', '20')
  .option('-o, --offset <offset>', 'Offset results', '0')
  .option('--sort <field>', 'Sort by field (created|updated|priority)', 'updated')
  .option('--order <order>', 'Sort order (asc|desc)', 'desc')
  .action(async (options) => {
    try {
      const where: Record<string, unknown> = {};

      if (options.type) {
        where.type = options.type;
      }
      if (options.status) {
        const statusId = await getStatusId(options.status);
        where.statusId = statusId;
      }
      if (options.priority) {
        where.priority = options.priority;
      }
      if (options.category) {
        where.category = options.category;
      }
      if (options.tags) {
        const tagNames = options.tags.split(',').map((t: string) => t.trim());
        where.tags = {
          some: {
            tag: {
              name: { in: tagNames }
            }
          }
        };
      }

      const orderBy: Record<string, string> = {};
      if (options.sort === 'created') {
        orderBy.createdAt = options.order;
      } else if (options.sort === 'updated') {
        orderBy.updatedAt = options.order;
      } else if (options.sort === 'priority') {
        orderBy.priority = options.order;
      }

      const items = await prisma.item.findMany({
        where,
        include: {
          status: true,
          tags: {
            include: {
              tag: true
            }
          }
        },
        take: parseInt(options.limit),
        skip: parseInt(options.offset),
        orderBy
      });

      if (items.length === 0) {
        console.log(chalk.yellow('No items found'));
        return;
      }

      const table = new Table({
        head: ['ID', 'Type', 'Title', 'Status', 'Priority', 'Tags', 'Updated'],
        colWidths: [6, 12, 30, 12, 10, 20, 20]
      });

      for (const item of items) {
        const tags = item.tags.map((t) => t.tag.name).join(', ');
        table.push([
          item.id,
          item.type,
          item.title.substring(0, 28),
          item.status.name,
          item.priority,
          tags.substring(0, 18),
          item.updatedAt.toISOString().split('T')[0]
        ]);
      }

      console.log(table.toString());
      console.log(chalk.gray(`\nShowing ${items.length} items`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Update command
program
  .command('update <id>')
  .description('Update an item')
  .option('-T, --title <title>', 'Item title')
  .option('-d, --description <description>', 'Item description')
  .option('-c, --content <content>', 'Item content')
  .option('-s, --status <status>', 'Item status')
  .option('-p, --priority <priority>', 'Item priority')
  .option('-C, --category <category>', 'Item category')
  .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
  .option('--end-date <date>', 'End date (YYYY-MM-DD)')
  .option('-v, --version <version>', 'Version')
  .option('-r, --related <ids>', 'Related item IDs (comma-separated)')
  .option('--tags <tags>', 'Tags (comma-separated)')
  .action(async (id, options) => {
    try {
      const itemId = parseInt(id);
      const existingItem = await prisma.item.findUnique({
        where: { id: itemId }
      });

      if (!existingItem) {
        console.error(chalk.red(`Item with ID ${id} not found`));
        process.exit(1);
      }

      const updateData: Record<string, unknown> = {};
      if (options.title !== undefined) {
        updateData.title = options.title;
      }
      if (options.description !== undefined) {
        updateData.description = options.description;
      }
      if (options.content !== undefined) {
        updateData.content = options.content;
      }
      if (options.status !== undefined) {
        updateData.statusId = await getStatusId(options.status);
      }
      if (options.priority !== undefined) {
        updateData.priority = options.priority;
      }
      if (options.category !== undefined) {
        updateData.category = options.category;
      }
      if (options.startDate !== undefined) {
        updateData.startDate = new Date(options.startDate);
      }
      if (options.endDate !== undefined) {
        updateData.endDate = new Date(options.endDate);
      }
      if (options.version !== undefined) {
        updateData.version = options.version;
      }
      if (options.related !== undefined) {
        const related = options.related.split(',').map((rid: string) => parseInt(rid.trim()));
        updateData.related = JSON.stringify(related);
      }

      if (options.tags !== undefined) {
        await prisma.itemTag.deleteMany({
          where: { itemId }
        });
        const tags = await ensureTags(options.tags.split(',').map((t: string) => t.trim()));
        updateData.tags = {
          create: tags.map((tag) => ({ tagId: tag.id }))
        };
      }

      const item = await prisma.item.update({
        where: { id: itemId },
        data: updateData,
        include: {
          status: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      console.log(chalk.green(`✓ Item ${itemId} updated successfully`));
      printItem(item);
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Delete command
program
  .command('delete <id>')
  .description('Delete an item')
  .option('-f, --force', 'Skip confirmation')
  .action(async (id, options) => {
    checkDatabaseUrl('delete');
    try {
      const itemId = parseInt(id);

      if (!options.force) {
        const item = await prisma.item.findUnique({
          where: { id: itemId }
        });

        if (!item) {
          console.error(chalk.red(`Item with ID ${id} not found`));
          process.exit(1);
        }

        console.log(chalk.yellow(`Are you sure you want to delete item ${itemId}: "${item.title}"?`));
        console.log(chalk.gray('Use --force to skip this confirmation'));
        process.exit(0);
      }

      await prisma.item.delete({
        where: { id: itemId }
      });

      console.log(chalk.green(`✓ Item ${itemId} deleted successfully`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Search command
program
  .command('search <query>')
  .description('Search items')
  .option('-t, --type <type>', 'Filter by type')
  .option('-l, --limit <limit>', 'Limit results', '20')
  .action(async (query, options) => {
    try {
      const where: Record<string, unknown> = {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { content: { contains: query } }
        ]
      };

      if (options.type) {
        where.type = options.type;
      }

      const items = await prisma.item.findMany({
        where,
        include: {
          status: true,
          tags: {
            include: {
              tag: true
            }
          }
        },
        take: parseInt(options.limit),
        orderBy: { updatedAt: 'desc' }
      });

      if (items.length === 0) {
        console.log(chalk.yellow('No items found'));
        return;
      }

      const table = new Table({
        head: ['ID', 'Type', 'Title', 'Status', 'Priority', 'Match'],
        colWidths: [6, 12, 30, 12, 10, 30]
      });

      for (const item of items) {
        let match = '';
        if (item.title.toLowerCase().includes(query.toLowerCase())) {
          match = 'Title';
        } else if (item.description.toLowerCase().includes(query.toLowerCase())) {
          match = 'Description';
        } else {
          match = 'Content';
        }

        table.push([
          item.id,
          item.type,
          item.title.substring(0, 28),
          item.status.name,
          item.priority,
          match
        ]);
      }

      console.log(table.toString());
      console.log(chalk.gray(`\nFound ${items.length} items matching "${query}"`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show statistics')
  .action(async () => {
    try {
      const [totalItems, itemsByType, itemsByStatus, itemsByPriority, tagStats] = await Promise.all([
        prisma.item.count(),
        prisma.item.groupBy({
          by: ['type'],
          _count: true
        }),
        prisma.item.groupBy({
          by: ['statusId'],
          _count: true
        }),
        prisma.item.groupBy({
          by: ['priority'],
          _count: true
        }),
        prisma.itemTag.groupBy({
          by: ['tagId'],
          _count: true,
          orderBy: {
            _count: {
              tagId: 'desc'
            }
          },
          take: 10
        })
      ]);

      const statuses = await prisma.status.findMany();
      const statusMap = new Map(statuses.map((s) => [s.id, s.name]));

      const tags = await prisma.tag.findMany({
        where: {
          id: {
            in: tagStats.map((s) => s.tagId)
          }
        }
      });
      const tagMap = new Map(tags.map((t) => [t.id, t.name]));

      console.log(chalk.bold.cyan('\n📊 System Statistics\n'));
      console.log(chalk.white(`Total Items: ${totalItems}`));

      if (itemsByType.length > 0) {
        console.log(chalk.bold('\nItems by Type:'));
        const typeTable = new Table({
          head: ['Type', 'Count'],
          colWidths: [20, 10]
        });
        for (const t of itemsByType) {
          typeTable.push([t.type, t._count]);
        }
        console.log(typeTable.toString());
      }

      if (itemsByStatus.length > 0) {
        console.log(chalk.bold('\nItems by Status:'));
        const statusTable = new Table({
          head: ['Status', 'Count'],
          colWidths: [20, 10]
        });
        for (const s of itemsByStatus) {
          statusTable.push([statusMap.get(s.statusId) || 'Unknown', s._count]);
        }
        console.log(statusTable.toString());
      }

      if (itemsByPriority.length > 0) {
        console.log(chalk.bold('\nItems by Priority:'));
        const priorityTable = new Table({
          head: ['Priority', 'Count'],
          colWidths: [20, 10]
        });
        for (const p of itemsByPriority) {
          priorityTable.push([p.priority, p._count]);
        }
        console.log(priorityTable.toString());
      }

      if (tagStats.length > 0) {
        console.log(chalk.bold('\nTop 10 Tags:'));
        const tagTable = new Table({
          head: ['Tag', 'Count'],
          colWidths: [20, 10]
        });
        for (const t of tagStats) {
          tagTable.push([tagMap.get(t.tagId) || 'Unknown', t._count]);
        }
        console.log(tagTable.toString());
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Serve command
program
  .command('serve')
  .description('Start MCP server')
  .action(async () => {
    console.log(chalk.cyan('Starting MCP server...'));
    console.log(chalk.gray('Use Ctrl+C to stop'));

    // Import and start the MCP server
    try {
      // Try relative import first (for development)
      const { startServer } = await import('../mcp/server.js');
      await startServer();
    } catch (e1) {
      try {
        // Try absolute path for global installation
        const path = await import('path');
        const __dirname = path.dirname(new globalThis.URL(import.meta.url).pathname);
        const serverPath = path.resolve(__dirname, '../mcp/server.js');
        const { startServer } = await import(serverPath);
        await startServer();
      } catch (e2) {
        console.error(chalk.red('Failed to start MCP server:'));
        console.error(chalk.red(`  Development import error: ${(e1 as Error).message}`));
        console.error(chalk.red(`  Global import error: ${(e2 as Error).message}`));
        console.error(chalk.gray('Make sure the server module is properly built and accessible.'));
        process.exit(1);
      }
    }
  });

// Setup command
program
  .command('setup')
  .description('Run post-install setup (migrations, database initialization)')
  .action(async () => {
    console.log(chalk.cyan('Running Shirokuma setup...'));

    try {
      // Import and run setup
      const { performPostInstallSetup } = await import('../../scripts/postinstall-setup.js');
      await performPostInstallSetup();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Setup failed:'), errorMessage);
      console.log(chalk.gray('\nYou can try manual setup with:'));
      console.log(chalk.gray('  shirokuma-kb migrate deploy'));
      process.exit(1);
    }
  });

// Tags command
program
  .command('tags')
  .description('List all tags')
  .action(async () => {
    try {
      const tags = await prisma.tag.findMany({
        include: {
          _count: {
            select: { items: true }
          }
        },
        orderBy: {
          items: {
            _count: 'desc'
          }
        }
      });

      if (tags.length === 0) {
        console.log(chalk.yellow('No tags found'));
        return;
      }

      const table = new Table({
        head: ['Tag', 'Usage Count'],
        colWidths: [30, 15]
      });

      for (const tag of tags) {
        table.push([tag.name, tag._count.items]);
      }

      console.log(table.toString());
      console.log(chalk.gray(`\nTotal tags: ${tags.length}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Related command
program
  .command('related <id>')
  .description('Show related items')
  .option('-d, --depth <depth>', 'Traversal depth', '1')
  .action(async (id, options) => {
    try {
      const itemId = parseInt(id);
      const depth = parseInt(options.depth);

      const visited = new Set<number>();
      const queue: { id: number; distance: number }[] = [{ id: itemId, distance: 0 }];
      interface ItemWithDistance extends ItemWithRelations {
        distance: number;
      }
      const results: ItemWithDistance[] = [];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.distance > depth) {
          break;
        }

        if (!visited.has(current.id)) {
          visited.add(current.id);
          const item = await prisma.item.findUnique({
            where: { id: current.id },
            include: {
              status: true,
              tags: {
                include: {
                  tag: true
                }
              }
            }
          });

          if (item) {
            results.push({
              ...item,
              distance: current.distance
            });

            // Note: Related items are now managed through ItemRelation table
            // This traversal should use the new relation system
          }
        }
      }

      if (results.length === 0) {
        console.log(chalk.yellow('No related items found'));
        return;
      }

      console.log(chalk.bold.cyan(`\n📊 Related Items (depth: ${depth})\n`));

      for (const item of results) {
        const indent = '  '.repeat(item.distance);
        const prefix = item.distance === 0 ? '🎯' : '└─';
        console.log(chalk.cyan(`${indent}${prefix} [${item.id}] ${item.title}`));
        console.log(chalk.gray(`${indent}   Type: ${item.type} | Status: ${item.status.name} | Distance: ${item.distance}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Migrate command
program
  .command('migrate')
  .description('Run database migrations')
  .option('--reset', 'Reset database before migration (WARNING: destroys all data)')
  .option('--seed', 'Seed database after migration')
  .action(async (options) => {
    try {
      // Use SHIROKUMA_DATA_DIR or default to ~/.shirokuma/data
      const projectRoot = path.resolve(__dirname, '../../..');
      const defaultDataDir = path.join(os.homedir(), '.shirokuma', 'data');
      const dataDir = process.env.SHIROKUMA_DATA_DIR || defaultDataDir;
      const resolvedDir = dataDir.replace(/^~/, os.homedir());
      const dbPath = `file:${resolvedDir}/shirokuma.db`;

      console.log(chalk.bold.cyan('🔄 Database Migration\n'));
      console.log(chalk.gray(`Database: ${dbPath}`));

      if (options.reset) {
        console.log(chalk.yellow('\n⚠️  WARNING: This will delete all data!'));
        console.log(chalk.yellow('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n'));
        await new Promise(resolve => globalThis.setTimeout(resolve, 3000));

        // Extract file path from DATABASE_URL
        const dbFile = dbPath.replace('file:', '').replace('///', '/');
        if (fs.existsSync(dbFile)) {
          console.log(chalk.gray('Backing up database...'));
          execSync(`cp "${dbFile}" "${dbFile}.backup.${Date.now()}"`, { stdio: 'inherit' });

          console.log(chalk.gray('Removing old database...'));
          fs.unlinkSync(dbFile);
        }
      }

      // Run migrations
      console.log(chalk.gray('\nRunning migrations...'));
      execSync(`SHIROKUMA_DATABASE_URL="${dbPath}" npx prisma migrate deploy`, {
        stdio: 'inherit',
        cwd: projectRoot
      });

      // Check if statuses exist
      const prismaForCheck = new PrismaClient({
        datasources: { db: { url: dbPath } }
      });
      let statusCount = 0;
      try {
        statusCount = await prismaForCheck.status.count();
      } catch {
        // Table might not exist yet
      } finally {
        await prismaForCheck.$disconnect();
      }

      // Seed if requested, reset, or no statuses exist
      if (options.seed || options.reset || statusCount === 0) {
        console.log(chalk.gray('\nSeeding database...'));
        if (statusCount === 0 && !options.seed && !options.reset) {
          console.log(chalk.yellow('No statuses found. Initializing default statuses...'));
        }
        execSync(`SHIROKUMA_DATABASE_URL="${dbPath}" npx prisma db seed`, {
          stdio: 'inherit',
          cwd: projectRoot
        });
      }

      console.log(chalk.green('\n✅ Migration completed successfully!'));
      console.log(chalk.yellow('\n📝 Note: Restart the MCP server to use the updated database schema.'));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`\n❌ Migration failed: ${errorMessage}`));
      process.exit(1);
    }
  });

// Add config command
program.addCommand(createConfigCommand());

// Add export command
program.addCommand(createExportCommand());
program.addCommand(createImportCommand());

program.parse(process.argv);