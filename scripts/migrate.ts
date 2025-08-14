#!/usr/bin/env tsx
import { exec } from 'child_process';
import { promisify } from 'util';
import { createPrismaEnvironment } from './setup-migrations.js';

const execAsync = promisify(exec);

/**
 * Execute Prisma migration commands with proper environment setup
 */

async function runMigration(command: string, args: string[] = []) {
  try {
    // Setup migration environment based on DATABASE_URL
    const migrationsDir = createPrismaEnvironment();
    
    // Construct the full command
    const fullCommand = `npx prisma ${command} ${args.join(' ')}`;
    
    console.log(`🚀 Running: ${fullCommand}`);
    console.log(`📁 Migrations directory: ${migrationsDir}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL}\n`);
    
    // Set environment variables for Prisma
    const env = {
      ...process.env,
      PRISMA_MIGRATION_PATH: migrationsDir,
    };
    
    // Execute the command
    const { stdout, stderr } = await execAsync(fullCommand, { env });
    
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.stdout) console.log('stdout:', error.stdout);
    if (error.stderr) console.error('stderr:', error.stderr);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Shirokuma Database Migration Tool

Runs Prisma migrations with automatic environment setup based on DATABASE_URL.
Migrations are stored alongside the database file for portability.

Usage:
  npm run migrate <command> [options]

Common commands:
  npm run migrate dev --name <name>    # Create and apply migration
  npm run migrate deploy               # Apply pending migrations (production)
  npm run migrate status               # Show migration status
  npm run migrate reset                # Reset database and apply all migrations
  npm run migrate resolve --rolled-back <migration>  # Mark migration as rolled back

Examples:
  npm run migrate dev --name "add_user_table"
  npm run migrate deploy
  npm run migrate status

Environment:
  DATABASE_URL=${process.env.DATABASE_URL || '<not set>'}
`);
    return;
  }
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.log('Example: DATABASE_URL=file:///path/to/database.db npm run migrate dev');
    process.exit(1);
  }
  
  const command = args[0];
  const commandArgs = args.slice(1);
  
  await runMigration(command, commandArgs);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}