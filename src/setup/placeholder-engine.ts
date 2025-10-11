/**
 * PlaceholderEngine
 *
 * Replaces placeholders in template files with environment-specific values.
 * Supports recursive directory processing for batch file generation.
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface PlaceholderConfig {
  MCP_NAME: string;           // e.g., "mcp__shirokuma-kb"
  WORKSPACE_FOLDER: string;   // Project root path
}

export class PlaceholderEngine {
  private config: PlaceholderConfig;

  constructor(mcpName: string, workspaceRoot: string) {
    this.config = {
      MCP_NAME: `mcp__${mcpName}`,
      WORKSPACE_FOLDER: workspaceRoot
    };
  }

  /**
   * Replace placeholders in content with configured values
   * @param content - Template content with placeholders
   * @returns Content with placeholders replaced
   */
  replace(content: string): string {
    return content
      .replace(/\{\{MCP_NAME\}\}/g, this.config.MCP_NAME)
      .replace(/\{\{WORKSPACE_FOLDER\}\}/g, this.config.WORKSPACE_FOLDER);
  }

  /**
   * Process directory recursively, replacing placeholders in all files
   * @param sourceDir - Source directory with template files
   * @param targetDir - Target directory for processed files
   */
  async processDirectory(
    sourceDir: string,
    targetDir: string
  ): Promise<void> {
    // Check if source directory exists
    if (!existsSync(sourceDir)) {
      return; // Skip if source doesn't exist
    }

    // Ensure target directory exists
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    // Read directory contents
    const entries = await readdir(sourceDir, { withFileTypes: true });

    // Process each entry
    for (const entry of entries) {
      const sourcePath = join(sourceDir, entry.name);
      const targetPath = join(targetDir, entry.name);

      if (entry.isDirectory()) {
        // Recursively process subdirectory
        await this.processDirectory(sourcePath, targetPath);
      } else if (entry.isFile()) {
        // Read file content
        const content = await readFile(sourcePath, 'utf-8');

        // Replace placeholders
        const processedContent = this.replace(content);

        // Write to target directory
        await writeFile(targetPath, processedContent, 'utf-8');
      }
    }
  }
}
