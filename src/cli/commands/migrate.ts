import chalk from 'chalk';
import { AppDataSource } from '../../data-source.js';
import { Status } from '../../entities/Status.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function runMigration(options: { reset?: boolean; seed?: boolean }) {
  try {
    const dbPath = AppDataSource.options.database as string;
    console.log(chalk.bold.cyan('🔄 Database Migration (TypeORM)\n'));
    console.log(chalk.gray(`Database: ${dbPath}`));

    if (options.reset) {
      console.log(chalk.yellow('\n⚠️  WARNING: This will delete all data!'));
      console.log(chalk.yellow('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n'));
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (fs.existsSync(dbPath)) {
        console.log(chalk.gray('Backing up database...'));
        const backupPath = `${dbPath}.backup.${Date.now()}`;
        fs.copyFileSync(dbPath, backupPath);
        console.log(chalk.gray(`Backup created: ${backupPath}`));

        console.log(chalk.gray('Removing old database...'));
        fs.unlinkSync(dbPath);
      }
    }

    // Initialize data source
    console.log(chalk.gray('\nInitializing TypeORM...'));
    await AppDataSource.initialize();

    // Run migrations
    console.log(chalk.gray('Running migrations...'));
    await AppDataSource.runMigrations();

    // Seed if requested or if this is a new database
    if (options.seed || options.reset) {
      console.log(chalk.gray('\nSeeding database...'));
      await seedDatabase();
    }

    console.log(chalk.green('\n✅ Migration completed successfully!'));
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error(chalk.red('\n❌ Migration failed:'));
    console.error(error);
    process.exit(1);
  }
}

async function seedDatabase() {
  const itemRepo = AppDataSource.getRepository('Item');
  const stateRepo = AppDataSource.getRepository('SystemState');
  const statusRepo = AppDataSource.getRepository('Status');

  // Check if data already exists
  const itemCount = await itemRepo.count();
  if (itemCount > 0) {
    console.log(chalk.yellow('Database already contains data, skipping seed'));
    return;
  }

  // Create default statuses first
  const defaultStatuses = [
    { name: 'Open', isClosable: false, sortOrder: 0 },
    { name: 'Specification', isClosable: false, sortOrder: 1 },
    { name: 'Waiting', isClosable: false, sortOrder: 2 },
    { name: 'Ready', isClosable: false, sortOrder: 3 },
    { name: 'In Progress', isClosable: false, sortOrder: 4 },
    { name: 'Review', isClosable: false, sortOrder: 5 },
    { name: 'Testing', isClosable: false, sortOrder: 6 },
    { name: 'Pending', isClosable: false, sortOrder: 7 },
    { name: 'Completed', isClosable: true, sortOrder: 8 },
    { name: 'Closed', isClosable: true, sortOrder: 9 },
    { name: 'Canceled', isClosable: true, sortOrder: 10 },
    { name: 'Rejected', isClosable: true, sortOrder: 11 },
  ];

  const statusMap = new Map<string, number>();
  for (const statusData of defaultStatuses) {
    const status = await statusRepo.save(statusData);
    statusMap.set(status.name, status.id);
  }

  // Create initial items
  const items = [
    {
      type: 'knowledge',
      title: 'SHIROKUMA Knowledge Base System',
      description: 'Core system documentation',
      content: 'SHIROKUMA is a knowledge management system built on MCP protocol.',
      statusId: statusMap.get('Completed')!,
      priority: 'HIGH'
    },
    {
      type: 'issue',
      title: 'Initial Setup',
      description: 'Complete initial system setup',
      content: 'Initial system setup has been completed successfully.',
      statusId: statusMap.get('Completed')!,
      priority: 'CRITICAL'
    }
  ];

  for (const item of items) {
    await itemRepo.save(item);
  }

  // Create initial system state
  await stateRepo.save({
    version: 'v0.9.0',  // User's system version
    content: 'System initialized with TypeORM',
    tags: JSON.stringify(['system', 'init']),
    metadata: JSON.stringify({ migrationVersion: '0.9.0' })
  });

  console.log(chalk.green(`✅ Seeded ${defaultStatuses.length} statuses, ${items.length} items and system state`));
}