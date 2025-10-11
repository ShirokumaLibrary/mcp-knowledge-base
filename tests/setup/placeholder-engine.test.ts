import { describe, it, expect } from 'vitest';
import { PlaceholderEngine } from '../../src/setup/placeholder-engine.js';

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
});
