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
        await configManager.loadEnvFile(environment);

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

        // Create environment template files in project root
        const environments = ['development', 'production', 'test'];
        for (const env of environments) {
          const envFile = path.join(process.cwd(), `.env.${env}`);
          
          // Skip if file already exists
          try {
            await fs.access(envFile);
            console.log(chalk.yellow(`⚠ Skipped .env.${env} (already exists)`));
            continue;
          } catch {
            // File doesn't exist, create it
          }
          
          // Create reasonable defaults for each environment
          const envConfig: Record<string, string> = {
            SHIROKUMA_DATABASE_URL: `file:.shirokuma/data-${env}/shirokuma.db`,
            NODE_ENV: env,
            SHIROKUMA_DATA_DIR: `.shirokuma/data-${env}`,
            SHIROKUMA_EXPORT_DIR: env === 'production' ? 'docs/export' : `docs/export-${env}`
          };

          // Create env content
          let content = `# ${env.charAt(0).toUpperCase() + env.slice(1)} environment configuration\n`;
          for (const [key, value] of Object.entries(envConfig)) {
            content += `${key}=${value}\n`;
          }

          await fs.writeFile(envFile, content, 'utf-8');
          console.log(chalk.green(`✓ Created .env.${env}`));
        }

        console.log(chalk.cyan('\nNext steps:'));
        console.log('1. Review and customize the environment files');
        console.log('2. Use --env option to specify environment:');
        console.log('   shirokuma-kb list --env development');
        console.log('   shirokuma-kb list --env production');
        console.log('   shirokuma-kb list --env test');
        console.log('3. Run "shirokuma-kb config validate" to check');
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  return config;
}