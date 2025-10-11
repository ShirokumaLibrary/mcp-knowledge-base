import { join } from 'path';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { McpConfigManager } from './mcp-config-manager';
import { FileOperations } from './file-operations';
import { PlaceholderEngine } from './placeholder-engine';

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

    // Validate inputs including MCP name
    await this.validateInputs(projectDir, mcpName);

    // In rebuild mode, detect MCP name from existing config
    let effectiveMcpName = mcpName;
    if (rebuild) {
      effectiveMcpName = await this.detectMcpName(projectDir) || mcpName;
    }

    // Step 1: Copy master files (skip in rebuild mode)
    if (!rebuild) {
      await this.copyMasterFiles(projectDir, force);
    }

    // Step 2: Create/update .env file (skip in rebuild mode)
    if (!rebuild) {
      await this.createEnvFile(projectDir, force);
    }

    // Step 3: Integrate MCP configuration
    await this.integrateMcpConfig(projectDir, effectiveMcpName);

    // Step 4: Create directories (skip in rebuild mode)
    if (!rebuild) {
      await this.createDirectories(projectDir);
    }

    // Step 5: Generate .claude files with placeholder replacement
    // Enable incremental mode in rebuild to skip unchanged files
    await this.generateClaudeFiles(projectDir, effectiveMcpName, rebuild);

    // Step 6: Run migration (skip in rebuild mode)
    if (!rebuild) {
      await this.runMigration(projectDir);
    }
  }

  /**
   * Validate inputs before starting setup
   */
  private async validateInputs(projectDir: string, mcpName?: string): Promise<void> {
    // Check if package root exists
    const templatesDir = join(this.packageRoot, '.shirokuma', 'templates');
    if (!existsSync(templatesDir)) {
      throw new Error(`Package templates directory not found: ${templatesDir}`);
    }

    // Check if project directory exists
    if (!existsSync(projectDir)) {
      throw new Error(`Project directory does not exist: ${projectDir}`);
    }

    // Validate MCP name if provided
    if (mcpName !== undefined) {
      this.validateMcpName(mcpName);
    }
  }

  /**
   * Validate MCP name format
   *
   * MCP names must:
   * - Contain only lowercase letters, numbers, and hyphens
   * - Start and end with alphanumeric characters
   * - Be between 1 and 50 characters long
   *
   * @param mcpName - MCP instance name to validate
   * @throws Error if name is invalid
   */
  private validateMcpName(mcpName: string): void {
    // Check if empty
    if (!mcpName || mcpName.trim().length === 0) {
      throw new Error('MCP name cannot be empty');
    }

    // Check length
    if (mcpName.length > 50) {
      throw new Error(`MCP name too long: "${mcpName}" (max 50 characters)`);
    }

    // Check format: only lowercase letters, numbers, and hyphens
    const validFormat = /^[a-z0-9]+([a-z0-9-]*[a-z0-9]+)?$/;
    if (!validFormat.test(mcpName)) {
      throw new Error(
        `Invalid MCP name: "${mcpName}"\n` +
        'MCP names must:\n' +
        '  - Contain only lowercase letters, numbers, and hyphens\n' +
        '  - Start and end with alphanumeric characters\n' +
        '  - Not contain consecutive hyphens\n' +
        'Examples: "shirokuma-kb", "my-kb", "kb2"'
      );
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

  /**
   * Generate .claude files with placeholder replacement
   *
   * Reads files from .shirokuma/agents and .shirokuma/commands,
   * replaces placeholders, and writes to .claude/agents and .claude/commands
   *
   * @param projectDir - Project directory
   * @param mcpName - MCP instance name
   * @param incremental - Enable incremental updates (only process changed files)
   */
  private async generateClaudeFiles(
    projectDir: string,
    mcpName: string,
    incremental: boolean = false
  ): Promise<void> {
    const placeholderEngine = new PlaceholderEngine(mcpName, projectDir);

    // Process agents directory
    const sourceAgentsDir = join(projectDir, '.shirokuma', 'agents');
    const targetAgentsDir = join(projectDir, '.claude', 'agents');
    const agentsResult = await placeholderEngine.processDirectory(
      sourceAgentsDir,
      targetAgentsDir,
      { incremental }
    );

    // Process commands directory
    const sourceCommandsDir = join(projectDir, '.shirokuma', 'commands');
    const targetCommandsDir = join(projectDir, '.claude', 'commands');
    const commandsResult = await placeholderEngine.processDirectory(
      sourceCommandsDir,
      targetCommandsDir,
      { incremental }
    );

    // Log results if incremental mode is enabled
    if (incremental) {
      const totalProcessed = agentsResult.processedFiles.length + commandsResult.processedFiles.length;
      const totalSkipped = agentsResult.skippedFiles.length + commandsResult.skippedFiles.length;
      const totalFiles = agentsResult.totalFiles + commandsResult.totalFiles;

      console.log(`\n📝 File Processing Summary:`);
      console.log(`  Total files: ${totalFiles}`);
      console.log(`  Processed: ${totalProcessed}`);
      console.log(`  Skipped (unchanged): ${totalSkipped}`);

      if (totalProcessed > 0) {
        console.log(`\n✅ Updated files:`);
        [...agentsResult.processedFiles, ...commandsResult.processedFiles].forEach(file => {
          console.log(`  - ${file}`);
        });
      }
    }
  }

  /**
   * Detect MCP name from existing .mcp.json
   *
   * Looks for shirokuma-kb related server configuration in .mcp.json
   * Returns the first matching server name or null if not found
   */
  private async detectMcpName(projectDir: string): Promise<string | null> {
    const mcpPath = join(projectDir, '.mcp.json');

    // Check if .mcp.json exists
    if (!existsSync(mcpPath)) {
      return null;
    }

    try {
      // Read and parse .mcp.json
      const config = await this.mcpConfigManager.read(mcpPath);
      if (!config || !config.mcpServers) {
        return null;
      }

      // Look for shirokuma-kb server (any name containing "shirokuma" or "kb")
      const serverNames = Object.keys(config.mcpServers);
      const shiroKumaServer = serverNames.find(name =>
        name.toLowerCase().includes('shirokuma') ||
        name.toLowerCase().includes('kb')
      );

      return shiroKumaServer || null;
    } catch (_error) {
      // If parsing fails, return null
      return null;
    }
  }

  /**
   * Run database migration
   *
   * Note: This is a placeholder implementation. In production, this would
   * execute the actual migration command (shirokuma-kb migrate).
   * The full implementation will be added when CLI integration is complete.
   */
  private async runMigration(_projectDir: string): Promise<void> {
    // Placeholder: Migration execution will be implemented in CLI integration phase
    // This method is called to ensure the setup workflow includes migration step
    // Future implementation will execute: `shirokuma-kb migrate`
  }
}
