import { readFile, writeFile, copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';

/**
 * MCP server configuration
 */
export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * Complete MCP configuration
 */
export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

/**
 * Manages MCP configuration file operations including reading, merging, and writing
 *
 * This class provides safe operations for managing .mcp.json files:
 * - Reading and parsing existing configurations
 * - Merging new server configurations with existing ones
 * - Creating backups before modifications
 * - Writing configurations with proper formatting
 */
export class McpConfigManager {
  /**
   * Read and parse MCP configuration from file
   *
   * @param filePath - Path to .mcp.json file
   * @returns Parsed configuration or null if file doesn't exist
   * @throws Error if file contains invalid JSON
   */
  async read(filePath: string): Promise<McpConfig | null> {
    // Check if file exists
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = await readFile(filePath, 'utf-8');

      // Handle empty file
      if (content.trim() === '') {
        throw new Error('Configuration file is empty');
      }

      const config = JSON.parse(content) as McpConfig;
      return config;
    } catch (error) {
      if ((error as { code?: string }).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Merge new server configuration with existing configuration
   *
   * @param existing - Existing MCP configuration
   * @param serverName - Name of the server to add/update
   * @param config - Server configuration to merge
   * @returns Merged configuration
   */
  async merge(
    existing: McpConfig,
    serverName: string,
    config: McpServerConfig
  ): Promise<McpConfig> {
    // Create a new config object with all existing servers
    const merged: McpConfig = {
      mcpServers: {
        ...existing.mcpServers
      }
    };

    // Add or update the specified server
    merged.mcpServers[serverName] = config;

    return merged;
  }

  /**
   * Write MCP configuration to file with proper formatting
   *
   * @param filePath - Path to .mcp.json file
   * @param config - Configuration to write
   */
  async write(filePath: string, config: McpConfig): Promise<void> {
    // Ensure parent directory exists
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Write with 2-space indentation for readability
    const content = JSON.stringify(config, null, 2);
    await writeFile(filePath, content, 'utf-8');
  }

  /**
   * Create a backup of the configuration file
   *
   * @param filePath - Path to .mcp.json file
   * @returns Path to the backup file
   */
  async backup(filePath: string): Promise<string> {
    // Return original path if file doesn't exist
    if (!existsSync(filePath)) {
      return filePath;
    }

    // Create backup filename with timestamp
    const timestamp = Date.now();
    const backupPath = `${filePath}.backup.${timestamp}`;

    // Copy file to backup location
    await copyFile(filePath, backupPath);

    return backupPath;
  }
}
