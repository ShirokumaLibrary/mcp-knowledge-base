/**
 * @ai-context Unit tests for CurrentStateHandlers
 * @ai-pattern Test file-based state operations
 */

import { CurrentStateHandlers } from './current-state-handlers.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import type { ToolResponse } from '../types/mcp-types.js';

// Mock logger to prevent errors in test
jest.mock('../utils/logger.js', () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('CurrentStateHandlers', () => {
  let handlers: CurrentStateHandlers;
  let testDir: string;
  let filePath: string;

  beforeEach(async () => {
    // Create temporary directory for testing
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'current-state-test-'));
    filePath = path.join(testDir, 'current_state.md');
    handlers = new CurrentStateHandlers(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('handleGetCurrentState', () => {
    it('should return empty string when file does not exist', async () => {
      const result: ToolResponse = await handlers.handleGetCurrentState();

      // Parse the JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.content).toBe('');
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.type).toBe('current_state');
    });

    it('should return file content when file exists', async () => {
      const testContent = 'Test state content';
      await fs.writeFile(filePath, testContent, 'utf-8');

      const result: ToolResponse = await handlers.handleGetCurrentState();

      // Parse the JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.content).toBe(testContent);
      expect(parsed.metadata).toBeDefined();
    });

    it('should parse YAML frontmatter when reading', async () => {
      const yamlContent = `---
title: Test State
type: current_state
priority: high
tags:
  - test
  - state
related:
  - issues-1
  - docs-2
updated_by: test-user
---

This is the actual content`;

      await fs.writeFile(filePath, yamlContent, 'utf-8');

      const result: ToolResponse = await handlers.handleGetCurrentState();

      // Parse the JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.content).toBe('This is the actual content');
      expect(parsed.metadata.related).toEqual(['issues-1', 'docs-2']);
      expect(parsed.metadata.tags).toContain('test');
      expect(parsed.metadata.updated_by).toBe('test-user');
    });

    it('should handle file read errors gracefully', async () => {
      // Make directory unreadable (simulate permission error)
      await fs.chmod(testDir, 0o000);

      try {
        await handlers.handleGetCurrentState();
        // Should not reach here
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect((error as McpError).message).toContain('Failed to read current state');
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(testDir, 0o755);
      }
    });
  });

  describe('handleUpdateCurrentState', () => {
    it('should create file with content when it does not exist', async () => {
      const newContent = 'New state content';

      const result: ToolResponse = await handlers.handleUpdateCurrentState({
        content: newContent
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      });

      // Verify file was created with frontmatter
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toContain('---');
      expect(fileContent).toContain(newContent);
      expect(fileContent).toContain('type: current_state');
    });

    it('should overwrite existing file content', async () => {
      // Create initial file
      await fs.writeFile(filePath, 'Old content', 'utf-8');

      const newContent = 'Updated state content';
      const result: ToolResponse = await handlers.handleUpdateCurrentState({
        content: newContent
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      });

      // Verify file was updated with frontmatter
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toContain('---');
      expect(fileContent).toContain(newContent);
      expect(fileContent).toContain('type: current_state');
    });

    it('should handle empty content', async () => {
      const result: ToolResponse = await handlers.handleUpdateCurrentState({
        content: ''
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      });

      // Verify file was created with frontmatter and empty content
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toContain('---');
      expect(fileContent).toContain('type: current_state');
      // Empty content means only frontmatter is present
    });

    it('should validate parameters', async () => {
      try {
        // Pass invalid parameters (missing content)
        await handlers.handleUpdateCurrentState({} as { content: string });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle file write errors gracefully', async () => {
      // Make directory unwritable
      await fs.chmod(testDir, 0o444);

      try {
        await handlers.handleUpdateCurrentState({
          content: 'Test content'
        });
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect((error as McpError).message).toContain('Failed to update current state');
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(testDir, 0o755);
      }
    });

    it('should handle metadata fields', async () => {
      const result: ToolResponse = await handlers.handleUpdateCurrentState({
        content: 'Test content',
        related: ['issues-1', 'docs-2'],
        tags: ['important', 'milestone'],
        updated_by: 'test-user'
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      });

      // Verify file includes metadata in JSON array format
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toContain('related: ["issues-1","docs-2"]');
      expect(fileContent).toContain('tags: ["important","milestone"]');
      expect(fileContent).toContain('updated_by: test-user');
    });

    it('should create directory if it does not exist', async () => {
      // Use a nested path that doesn't exist
      const nestedDir = path.join(testDir, 'nested', 'path');
      const nestedHandlers = new CurrentStateHandlers(nestedDir);

      const result: ToolResponse = await nestedHandlers.handleUpdateCurrentState({
        content: 'Test content in nested directory'
      });

      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      });

      // Verify file was created in nested directory with frontmatter
      const nestedFilePath = path.join(nestedDir, 'current_state.md');
      const fileContent = await fs.readFile(nestedFilePath, 'utf-8');
      expect(fileContent).toContain('---');
      expect(fileContent).toContain('Test content in nested directory');
      expect(fileContent).toContain('type: current_state');
    });
  });
});