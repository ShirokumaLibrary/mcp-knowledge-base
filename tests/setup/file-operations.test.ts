import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileOperations } from '../../src/setup/file-operations.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

describe('FileOperations', () => {
  let testDir: string;
  let fileOps: FileOperations;

  beforeEach(async () => {
    // Create unique temp directory for each test
    testDir = path.join(tmpdir(), `shirokuma-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    fileOps = new FileOperations();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('ensureDir', () => {
    it('should create directory if it does not exist', async () => {
      const targetDir = path.join(testDir, 'new-dir');

      await fileOps.ensureDir(targetDir);

      const exists = await fs.access(targetDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should not throw error if directory already exists', async () => {
      const targetDir = path.join(testDir, 'existing-dir');
      await fs.mkdir(targetDir);

      await expect(fileOps.ensureDir(targetDir)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const nestedDir = path.join(testDir, 'level1', 'level2', 'level3');

      await fileOps.ensureDir(nestedDir);

      const exists = await fs.access(nestedDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(testDir, 'test-file.txt');
      await fs.writeFile(filePath, 'test content');

      const exists = await fileOps.fileExists(filePath);

      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const filePath = path.join(testDir, 'non-existing-file.txt');

      const exists = await fileOps.fileExists(filePath);

      expect(exists).toBe(false);
    });

    it('should return true for existing directory', async () => {
      const dirPath = path.join(testDir, 'test-dir');
      await fs.mkdir(dirPath);

      const exists = await fileOps.fileExists(dirPath);

      expect(exists).toBe(true);
    });
  });

  describe('copyDir', () => {
    it('should copy directory with files', async () => {
      // Setup source directory
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.mkdir(sourceDir);
      await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(sourceDir, 'file2.txt'), 'content2');

      await fileOps.copyDir(sourceDir, targetDir, { overwrite: false });

      const file1Content = await fs.readFile(path.join(targetDir, 'file1.txt'), 'utf-8');
      const file2Content = await fs.readFile(path.join(targetDir, 'file2.txt'), 'utf-8');
      expect(file1Content).toBe('content1');
      expect(file2Content).toBe('content2');
    });

    it('should copy nested directory structure', async () => {
      // Setup source directory with nested structure
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      const nestedDir = path.join(sourceDir, 'nested', 'deep');
      await fs.mkdir(nestedDir, { recursive: true });
      await fs.writeFile(path.join(nestedDir, 'nested-file.txt'), 'nested content');
      await fs.writeFile(path.join(sourceDir, 'root-file.txt'), 'root content');

      await fileOps.copyDir(sourceDir, targetDir, { overwrite: false });

      const nestedFileContent = await fs.readFile(
        path.join(targetDir, 'nested', 'deep', 'nested-file.txt'),
        'utf-8'
      );
      const rootFileContent = await fs.readFile(path.join(targetDir, 'root-file.txt'), 'utf-8');
      expect(nestedFileContent).toBe('nested content');
      expect(rootFileContent).toBe('root content');
    });

    it('should preserve directory structure', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      const subDir1 = path.join(sourceDir, 'sub1');
      const subDir2 = path.join(sourceDir, 'sub2');
      await fs.mkdir(subDir1, { recursive: true });
      await fs.mkdir(subDir2, { recursive: true });
      await fs.writeFile(path.join(subDir1, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(subDir2, 'file2.txt'), 'content2');

      await fileOps.copyDir(sourceDir, targetDir, { overwrite: false });

      const sub1Exists = await fs.access(path.join(targetDir, 'sub1')).then(() => true).catch(() => false);
      const sub2Exists = await fs.access(path.join(targetDir, 'sub2')).then(() => true).catch(() => false);
      expect(sub1Exists).toBe(true);
      expect(sub2Exists).toBe(true);
    });

    it('should handle overwrite option when set to true', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.mkdir(sourceDir);
      await fs.mkdir(targetDir);

      // Create existing file in target
      await fs.writeFile(path.join(targetDir, 'file.txt'), 'old content');
      // Create new file in source
      await fs.writeFile(path.join(sourceDir, 'file.txt'), 'new content');

      await fileOps.copyDir(sourceDir, targetDir, { overwrite: true });

      const content = await fs.readFile(path.join(targetDir, 'file.txt'), 'utf-8');
      expect(content).toBe('new content');
    });

    it('should throw error when target exists and overwrite is false', async () => {
      const sourceDir = path.join(testDir, 'source');
      const targetDir = path.join(testDir, 'target');
      await fs.mkdir(sourceDir);
      await fs.mkdir(targetDir);
      await fs.writeFile(path.join(targetDir, 'existing-file.txt'), 'existing');
      await fs.writeFile(path.join(sourceDir, 'existing-file.txt'), 'source');

      await expect(
        fileOps.copyDir(sourceDir, targetDir, { overwrite: false })
      ).rejects.toThrow();
    });

    it('should handle empty directories', async () => {
      const sourceDir = path.join(testDir, 'empty-source');
      const targetDir = path.join(testDir, 'empty-target');
      await fs.mkdir(sourceDir);

      await fileOps.copyDir(sourceDir, targetDir, { overwrite: false });

      const targetExists = await fs.access(targetDir).then(() => true).catch(() => false);
      expect(targetExists).toBe(true);
    });
  });
});
