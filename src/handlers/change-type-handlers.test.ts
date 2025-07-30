import { ChangeTypeHandlers } from './change-type-handlers.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { ItemRepository } from '../repositories/item-repository.js';
import type { FileIssueDatabase } from '../database/index.js';

describe('ChangeTypeHandlers', () => {
  let handlers: ChangeTypeHandlers;
  let mockItemRepo: Partial<ItemRepository>;
  let mockDatabase: Partial<FileIssueDatabase>;

  beforeEach(() => {
    mockItemRepo = {
      changeItemType: jest.fn()
    };

    mockDatabase = {
      getItemRepository: jest.fn().mockReturnValue(mockItemRepo)
    };

    handlers = new ChangeTypeHandlers(mockDatabase as FileIssueDatabase);
  });

  describe('handleChangeItemType', () => {
    it('should successfully change item type without references', async () => {
      const params = {
        from_type: 'issues',
        from_id: 1,
        to_type: 'bugs'
      };

      (mockItemRepo.changeItemType as jest.Mock).mockResolvedValue({
        success: true,
        newId: 5,
        relatedUpdates: 0
      });

      const result = await handlers.handleChangeItemType(params);

      expect(mockItemRepo.changeItemType).toHaveBeenCalledWith('issues', 1, 'bugs');
      expect(result.content[0]).toEqual({
        type: 'text',
        text: expect.stringContaining('Type Change Successful')
      });
      expect(result.content[0].text).toContain('From: issues-1');
      expect(result.content[0].text).toContain('To: bugs-5');
      expect(result.content[0].text).not.toContain('Related items updated');
    });

    it('should successfully change item type with reference updates', async () => {
      const params = {
        from_type: 'issues',
        from_id: 2,
        to_type: 'bugs'
      };

      (mockItemRepo.changeItemType as jest.Mock).mockResolvedValue({
        success: true,
        newId: 3,
        relatedUpdates: 5
      });

      const result = await handlers.handleChangeItemType(params);

      expect(result.content[0].text).toContain('Related items updated: 5');
    });

    it('should handle type change failure - different base types', async () => {
      const params = {
        from_type: 'issues',
        from_id: 1,
        to_type: 'docs'
      };

      (mockItemRepo.changeItemType as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Cannot change between different base types: tasks → documents'
      });

      await expect(handlers.handleChangeItemType(params)).rejects.toThrow(McpError);
      
      try {
        await handlers.handleChangeItemType(params);
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect((error as McpError).code).toBe(ErrorCode.InvalidRequest);
        expect((error as McpError).message).toContain('Cannot change between different base types');
      }
    });

    it('should handle type change failure - special types', async () => {
      const params = {
        from_type: 'sessions',
        from_id: 1,
        to_type: 'issues'
      };

      (mockItemRepo.changeItemType as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Sessions and dailies cannot be type-changed'
      });

      await expect(handlers.handleChangeItemType(params)).rejects.toThrow(McpError);
    });

    it('should handle type change failure - item not found', async () => {
      const params = {
        from_type: 'issues',
        from_id: 9999,
        to_type: 'bugs'
      };

      (mockItemRepo.changeItemType as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Item not found'
      });

      await expect(handlers.handleChangeItemType(params)).rejects.toThrow(McpError);
    });

    it('should validate required parameters', async () => {
      // Missing from_type
      await expect(handlers.handleChangeItemType({
        from_id: 1,
        to_type: 'bugs'
      } as any)).rejects.toThrow();

      // Missing from_id
      await expect(handlers.handleChangeItemType({
        from_type: 'issues',
        to_type: 'bugs'
      } as any)).rejects.toThrow();

      // Missing to_type
      await expect(handlers.handleChangeItemType({
        from_type: 'issues',
        from_id: 1
      } as any)).rejects.toThrow();
    });

    it('should handle repository errors gracefully', async () => {
      const params = {
        from_type: 'issues',
        from_id: 1,
        to_type: 'bugs'
      };

      (mockItemRepo.changeItemType as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(handlers.handleChangeItemType(params)).rejects.toThrow(McpError);
      
      try {
        await handlers.handleChangeItemType(params);
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect((error as McpError).code).toBe(ErrorCode.InternalError);
        expect((error as McpError).message).toContain('Failed to change item type');
      }
    });
  });
});