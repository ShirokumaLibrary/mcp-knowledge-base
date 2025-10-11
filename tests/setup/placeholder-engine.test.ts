import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlaceholderEngine } from '../../src/setup/placeholder-engine.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync, utimesSync } from 'fs';

describe('PlaceholderEngine', () => {
  describe('constructor', () => {
    it('should create PlaceholderEngine with default MCP name', () => {
      const engine = new PlaceholderEngine('shirokuma-kb', '/home/user/project');
      expect(engine).toBeDefined();
    });

    it('should create PlaceholderEngine with custom MCP name', () => {
      const engine = new PlaceholderEngine('my-kb', '/home/user/project');
      expect(engine).toBeDefined();
    });
  });

  describe('replace', () => {
    it('should replace {{MCP_NAME}} with default mcp prefix', () => {
      const engine = new PlaceholderEngine('shirokuma-kb', '/home/user/project');
      const content = 'allowed-tools:\n  - {{MCP_NAME}}__create_item\n  - {{MCP_NAME}}__get_item';
      const result = engine.replace(content);

      expect(result).toContain('mcp__shirokuma-kb__create_item');
      expect(result).toContain('mcp__shirokuma-kb__get_item');
      expect(result).not.toContain('{{MCP_NAME}}');
    });

    it('should replace {{MCP_NAME}} with custom name', () => {
      const engine = new PlaceholderEngine('my-custom-kb', '/home/user/project');
      const content = 'Tools: {{MCP_NAME}}__search_items';
      const result = engine.replace(content);

      expect(result).toBe('Tools: mcp__my-custom-kb__search_items');
    });

    it('should replace {{WORKSPACE_FOLDER}} with project root path', () => {
      const engine = new PlaceholderEngine('shirokuma-kb', '/home/user/my-project');
      const content = 'Data directory: {{WORKSPACE_FOLDER}}/.shirokuma/data';
      const result = engine.replace(content);

      expect(result).toBe('Data directory: /home/user/my-project/.shirokuma/data');
    });

    it('should replace multiple placeholders in same content', () => {
      const engine = new PlaceholderEngine('test-kb', '/test/path');
      const content = `
Server: {{MCP_NAME}}__server
Path: {{WORKSPACE_FOLDER}}/data
Tool: {{MCP_NAME}}__create_item
Config: {{WORKSPACE_FOLDER}}/.config
`;
      const result = engine.replace(content);

      expect(result).toContain('Server: mcp__test-kb__server');
      expect(result).toContain('Path: /test/path/data');
      expect(result).toContain('Tool: mcp__test-kb__create_item');
      expect(result).toContain('Config: /test/path/.config');
    });

    it('should handle content with no placeholders', () => {
      const engine = new PlaceholderEngine('shirokuma-kb', '/home/user/project');
      const content = 'This is plain text without any placeholders';
      const result = engine.replace(content);

      expect(result).toBe(content);
    });

    it('should replace all occurrences of same placeholder', () => {
      const engine = new PlaceholderEngine('kb', '/project');
      const content = '{{MCP_NAME}} {{MCP_NAME}} {{MCP_NAME}}';
      const result = engine.replace(content);

      expect(result).toBe('mcp__kb mcp__kb mcp__kb');
    });

    it('should handle edge case with empty content', () => {
      const engine = new PlaceholderEngine('shirokuma-kb', '/home/user/project');
      const result = engine.replace('');

      expect(result).toBe('');
    });

    it('should handle Windows-style paths', () => {
      const engine = new PlaceholderEngine('shirokuma-kb', 'C:\\Users\\User\\Project');
      const content = 'Path: {{WORKSPACE_FOLDER}}\\data';
      const result = engine.replace(content);

      expect(result).toBe('Path: C:\\Users\\User\\Project\\data');
    });
  });

  describe('processDirectory', () => {
    let testDir: string;

    beforeEach(() => {
      testDir = join(tmpdir(), `placeholder-test-${Date.now()}`);
      mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
    });

    it('should process all files in directory', async () => {
      const engine = new PlaceholderEngine('test-kb', '/test/project');

      // Create source directory with files
      const sourceDir = join(testDir, 'source');
      mkdirSync(sourceDir, { recursive: true });
      writeFileSync(join(sourceDir, 'file1.md'), 'Tool: {{MCP_NAME}}__create_item');
      writeFileSync(join(sourceDir, 'file2.md'), 'Path: {{WORKSPACE_FOLDER}}/data');

      // Process directory
      const targetDir = join(testDir, 'target');
      const result = await engine.processDirectory(sourceDir, targetDir);

      // Verify results
      expect(result.totalFiles).toBe(2);
      expect(result.processedFiles.length).toBe(2);
      expect(result.skippedFiles.length).toBe(0);

      // Verify file contents
      const file1Content = readFileSync(join(targetDir, 'file1.md'), 'utf-8');
      const file2Content = readFileSync(join(targetDir, 'file2.md'), 'utf-8');

      expect(file1Content).toBe('Tool: mcp__test-kb__create_item');
      expect(file2Content).toBe('Path: /test/project/data');
    });

    it('should process nested directories recursively', async () => {
      const engine = new PlaceholderEngine('kb', '/project');

      // Create nested structure
      const sourceDir = join(testDir, 'source');
      mkdirSync(join(sourceDir, 'subdir'), { recursive: true });
      writeFileSync(join(sourceDir, 'root.md'), '{{MCP_NAME}}');
      writeFileSync(join(sourceDir, 'subdir', 'nested.md'), '{{WORKSPACE_FOLDER}}');

      // Process directory
      const targetDir = join(testDir, 'target');
      const result = await engine.processDirectory(sourceDir, targetDir);

      // Verify results
      expect(result.totalFiles).toBe(2);
      expect(result.processedFiles.length).toBe(2);

      // Verify nested file
      const nestedContent = readFileSync(join(targetDir, 'subdir', 'nested.md'), 'utf-8');
      expect(nestedContent).toBe('/project');
    });

    it('should skip unchanged files in incremental mode', async () => {
      const engine = new PlaceholderEngine('kb', '/project');

      // Create source files
      const sourceDir = join(testDir, 'source');
      mkdirSync(sourceDir, { recursive: true });
      writeFileSync(join(sourceDir, 'file1.md'), '{{MCP_NAME}}');
      writeFileSync(join(sourceDir, 'file2.md'), '{{MCP_NAME}}');

      // First processing
      const targetDir = join(testDir, 'target');
      await engine.processDirectory(sourceDir, targetDir);

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update only file1 (make it newer)
      writeFileSync(join(sourceDir, 'file1.md'), '{{MCP_NAME}} updated');

      // Second processing with incremental mode
      const result = await engine.processDirectory(sourceDir, targetDir, { incremental: true });

      // Verify only file1 was processed
      expect(result.totalFiles).toBe(2);
      expect(result.processedFiles.length).toBe(1);
      expect(result.skippedFiles.length).toBe(1);
      expect(result.processedFiles[0]).toContain('file1.md');
      expect(result.skippedFiles[0]).toContain('file2.md');
    });

    it('should process all files when incremental is false', async () => {
      const engine = new PlaceholderEngine('kb', '/project');

      // Create and process files
      const sourceDir = join(testDir, 'source');
      mkdirSync(sourceDir, { recursive: true });
      writeFileSync(join(sourceDir, 'file.md'), '{{MCP_NAME}}');

      const targetDir = join(testDir, 'target');
      await engine.processDirectory(sourceDir, targetDir);

      // Process again without incremental
      const result = await engine.processDirectory(sourceDir, targetDir, { incremental: false });

      // Should process file even though it's unchanged
      expect(result.processedFiles.length).toBe(1);
      expect(result.skippedFiles.length).toBe(0);
    });

    it('should handle non-existent source directory', async () => {
      const engine = new PlaceholderEngine('kb', '/project');

      const result = await engine.processDirectory(
        '/nonexistent/source',
        join(testDir, 'target')
      );

      expect(result.totalFiles).toBe(0);
      expect(result.processedFiles.length).toBe(0);
      expect(result.skippedFiles.length).toBe(0);
    });

    it('should create target directory if it does not exist', async () => {
      const engine = new PlaceholderEngine('kb', '/project');

      const sourceDir = join(testDir, 'source');
      mkdirSync(sourceDir, { recursive: true });
      writeFileSync(join(sourceDir, 'file.md'), '{{MCP_NAME}}');

      const targetDir = join(testDir, 'new-target');
      await engine.processDirectory(sourceDir, targetDir);

      expect(existsSync(targetDir)).toBe(true);
      expect(existsSync(join(targetDir, 'file.md'))).toBe(true);
    });
  });
});
