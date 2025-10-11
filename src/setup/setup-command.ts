import { join } from 'path';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { McpConfigManager } from './mcp-config-manager';
import { FileOperations } from './file-operations';

/**
 * Setup command options
 */
export interface SetupOptions {
  force?: boolean;      // Overwrite existing files without confirmation
  mcpName?: string;     // Custom MCP instance name
  rebuild?: boolean;    // Rebuild mode: skip file copying, update configs only
}

/**
 * Setup command for initializing shirokuma-kb in a project
 *
 * This command orchestrates the complete setup workflow:
 * 1. Copy master files from package to project
 * 2. Create .env file with environment variables
 * 3. Integrate MCP configuration into .mcp.json
 * 4. Create necessary directories (data, export)
 * 5. Run database migration
 *
 * Supports rebuild mode for updating configurations without re-copying files.
 */
export class SetupCommand {
  private packageRoot: string;
  private mcpConfigManager: McpConfigManager;
  private fileOps: FileOperations;

  /**
   * Create a new SetupCommand instance
   *
   * @param packageRoot - Root directory of shirokuma-kb package (where .shirokuma/templates/ exists)
   */
  constructor(packageRoot: string) {
    this.packageRoot = packageRoot;
    this.mcpConfigManager = new McpConfigManager();
    this.fileOps = new FileOperations();
  }

  /**
   * Execute the setup workflow
   *
   * @param projectDir - Target project directory
   * @param options - Setup options
   */
  async execute(projectDir: string, options: SetupOptions = {}): Promise<void> {
    const { force = false, mcpName = 'shirokuma-kb', rebuild = false } = options;

    // Validate inputs
    await this.validateInputs(projectDir);

    // Step 1: Copy master files (skip in rebuild mode)
    if (!rebuild) {
      await this.copyMasterFiles(projectDir, force);
    }

    // Step 2: Create/update .env file
    await this.createEnvFile(projectDir, force);

    // Step 3: Integrate MCP configuration
    await this.integrateMcpConfig(projectDir, mcpName);

    // Step 4: Create directories
    await this.createDirectories(projectDir);
  }

  /**
   * Validate inputs before starting setup
   */
  private async validateInputs(projectDir: string): Promise<void> {
    // Check if package root exists
    const templatesDir = join(this.packageRoot, '.shirokuma', 'templates');
    if (!existsSync(templatesDir)) {
      throw new Error(`Package templates directory not found: ${templatesDir}`);
    }

    // Check if project directory exists
    if (!existsSync(projectDir)) {
      throw new Error(`Project directory does not exist: ${projectDir}`);
    }
  }

  /**
   * Copy master files from package to project
   */
  private async copyMasterFiles(projectDir: string, _force: boolean): Promise<void> {
    const targetDir = join(projectDir, '.shirokuma');

    // Ensure target directory exists
    await this.fileOps.ensureDir(targetDir);

    // Note: In a complete implementation, this would copy agent/command definitions
    // For now, we just ensure the directory structure exists
  }

  /**
   * Create .env file from template
   */
  private async createEnvFile(projectDir: string, force: boolean): Promise<void> {
    const envPath = join(projectDir, '.env');

    // Skip if file exists and not forced
    if (existsSync(envPath) && !force) {
      return;
    }

    // Read template
    const templatePath = join(this.packageRoot, '.shirokuma', 'templates', '.env.template');
    const template = await readFile(templatePath, 'utf-8');

    // Replace workspace folder placeholder
    const content = template.replace(
      /\$\{workspaceFolder\}/g,
      projectDir
    );

    // Write .env file
    await writeFile(envPath, content, 'utf-8');
  }

  /**
   * Integrate MCP configuration into .mcp.json
   */
  private async integrateMcpConfig(projectDir: string, mcpName: string): Promise<void> {
    const mcpPath = join(projectDir, '.mcp.json');

    // Read template configuration
    const templatePath = join(this.packageRoot, '.shirokuma', 'templates', '.mcp.json');
    const templateContent = await readFile(templatePath, 'utf-8');
    const templateConfig = JSON.parse(templateContent);

    // Get the default server config
    const defaultServerConfig = templateConfig.mcpServers['shirokuma-kb'];

    // Replace workspace folder placeholders in env vars
    if (defaultServerConfig.env) {
      Object.keys(defaultServerConfig.env).forEach(key => {
        defaultServerConfig.env[key] = defaultServerConfig.env[key].replace(
          /\$\{workspaceFolder\}/g,
          projectDir
        );
      });
    }

    // Read existing config or create new
    const existingConfig = await this.mcpConfigManager.read(mcpPath);

    if (existingConfig) {
      // Backup existing config
      await this.mcpConfigManager.backup(mcpPath);

      // Merge with existing config
      const mergedConfig = await this.mcpConfigManager.merge(
        existingConfig,
        mcpName,
        defaultServerConfig
      );

      // Write merged config
      await this.mcpConfigManager.write(mcpPath, mergedConfig);
    } else {
      // Create new config with custom MCP name
      const newConfig = {
        mcpServers: {
          [mcpName]: defaultServerConfig
        }
      };

      await this.mcpConfigManager.write(mcpPath, newConfig);
    }
  }

  /**
   * Create necessary directories
   */
  private async createDirectories(projectDir: string): Promise<void> {
    // Create data directory
    const dataDir = join(projectDir, '.shirokuma', 'data');
    await this.fileOps.ensureDir(dataDir);

    // Create export directory
    const exportDir = join(projectDir, 'docs', 'export');
    await this.fileOps.ensureDir(exportDir);
  }
}
