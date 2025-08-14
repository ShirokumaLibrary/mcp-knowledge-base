import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '../../utils/logger.js';

const execAsync = promisify((await import('child_process')).exec);

// Setup migration environment based on SHIROKUMA_DATABASE_URL
export function setupMigrationEnvironment(): string {
  const defaultDataDir = path.join(os.homedir(), '.shirokuma', 'data');
  const dbPath = process.env.SHIROKUMA_DATABASE_URL || `file:${defaultDataDir}/shirokuma.db`;

  // Handle both file: and file:// and file:/// formats
  let actualPath = dbPath;
  if (dbPath.startsWith('file://')) {
    actualPath = dbPath.replace('file://', '');
  } else if (dbPath.startsWith('file:')) {
    actualPath = dbPath.replace('file:', '');
  }

  const dbDir = path.dirname(actualPath);
  const migrationsDir = path.join(dbDir, 'migrations');

  // Ensure directories exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    logger.info(`Created database directory: ${dbDir}`);
  }

  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    logger.info(`Created migrations directory: ${migrationsDir}`);
  }

  // Note: PRISMA_MIGRATION_PATH will be set per command execution, not globally

  return migrationsDir;
}

// Check and apply pending migrations
export async function checkAndApplyMigrations(): Promise<void> {
  try {
    const migrationsDir = setupMigrationEnvironment();

    // Check if migrations exist
    if (!fs.existsSync(migrationsDir) || fs.readdirSync(migrationsDir).length === 0) {
      logger.info('📝 No migrations found, database is up to date');
      return;
    }

    const defaultDataDir = path.join(os.homedir(), '.shirokuma', 'data');
    const dbPath = process.env.SHIROKUMA_DATABASE_URL || `file:${defaultDataDir}/shirokuma.db`;

    const enhancedEnv = {
      ...process.env,
      SHIROKUMA_DATABASE_URL: dbPath,
      PRISMA_MIGRATION_PATH: migrationsDir
    };

    logger.info('🔍 Checking for pending migrations...');

    // Use migrate deploy to apply any pending migrations
    await execAsync('npx prisma migrate deploy', {
      env: enhancedEnv,
      cwd: process.cwd()
    });

    logger.success('All migrations are up to date');

  } catch (error) {
    console.warn('⚠️  Migration check failed:', (error as Error).message);
    logger.info('🔧 Database will continue to function with current schema');
  }
}

// Auto-seed if needed
export async function autoSeedIfNeeded(prisma: InstanceType<typeof PrismaClient>): Promise<void> {
  try {
    // Check if statuses exist
    const statusCount = await prisma.status.count();
    if (statusCount === 0) {
      logger.warn('No statuses found in database.');
      logger.info('🌱 Auto-seeding default statuses...');

      // Import and run seed function
      const { main: seedMain } = await import('../../../prisma/seed.js');
      await seedMain();

      logger.success('Default statuses created successfully');
    } else if (statusCount < 12) {
      logger.warn(`Only ${statusCount} statuses found (expected 12).`);
      logger.info('📝 Run "npx tsx prisma/seed.ts" to add missing statuses.');
    }
  } catch (error) {
    logger.error('Error during auto-seed', error);
    logger.info('📝 You can manually run "shirokuma-kb migrate --seed" to initialize statuses.');
  }
}

// Initialize database and apply migrations automatically
export async function initializeDatabase(prisma: InstanceType<typeof PrismaClient>): Promise<void> {
  try {
    // Check if tables exist by attempting a simple query
    await prisma.status.findFirst();
    logger.success('Database connection verified');

    // Even if database exists, check for pending migrations
    await checkAndApplyMigrations();

    // Also check if seed data is needed
    await autoSeedIfNeeded(prisma);

  } catch {
    logger.info('🔧 Database not initialized. Setting up...');

    try {
      // Setup migration environment
      const migrationsDir = setupMigrationEnvironment();

      const defaultDataDir = path.join(os.homedir(), '.shirokuma', 'data');
      const dbPath = process.env.SHIROKUMA_DATABASE_URL || `file:${defaultDataDir}/shirokuma.db`;

      // Enhanced environment with migration path
      const enhancedEnv = {
        ...process.env,
        SHIROKUMA_DATABASE_URL: dbPath,
        PRISMA_MIGRATION_PATH: migrationsDir
      };

      // Generate Prisma client first (only if needed)
      try {
        logger.info('📦 Ensuring Prisma client is available...');
        await execAsync('npx prisma generate', {
          env: enhancedEnv,
          cwd: process.cwd()
        });
        logger.success('Prisma client ready');
      } catch {
        console.warn('⚠️  Prisma client generation failed, continuing with existing client');
      }

      // Check if migrations exist, if so use migrate deploy, otherwise use db push
      const migrationsExist = fs.existsSync(migrationsDir) &&
                             fs.readdirSync(migrationsDir).length > 0;

      if (migrationsExist) {
        logger.info('📋 Found existing migrations, applying them...');
        await execAsync('npx prisma migrate deploy', {
          env: enhancedEnv,
          cwd: process.cwd()
        });
        logger.success('Migrations applied successfully');
      } else {
        logger.info('🚀 No migrations found, syncing schema...');
        await execAsync('npx prisma db push', {
          env: enhancedEnv,
          cwd: process.cwd()
        });
        logger.success('Schema synchronized successfully');
      }

      logger.success('Database schema created successfully.');

      // Auto-seed if needed
      await autoSeedIfNeeded(prisma);

    } catch (pushError) {
      logger.error('Failed to initialize database', pushError);
      throw pushError;
    }
  }
}

// Helper functions
export async function getStatusId(prisma: InstanceType<typeof PrismaClient>, statusName: string): Promise<number> {
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

interface Tag {
  id: number;
  name: string;
}

export async function ensureTags(prisma: InstanceType<typeof PrismaClient>, tagNames: string[]): Promise<Tag[]> {
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