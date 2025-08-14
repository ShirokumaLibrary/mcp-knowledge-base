#!/usr/bin/env tsx
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Postinstall setup script for shirokuma-v8
 * Handles Prisma client generation only
 * Migrations should be run manually with: shirokuma-kb migrate
 */

async function generatePrismaClient(): Promise<void> {
  try {
    console.log('📦 Generating Prisma client...');
    await execAsync('npx prisma generate', {
      cwd: process.cwd()
    });
    console.log('✅ Prisma client generated successfully');
  } catch (error) {
    console.warn('⚠️  Prisma client generation failed (this is OK during global install)');
    // Don't fail the install process if this fails
  }
}

async function performPostInstallSetup(): Promise<void> {
  console.log('🚀 Starting Shirokuma post-install setup...\n');
  
  // Generate Prisma client only
  await generatePrismaClient();
  
  console.log('\n🎉 Shirokuma is ready to use!');
  console.log('\nTo start:');
  console.log('  shirokuma-kb migrate   # Run database migrations');
  console.log('  shirokuma-kb serve     # Start MCP server');
  console.log('  shirokuma-kb --help    # Show all commands');
}

async function main() {
  try {
    // Skip detailed setup in CI environments
    if (process.env.CI || process.env.NODE_ENV === 'test') {
      console.log('CI environment detected, running minimal setup...');
      await generatePrismaClient();
      return;
    }
    
    await performPostInstallSetup();
  } catch (error) {
    console.error('❌ Post-install setup failed:', error);
    console.log('\n💡 You can run setup manually later with:');
    console.log('   npx shirokuma-kb setup');
    // Don't fail the installation
    process.exit(0);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { performPostInstallSetup };