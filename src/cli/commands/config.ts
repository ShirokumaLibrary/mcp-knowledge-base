import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigManager } from '../../services/config-manager.js';
import fs from 'fs/promises';
import path from 'path';

export function createConfigCommand(): Command {
  const config = new Command('config')
    .description('Manage environment configuration');

  const configManager = new ConfigManager();

  // Show current configuration
  config
    .command('show')
    .description('Show current configuration')
    .option('--format <format>', 'Output format (env|json)', 'env')
    .action(async (options) => {
      try {
        const output = configManager.exportConfig(options.format);
        console.log(output);
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Export configuration
  config
    .command('export')
    .description('Export configuration to file or stdout')
    .option('--format <format>', 'Output format (env|json)', 'env')
    .option('--output <file>', 'Output file path')
    .action(async (options) => {
      try {
        const content = configManager.exportConfig(options.format);

        if (options.output) {
          await fs.writeFile(options.output, content, 'utf-8');
          console.log(chalk.green(`✓ Configuration exported to ${options.output}`));
        } else {
          console.log(content);
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Import configuration
  config
    .command('import <file>')
    .description('Import configuration from file')
    .option('--format <format>', 'Input format (env|json)', 'env')
    .action(async (file, options) => {
      try {
        const content = await fs.readFile(file, 'utf-8');
        configManager.importConfig(content, options.format);

        // Save to .env file with restricted permissions
        const envPath = path.join(process.cwd(), '.env');
        const envContent = configManager.exportConfig('env');
        await fs.writeFile(envPath, envContent, {
          encoding: 'utf-8',
          mode: 0o600  // Owner read/write only
        });

        console.log(chalk.green(`✓ Configuration imported from ${file}`));
        console.log(chalk.green('✓ Saved to .env'));
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  // Switch environment
  config
    .command('env <environment>')
    .description('Switch to different environment (development|production|test)')
    .action(async (environment) => {
      try {
        await configManager.switchEnvironment(environment);

        // Save to .env file with restricted permissions
        const envPath = path.join(process.cwd(), '.env');
        const envContent = configManager.exportConfig('env');
        await fs.writeFile(envPath, envContent, {
          encoding: 'utf-8',
          mode: 0o600  // Owner read/write only
        });

        console.log(chalk.green(`✓ Switched to ${environment} environment`));
        console.log(chalk.green('✓ Configuration saved to .env'));
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        console.log(chalk.yellow('Tip: Create environment files in .shirokuma/config/'));
        console.log(chalk.yellow(`     ${environment}.env`));
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

        // Create config directory
        const configDir = path.join(process.cwd(), '.shirokuma', 'config');
        await fs.mkdir(configDir, { recursive: true });

        // Create environment templates
        const environments = ['development', 'production', 'test'];
        for (const env of environments) {
          const envFile = path.join(configDir, `${env}.env`);
          const envConfig: Record<string, string> = {};

          // Set default values for each environment
          if (env === 'development') {
            envConfig.DATABASE_URL = 'file:.shirokuma/data-dev/shirokuma.db';
            envConfig.NODE_ENV = 'development';
            envConfig.SHIROKUMA_DATA_DIR = '.shirokuma/data-dev';
          } else if (env === 'production') {
            envConfig.DATABASE_URL = 'file:.shirokuma/data-prod/shirokuma.db';
            envConfig.NODE_ENV = 'production';
            envConfig.SHIROKUMA_DATA_DIR = '.shirokuma/data-prod';
          } else if (env === 'test') {
            envConfig.DATABASE_URL = 'file:.shirokuma/data-test/shirokuma.db';
            envConfig.NODE_ENV = 'test';
            envConfig.SHIROKUMA_DATA_DIR = '.shirokuma/data-test';
          }

          envConfig.SHIROKUMA_EXPORT_DIR = 'docs/export';

          // Create env content
          let content = `# ${env.charAt(0).toUpperCase() + env.slice(1)} environment configuration\n\n`;
          for (const [key, value] of Object.entries(envConfig)) {
            content += `${key}=${value}\n`;
          }

          await fs.writeFile(envFile, content, 'utf-8');
          console.log(chalk.green(`✓ Created ${env}.env`));
        }

        console.log(chalk.cyan('\nNext steps:'));
        console.log('1. Copy .env.example to .env');
        console.log('2. Update .env with your configuration');
        console.log('3. Run "shirokuma-kb config validate" to check');
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  return config;
}