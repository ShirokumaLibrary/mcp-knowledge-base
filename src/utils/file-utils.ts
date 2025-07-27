/**
 * @ai-context File system utility functions
 * @ai-pattern Common file operations
 * @ai-critical Handles file system errors gracefully
 * @ai-why Centralizes file operations
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileSystemError } from '../errors/custom-errors.js';

/**
 * @ai-intent Ensure directory exists
 * @ai-flow Create directory recursively if needed
 * @ai-pattern Idempotent directory creation
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new FileSystemError(
      `Failed to create directory: ${dirPath}`,
      'create',
      dirPath,
      { error }
    );
  }
}

/**
 * @ai-intent Check if path exists
 * @ai-pattern Safe existence check
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * @ai-intent Read file safely
 * @ai-pattern Returns null on not found
 */
export async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw new FileSystemError(
      `Failed to read file: ${filePath}`,
      'read',
      filePath,
      { error }
    );
  }
}

/**
 * @ai-intent Write file with directory creation
 * @ai-pattern Ensures parent directory exists
 */
export async function writeFileSafe(filePath: string, content: string): Promise<void> {
  try {
    await ensureDirectoryExists(path.dirname(filePath));
    await fs.promises.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new FileSystemError(
      `Failed to write file: ${filePath}`,
      'write',
      filePath,
      { error }
    );
  }
}

/**
 * @ai-intent Delete file safely
 * @ai-pattern Ignores if not exists
 */
export async function deleteFileSafe(filePath: string): Promise<boolean> {
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw new FileSystemError(
      `Failed to delete file: ${filePath}`,
      'delete',
      filePath,
      { error }
    );
  }
}