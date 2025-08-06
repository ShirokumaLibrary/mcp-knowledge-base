// @ts-nocheck
import { CurrentStateHandlers } from '../handlers/current-state-handlers.js';
import { TagRepository } from '../database/tag-repository.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock the file system
jest.mock('fs/promises');

// Mock logger to prevent errors
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
  let mockTagRepo: jest.Mocked<TagRepository>;
  let mockValidateRelatedItems: jest.Mock;
  const testDataDir = '/test/data';
  const testFilePath = path.join(testDataDir, 'current_state.md');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockTagRepo = {
      ensureTagsExist: jest.fn()
    } as any;
    
    mockValidateRelatedItems = jest.fn().mockResolvedValue([]);
    
    handlers = new CurrentStateHandlers(testDataDir, mockTagRepo, mockValidateRelatedItems);
  });

  describe('handleUpdateCurrentState', () => {
    it('should update current state with content and metadata', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      mockTagRepo.ensureTagsExist.mockResolvedValue(undefined);

      const args = {
        content: '# Project Status\n\nEverything is on track.',
        tags: ['status', 'update'],
        related: ['issues-1', 'docs-2'],
        updated_by: 'test-user'
      };

      mockValidateRelatedItems.mockResolvedValue(['issues-1', 'docs-2']);

      const result = await handlers.handleUpdateCurrentState(args);

      expect(fs.mkdir).toHaveBeenCalledWith(testDataDir, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        testFilePath,
        expect.stringContaining('# Project Status'),
        'utf-8'
      );
      expect(mockTagRepo.ensureTagsExist).toHaveBeenCalledWith(['status', 'update']);
      expect(result.content[0].text).toBe('Current state updated successfully');
    });

    it('should handle update with minimal parameters', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const args = {
        content: 'Minimal update'
      };

      const result = await handlers.handleUpdateCurrentState(args);

      expect(fs.writeFile).toHaveBeenCalledWith(
        testFilePath,
        expect.stringContaining('Minimal update'),
        'utf-8'
      );
      expect(result.content[0].text).toBe('Current state updated successfully');
    });
  });
});