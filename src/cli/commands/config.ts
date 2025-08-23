import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../../services/config-manager.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export function createConfigCommand(): Command {
  const config = new Command('config')
    .description('Manage environment configuration');

  const configManager = new ConfigManager();

  // Show current configuration
  config
    .command('show')
    .description('Show current configuration')
    .option('--format <format>', 'Output format (table|env|json)', 'table')
    .action(async (options) => {
      try {
        if (options.format === 'env' || options.format === 'json') {
          const output = configManager.exportConfig(options.format);
          console.log(output);
        } else {
          // Simple format - show paths clearly without table
          const currentConfig = configManager.getConfig();
          
          console.log(chalk.bold.cyan('\n⚙️  Current Configuration\n'));
          
          // SHIROKUMA_DATA_DIR and database path
          const dataDir = currentConfig.SHIROKUMA_DATA_DIR || '.shirokuma/data';
          const resolvedDataDir = path.resolve(dataDir);
          const dbPath = path.join(resolvedDataDir, 'shirokuma.db');
          const dbExists = existsSync(dbPath);
          
          console.log(chalk.bold('SHIROKUMA_DATA_DIR:'));
          console.log(`  Value: ${dataDir}`);
          console.log(`  Source: ${process.env.SHIROKUMA_DATA_DIR ? 'environment variable' : 'default'}`);
          console.log(`  Database: ${dbExists ? chalk.green(dbPath) : chalk.yellow(dbPath)}`);
          console.log(`  Status: ${dbExists ? chalk.green('✓ exists') : chalk.yellow('! missing')}`);
          console.log();

          // SHIROKUMA_EXPORT_DIR
          const exportDir = currentConfig.SHIROKUMA_EXPORT_DIR || 'docs/export';
          const resolvedExportDir = path.resolve(exportDir);
          const exportDirExists = existsSync(resolvedExportDir);
          
          console.log(chalk.bold('SHIROKUMA_EXPORT_DIR:'));
          console.log(`  Value: ${exportDir}`);
          console.log(`  Source: ${process.env.SHIROKUMA_EXPORT_DIR ? 'environment variable' : 'default'}`);
          console.log(`  Full path: ${exportDirExists ? chalk.green(resolvedExportDir) : chalk.yellow(resolvedExportDir)}`);
          console.log(`  Status: ${exportDirExists ? chalk.green('✓ exists') : chalk.yellow('! missing')}`);
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Validate configuration
  config
    .command('validate')
    .description('Validate current configuration')
    .action(async () => {
      try {
        const result = configManager.validateConfig();

        if (result.valid) {
          console.log(chalk.green('✓ Configuration is valid'));
        } else {
          console.log(chalk.red('✗ Configuration has errors:'));
          for (const error of result.errors) {
            console.log(chalk.red(`  - ${error}`));
          }
          process.exit(1);
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Initialize configuration
  config
    .command('init')
    .description('Initialize configuration files')
    .action(async () => {
      try {
        // Create .env.example
        await configManager.createEnvExample();
        console.log(chalk.green('✓ Created .env.example'));
        console.log(chalk.cyan('\nNext steps:'));
        console.log('1. Copy .env.example to .env');
        console.log('2. Update values as needed');
        console.log('3. Run "shirokuma-kb config validate" to check');
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  return config;
}