/**
 * FileOperations
 *
 * Handles file system operations for setup command.
 * Provides safe file copying, directory creation, and conflict handling.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface CopyOptions {
  overwrite: boolean;
}

export class FileOperations {
  /**
   * Copy directory recursively from source to target
   * @param source - Source directory path
   * @param target - Target directory path
   * @param options - Copy options
   */
  async copyDir(
    source: string,
    target: string,
    options: CopyOptions
  ): Promise<void> {
    // Ensure target directory exists
    await this.ensureDir(target);

    // Read all entries in source directory
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy subdirectory
        await this.copyDir(sourcePath, targetPath, options);
      } else {
        // Check if file exists in target
        const targetExists = await this.fileExists(targetPath);

        if (targetExists && !options.overwrite) {
          // Skip existing file when overwrite is disabled
          continue;
        }

        // Copy file
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  /**
   * Ensure directory exists, create if it doesn't
   * @param dirPath - Directory path to ensure
   */
  async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore EEXIST error (directory already exists)
      const err = error as { code?: string };
      if (err.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Check if file or directory exists
   * @param filePath - Path to check
   * @returns True if exists, false otherwise
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Prompt user for overwrite confirmation
   * @param filePath - File path that would be overwritten
   * @returns True if user confirms, false otherwise
   */
  async promptOverwrite(filePath: string): Promise<boolean> {
    // TODO: Implement interactive prompt
    // This will be implemented when integrating with CLI
    console.warn(`File would be overwritten: ${filePath}`);
    return false;
  }
}
