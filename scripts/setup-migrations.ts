#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

/**
 * Setup Prisma migrations for the current DATABASE_URL environment
 * Creates migration directory structure based on DATABASE_URL location
 */

function getDatabasePath(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Handle file:// URLs
  let dbPath = databaseUrl;
  if (dbPath.startsWith('file://')) {
    dbPath = dbPath.replace('file://', '');
  } else if (dbPath.startsWith('file:')) {
    dbPath = dbPath.replace('file:', '');
  }

  return dbPath;
}

function setupMigrationDirectory(): string {
  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);
  const migrationsDir = path.join(dbDir, 'migrations');

  // Ensure the database directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Created database directory: ${dbDir}`);
  }

  // Ensure the migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    console.log(`Created migrations directory: ${migrationsDir}`);
  }

  return migrationsDir;
}

function createPrismaEnvironment(): string {
  const migrationsDir = setupMigrationDirectory();
  
  // Set PRISMA_MIGRATION_PATH for this process
  process.env.PRISMA_MIGRATION_PATH = migrationsDir;
  
  console.log(`Database URL: ${process.env.DATABASE_URL}`);
  console.log(`Migrations directory: ${migrationsDir}`);
  
  return migrationsDir;
}

function showHelp() {
  console.log(`
Shirokuma Database Migration Setup

This script sets up Prisma migrations based on the DATABASE_URL environment variable.
Migrations will be stored alongside the database file for easy portability.

Usage:
  npm run setup-migrations

Environment variables:
  DATABASE_URL - Required. Points to the SQLite database file location.

Examples:
  DATABASE_URL=file:///home/user/.shirokuma/data/shirokuma.db npm run setup-migrations
  DATABASE_URL=file:./local/shirokuma.db npm run setup-migrations
`);
}

async function main() {
  try {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      showHelp();
      return;
    }

    const migrationsDir = createPrismaEnvironment();
    
    // Create a .env file in the migrations directory for reference
    const envContent = `# Shirokuma Database Configuration
DATABASE_URL=${process.env.DATABASE_URL}
PRISMA_MIGRATION_PATH=${migrationsDir}

# Generated on: ${new Date().toISOString()}
`;
    
    const envPath = path.join(path.dirname(migrationsDir), '.env');
    fs.writeFileSync(envPath, envContent);
    console.log(`Created environment reference: ${envPath}`);
    
    console.log('\n✅ Migration setup complete!');
    console.log('\nNext steps:');
    console.log('  1. Run: npx prisma migrate dev --name init');
    console.log('  2. Or: npx prisma db push (for schema sync without migrations)');
    
  } catch (error) {
    console.error('❌ Migration setup failed:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createPrismaEnvironment, setupMigrationDirectory };