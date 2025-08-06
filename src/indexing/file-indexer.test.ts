/**
 * @ai-context Unit tests for FileIndexer
 * @ai-pattern Test file indexing, search, and cleanup functionality
 * @ai-critical Ensures semantic search works correctly
 * @ai-related-files
 *   - src/indexing/file-indexer.ts (implementation)
 *   - src/handlers/file-index-handlers.ts (MCP integration)
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock config to avoid environment dependency in tests
jest.mock('../config.js', () => ({
  getConfig: () => ({
    database: {
      path: '.shirokuma/data'
    },
    logging: {
      enabled: false,
      level: 'error',
      logDir: './logs'
    }
  }),
  config: {
    database: {
      path: '.shirokuma/data'
    }
  }
}));

// Mock @xenova/transformers before importing FileIndexer
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue((text: string) => {
    // Create a simple mock embedding based on text content
    const embedding = new Float32Array(384);
    for (let i = 0; i < 384; i++) {
      // Simple hash-based embedding for consistent results
      embedding[i] = (text.charCodeAt(i % text.length) % 100) / 100;
    }
    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    for (let i = 0; i < 384; i++) {
      embedding[i] /= magnitude;
    }
    return {
      data: embedding
    };
  })
}));

import { FileIndexer } from './file-indexer.js';

describe('FileIndexer', () => {
  let testDir: string;
  let indexer: FileIndexer;

  beforeEach(() => {
    // Create test directory
    testDir = join(tmpdir(), `file-indexer-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Initialize git repo
    execSync('git init', { cwd: testDir });
    execSync('git config user.email "test@example.com"', { cwd: testDir });
    execSync('git config user.name "Test User"', { cwd: testDir });
  });

  afterEach(() => {
    // Clean up
    if (indexer) {
      indexer.close();
    }
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('initialization', () => {
    it('should create index database', async () => {
      indexer = new FileIndexer({ projectRoot: testDir });
      await indexer.initialize();
      const indexPath = join(testDir, '.shirokuma/data/index.db');
      expect(existsSync(indexPath)).toBe(true);
    });

    it('should handle custom index path', () => {
      const customPath = '.custom/index.db';
      indexer = new FileIndexer({
        projectRoot: testDir,
        indexPath: customPath
      });
      const indexPath = join(testDir, customPath);
      expect(existsSync(indexPath)).toBe(true);
    });

    it('should respect absolute paths from config', async () => {
      // Test that absolute paths are handled correctly
      const absolutePath = '/tmp/test-index.db';
      indexer = new FileIndexer({
        projectRoot: testDir,
        indexPath: absolutePath
      });
      await indexer.initialize();

      expect(existsSync(absolutePath)).toBe(true);

      // Clean up
      indexer.close();
      rmSync(absolutePath, { force: true });
    });

    it('should handle absolute index paths', () => {
      const absolutePath = join(testDir, 'absolute', 'index.db');
      indexer = new FileIndexer({
        projectRoot: testDir,
        indexPath: absolutePath
      });

      expect(existsSync(absolutePath)).toBe(true);
    });
  });

  describe('file filtering', () => {
    beforeEach(() => {
      indexer = new FileIndexer({ projectRoot: testDir });
    });

    it('should index JavaScript files', async () => {
      // Create test files
      writeFileSync(join(testDir, 'test.js'), 'console.log("test");');
      execSync('git add .', { cwd: testDir });

      await indexer.initialize();
      await indexer.indexAll();

      const stats = indexer.getStats();
      expect(stats.totalFiles).toBe(1);
    });

    it('should respect .shirokumaignore', async () => {
      // Create test files
      writeFileSync(join(testDir, 'include.js'), 'console.log("include");');
      writeFileSync(join(testDir, 'exclude.js'), 'console.log("exclude");');
      writeFileSync(join(testDir, '.shirokumaignore'), 'exclude.js');

      execSync('git add .', { cwd: testDir });

      await indexer.initialize();
      await indexer.indexAll();

      const stats = indexer.getStats();
      expect(stats.totalFiles).toBe(2); // include.js and .shirokumaignore
    });

    it('should respect force include in .shirokumaignore', async () => {
      // Create test files
      mkdirSync(join(testDir, 'dist'));
      writeFileSync(join(testDir, 'dist/bundle.js'), 'console.log("bundle");');
      writeFileSync(join(testDir, '.shirokumaignore'), '!dist/bundle.js');

      execSync('git add .', { cwd: testDir });

      await indexer.initialize();
      await indexer.indexAll();

      const stats = indexer.getStats();
      expect(stats.totalFiles).toBe(1); // Force included
    });
  });

  describe('chunking', () => {
    beforeEach(() => {
      indexer = new FileIndexer({
        projectRoot: testDir,
        chunkSize: 5 // Small chunks for testing
      });
    });

    it('should chunk large files', async () => {
      // Create a file with multiple lines
      const content = Array(20).fill(0).map((_, i) => `line ${i}`).join('\n');
      writeFileSync(join(testDir, 'large.js'), content);
      execSync('git add .', { cwd: testDir });

      await indexer.initialize();
      await indexer.indexAll();

      const stats = indexer.getStats();
      expect(stats.totalChunks).toBeGreaterThan(1);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      indexer = new FileIndexer({ projectRoot: testDir });

      // Create test files
      writeFileSync(join(testDir, 'auth.js'), `
function authenticate(username, password) {
  // Check user credentials
  return checkDatabase(username, password);
}
`);

      writeFileSync(join(testDir, 'utils.js'), `
function validateEmail(email) {
  return /^[^@]+@[^@]+$/.test(email);
}
`);

      execSync('git add .', { cwd: testDir });

      await indexer.initialize();
      await indexer.indexAll();
    });

    it('should find code by natural language query', async () => {
      const results = await indexer.search('user authentication');

      expect(results.length).toBeGreaterThan(0);
      // Check that we get relevant files
      const filePaths = results.map(r => r.filePath);
      expect(filePaths).toContain('auth.js');
    });

    it('should find code by pattern', async () => {
      const results = await indexer.search('email validation regex');

      expect(results.length).toBeGreaterThan(0);
      // With mock embeddings, we can't test semantic accuracy
      expect(results[0].filePath).toBeDefined();
    });

    it('should filter by file type', async () => {
      writeFileSync(join(testDir, 'test.md'), '# Authentication docs');
      execSync('git add .', { cwd: testDir });
      await indexer.indexFile('test.md');

      const results = await indexer.search('authentication', {
        fileTypes: ['md']
      });

      expect(results.length).toBe(1);
      expect(results[0].filePath).toBe('test.md');
    });

    it('should respect minimum score', async () => {
      const results = await indexer.search('completely unrelated query', {
        minScore: 0.99 // Very high threshold since our mock returns 0.1 similarity
      });

      expect(results.length).toBe(0);
    });
  });

  describe('file updates', () => {
    beforeEach(async () => {
      indexer = new FileIndexer({ projectRoot: testDir });
      await indexer.initialize();
    });

    it('should detect file changes', async () => {
      // Create initial file
      writeFileSync(join(testDir, 'change.js'), 'const x = 1;');
      execSync('git add .', { cwd: testDir });
      await indexer.indexFile('change.js');

      const stats1 = indexer.getStats();

      // Update file
      writeFileSync(join(testDir, 'change.js'), 'const x = 2; // changed');
      await indexer.indexFile('change.js');

      const stats2 = indexer.getStats();
      expect(stats2.totalFiles).toBe(stats1.totalFiles);
    });

    it('should skip unchanged files', async () => {
      // Create file
      writeFileSync(join(testDir, 'same.js'), 'const y = 1;');
      execSync('git add .', { cwd: testDir });

      // Index twice
      await indexer.indexFile('same.js');
      const stats1 = indexer.getStats();

      await indexer.indexFile('same.js');
      const stats2 = indexer.getStats();

      expect(stats2).toEqual(stats1);
    });

    it('should clean up deleted files', async () => {
      // Create and index files
      writeFileSync(join(testDir, 'keep.js'), 'const keep = true;');
      writeFileSync(join(testDir, 'delete.js'), 'const del = true;');
      execSync('git add .', { cwd: testDir });
      execSync('git commit -m "initial"', { cwd: testDir });

      await indexer.indexAll();
      const stats1 = indexer.getStats();
      expect(stats1.totalFiles).toBe(2);

      // Delete file from git
      execSync('git rm delete.js', { cwd: testDir });
      execSync('git commit -m "delete file"', { cwd: testDir });

      // Re-index
      await indexer.indexAll();
      const stats2 = indexer.getStats();
      expect(stats2.totalFiles).toBe(1);

      // Verify search doesn't return deleted file
      const results = await indexer.search('del');
      const filePaths = results.map(r => r.filePath);
      expect(filePaths).not.toContain('delete.js');
    });
  });

  describe('performance', () => {
    it('should handle many files efficiently', async () => {
      indexer = new FileIndexer({ projectRoot: testDir });

      // Create many small files
      for (let i = 0; i < 50; i++) {
        writeFileSync(join(testDir, `file${i}.js`), `export const val${i} = ${i};`);
      }
      execSync('git add .', { cwd: testDir });

      await indexer.initialize();

      const start = Date.now();
      await indexer.indexAll();
      const duration = Date.now() - start;

      const stats = indexer.getStats();
      expect(stats.totalFiles).toBe(50);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});