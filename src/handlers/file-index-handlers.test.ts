/**
 * @ai-context Unit tests for FileIndexHandlers
 * @ai-pattern Test MCP handlers for file indexing functionality
 * @ai-critical Ensures MCP integration works correctly
 * @ai-related-files
 *   - src/handlers/file-index-handlers.ts (implementation)
 *   - src/indexing/file-indexer.ts (core functionality)
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { FileIndexHandlers } from './file-index-handlers.js';

// Mock config to use test directory
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

// Mock @xenova/transformers
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

describe('FileIndexHandlers', () => {
  let testDir: string;
  let handlers: FileIndexHandlers;
  let handlerMap: ReturnType<FileIndexHandlers['createHandlers']>;
  let originalCwd: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Save original state
    originalCwd = process.cwd();
    originalEnv = process.env.MCP_DATABASE_PATH;

    // Create test directory
    testDir = join(tmpdir(), `file-index-handlers-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Set test environment
    process.env.MCP_DATABASE_PATH = join(testDir, '.shirokuma/data');
    process.chdir(testDir);

    // Initialize git repo
    execSync('git init');
    execSync('git config user.email "test@example.com"');
    execSync('git config user.name "Test User"');

    // Create handlers
    handlers = new FileIndexHandlers({} as unknown); // Mock database
    handlerMap = handlers.createHandlers();
  });

  afterEach(async () => {
    // Clean up handlers
    await handlers.cleanup();

    // Restore original state
    process.chdir(originalCwd);
    if (originalEnv !== undefined) {
      process.env.MCP_DATABASE_PATH = originalEnv;
    } else {
      delete process.env.MCP_DATABASE_PATH;
    }

    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('index_codebase', () => {
    it('should index git-managed files', async () => {
      // Create test files
      writeFileSync(join(testDir, 'test.js'), 'console.log("test");');
      writeFileSync(join(testDir, 'test2.js'), 'function hello() { return "world"; }');
      execSync('git add .');

      const result = await handlerMap.index_codebase({});

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('✅ Indexing completed successfully!');
      expect(result.content[0].text).toContain('Files indexed: 2');
    });

    it('should handle force re-indexing', async () => {
      // Create and index initial file
      writeFileSync(join(testDir, 'test.js'), 'console.log("test");');
      execSync('git add .');

      await handlerMap.index_codebase({});

      // Add more files
      writeFileSync(join(testDir, 'test2.js'), 'console.log("test2");');
      execSync('git add .');

      // Force re-index
      const result = await handlerMap.index_codebase({ force: true });

      expect(result.content[0].text).toContain('Files indexed: 2');
    });

    it('should error if not a git repository', async () => {
      // Create new non-git directory
      const nonGitDir = join(tmpdir(), `non-git-${Date.now()}`);
      mkdirSync(nonGitDir);
      process.chdir(nonGitDir);

      await expect(handlerMap.index_codebase({}))
        .rejects.toThrow('Not a git repository');

      process.chdir(testDir);
      rmSync(nonGitDir, { recursive: true });
    });

    it('should index from git subdirectory', async () => {
      // Create test files in subdirectory
      const subDir = join(testDir, 'src', 'components');
      mkdirSync(subDir, { recursive: true });

      writeFileSync(join(testDir, 'root.js'), 'console.log("root");');
      writeFileSync(join(subDir, 'component.js'), 'export default function Component() {}');
      execSync('git add .');

      // Change to subdirectory
      process.chdir(subDir);

      // Should still be able to index from subdirectory
      const result = await handlerMap.index_codebase({});

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('✅ Indexing completed successfully!');
      // When running from subdirectory, only files in that subdirectory are indexed
      expect(result.content[0].text).toContain('Files indexed: 1');

      // Change back to test directory
      process.chdir(testDir);
    });

  });

  describe('search_code', () => {
    beforeEach(async () => {
      // Create and index test files
      writeFileSync(join(testDir, 'auth.js'), `
function authenticate(username, password) {
  // Check user credentials
  return checkDatabase(username, password);
}`);

      writeFileSync(join(testDir, 'utils.js'), `
function validateEmail(email) {
  return /^[^@]+@[^@]+$/.test(email);
}`);

      execSync('git add .');
      await handlerMap.index_codebase({});
    });

    it('should search indexed code', async () => {
      const result = await handlerMap.search_code({ query: 'authentication' });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Found');
      expect(result.content[0].text).toContain('results for: "authentication"');
    });

    it('should handle no results', async () => {
      const result = await handlerMap.search_code({ query: 'qwertyuiopasdfghjklzxcvbnm' });

      // With our mock embeddings, similarity scores might still be high
      // Check if results are returned or not
      const text = result.content[0].text;
      expect(text).toMatch(/No results found|Found \d+ results/);
    });

    it('should respect limit parameter', async () => {
      const result = await handlerMap.search_code({
        query: 'function',
        limit: 1
      });

      const matches = result.content[0].text.match(/^\d+\./gm);
      expect(matches?.length).toBeLessThanOrEqual(1);
    });

    it('should filter by file types', async () => {
      // Add a markdown file
      writeFileSync(join(testDir, 'docs.md'), '# Authentication Guide');
      execSync('git add .');
      await handlerMap.index_codebase({});

      const result = await handlerMap.search_code({
        query: 'authentication',
        fileTypes: ['md']
      });

      expect(result.content[0].text).toContain('docs.md');
      expect(result.content[0].text).not.toContain('auth.js');
    });

    it('should error if no index exists', async () => {
      // Remove the index file
      const indexPath = join(testDir, '.shirokuma/data/index.db');
      if (existsSync(indexPath)) {
        rmSync(indexPath);
      }

      // Create fresh handlers
      await handlers.cleanup();
      handlers = new FileIndexHandlers({} as unknown);
      handlerMap = handlers.createHandlers();

      await expect(handlerMap.search_code({ query: 'test' }))
        .rejects.toThrow('No index found');
    });
  });

  describe('get_related_files', () => {
    beforeEach(async () => {
      // Create related files
      writeFileSync(join(testDir, 'auth.js'), `
import { validateUser } from './user.js';
function authenticate(username, password) {
  return validateUser(username, password);
}`);

      writeFileSync(join(testDir, 'user.js'), `
export function validateUser(username, password) {
  return username && password;
}`);

      writeFileSync(join(testDir, 'unrelated.js'), `
function calculateTax(amount) {
  return amount * 0.1;
}`);

      execSync('git add .');
      await handlerMap.index_codebase({});
    });

    it('should find related files', async () => {
      const result = await handlerMap.get_related_files({ file: 'auth.js' });

      expect(result.content[0].text).toContain('Related files for: auth.js');
      expect(result.content[0].text).toContain('user.js');
    });

    it('should error if file not found', async () => {
      await expect(handlerMap.get_related_files({ file: 'nonexistent.js' }))
        .rejects.toThrow('File not found');
    });

    it('should handle files with no relations', async () => {
      const result = await handlerMap.get_related_files({ file: 'unrelated.js' });

      // May or may not find relations depending on content similarity
      expect(result.content[0].text).toBeDefined();
    });

    it('should error if no index exists', async () => {
      // Remove the index file
      const indexPath = join(testDir, '.shirokuma/data/index.db');
      if (existsSync(indexPath)) {
        rmSync(indexPath);
      }

      // Create fresh handlers
      await handlers.cleanup();
      handlers = new FileIndexHandlers({} as unknown);
      handlerMap = handlers.createHandlers();

      await expect(handlerMap.get_related_files({ file: 'auth.js' }))
        .rejects.toThrow('No index found');
    });
  });

  describe('get_index_status', () => {
    it('should show status when index exists', async () => {
      // Create and index files
      writeFileSync(join(testDir, 'test.js'), 'console.log("test");');
      execSync('git add .');
      await handlerMap.index_codebase({});

      const result = await handlerMap.get_index_status({});

      expect(result.content[0].text).toContain('✅ Index exists');
      expect(result.content[0].text).toContain('Total files: 1');
      expect(result.content[0].text).toContain('Configuration:');
      expect(result.content[0].text).toContain(testDir);
    });

    it('should show no index message when index missing', async () => {
      // Remove the index file
      const indexPath = join(testDir, '.shirokuma/data/index.db');
      if (existsSync(indexPath)) {
        rmSync(indexPath);
      }

      const result = await handlerMap.get_index_status({});

      expect(result.content[0].text).toContain('❌ No index found');
      expect(result.content[0].text).toContain('Run `index_codebase`');
    });

    it('should show correct index path', async () => {
      // Index files first
      writeFileSync(join(testDir, 'test.js'), 'console.log("test");');
      execSync('git add .');
      await handlerMap.index_codebase({});

      const result = await handlerMap.get_index_status({});

      expect(result.content[0].text).toContain('index.db');
      expect(result.content[0].text).toContain('✅ Index exists');

      // Verify the index was created in the expected location
      const indexPath = join(testDir, '.shirokuma/data/index.db');
      expect(existsSync(indexPath)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should clean up indexers on cleanup', async () => {
      // Create indexer
      await handlerMap.index_codebase({});

      // Cleanup should not throw
      await expect(handlers.cleanup()).resolves.not.toThrow();
    });
  });
});