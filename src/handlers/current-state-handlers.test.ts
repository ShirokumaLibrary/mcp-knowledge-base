/**
 * @ai-context Unit tests for CurrentStateHandlers
 * @ai-pattern Test file-based state operations
 */

// @ts-nocheck
import { CurrentStateHandlers } from './current-state-handlers.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

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
      const result = await handlers.handleGetCurrentState();
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: ''
        }]
      });
    });

    it('should return file content when file exists', async () => {
      const testContent = 'Test state content';
      await fs.writeFile(filePath, testContent, 'utf-8');
      
      const result = await handlers.handleGetCurrentState();
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: testContent
        }]
      });
    });

    it('should handle file read errors gracefully', async () => {
      // Make directory unreadable (simulate permission error)
      await fs.chmod(testDir, 0o000);
      
      try {
        await handlers.handleGetCurrentState();
        // Should not reach here
        expect.fail('Should have thrown an error');
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
      
      const result = await handlers.handleUpdateCurrentState({
        content: newContent
      });
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      });
      
      // Verify file was created
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toBe(newContent);
    });

    it('should overwrite existing file content', async () => {
      // Create initial file
      await fs.writeFile(filePath, 'Old content', 'utf-8');
      
      const newContent = 'Updated state content';
      const result = await handlers.handleUpdateCurrentState({
        content: newContent
      });
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      });
      
      // Verify file was updated
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toBe(newContent);
    });

    it('should handle empty content', async () => {
      const result = await handlers.handleUpdateCurrentState({
        content: ''
      });
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      });
      
      // Verify empty file was created
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toBe('');
    });

    it('should validate parameters', async () => {
      try {
        // Pass invalid parameters (missing content)
        await handlers.handleUpdateCurrentState({});
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
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect((error as McpError).message).toContain('Failed to update current state');
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(testDir, 0o755);
      }
    });

    it('should create directory if it does not exist', async () => {
      // Use a nested path that doesn't exist
      const nestedDir = path.join(testDir, 'nested', 'path');
      const nestedHandlers = new CurrentStateHandlers(nestedDir);
      
      const result = await nestedHandlers.handleUpdateCurrentState({
        content: 'Test content in nested directory'
      });
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Current state updated successfully'
        }]
      });
      
      // Verify file was created in nested directory
      const nestedFilePath = path.join(nestedDir, 'current_state.md');
      const fileContent = await fs.readFile(nestedFilePath, 'utf-8');
      expect(fileContent).toBe('Test content in nested directory');
    });
  });
});