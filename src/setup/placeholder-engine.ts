/**
 * PlaceholderEngine
 *
 * Replaces placeholders in template files with environment-specific values.
 * Supports recursive directory processing for batch file generation.
 * Provides incremental updates by detecting file changes.
 */

import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface PlaceholderConfig {
  MCP_NAME: string;           // e.g., "mcp__shirokuma-kb"
  WORKSPACE_FOLDER: string;   // Project root path
}

export interface ProcessResult {
  processedFiles: string[];   // List of processed file paths
  skippedFiles: string[];     // List of skipped file paths (unchanged)
  totalFiles: number;         // Total number of files found
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
   * Only processes files that are newer than their target counterparts (incremental update)
   *
   * @param sourceDir - Source directory with template files
   * @param targetDir - Target directory for processed files
   * @param options - Processing options
   * @returns ProcessResult with list of processed and skipped files
   */
  async processDirectory(
    sourceDir: string,
    targetDir: string,
    options: { incremental?: boolean } = {}
  ): Promise<ProcessResult> {
    const result: ProcessResult = {
      processedFiles: [],
      skippedFiles: [],
      totalFiles: 0
    };

    // Check if source directory exists
    if (!existsSync(sourceDir)) {
      return result; // Return empty result if source doesn't exist
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
        const subResult = await this.processDirectory(sourcePath, targetPath, options);

        // Merge results
        result.processedFiles.push(...subResult.processedFiles);
        result.skippedFiles.push(...subResult.skippedFiles);
        result.totalFiles += subResult.totalFiles;
      } else if (entry.isFile()) {
        result.totalFiles++;

        // Check if incremental update is enabled and file hasn't changed
        if (options.incremental && existsSync(targetPath)) {
          const sourceStat = await stat(sourcePath);
          const targetStat = await stat(targetPath);

          // Skip if target is newer or same age as source
          if (targetStat.mtime >= sourceStat.mtime) {
            result.skippedFiles.push(sourcePath);
            continue;
          }
        }

        // Read file content
        const content = await readFile(sourcePath, 'utf-8');

        // Replace placeholders
        const processedContent = this.replace(content);

        // Write to target directory
        await writeFile(targetPath, processedContent, 'utf-8');

        result.processedFiles.push(sourcePath);
      }
    }

    return result;
  }
}
