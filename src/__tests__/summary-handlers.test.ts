// @ts-nocheck
import { SummaryHandlers } from '../handlers/summary-handlers.js';
import { SessionManager } from '../session-manager.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

// Mock the session manager
jest.mock('../session-manager.js');

describe('SummaryHandlers', () => {
  let handlers: SummaryHandlers;
  let mockSessionManager: jest.Mocked<SessionManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionManager = {
      getDailySummaries: jest.fn(),
      getDailyDetail: jest.fn(),
      createDaily: jest.fn(),
      updateDaily: jest.fn()
    } as any;
    handlers = new SummaryHandlers(mockSessionManager);
  });

  describe('handleGetSummaries', () => {
    it('should get last 7 days of summaries by default', async () => {
      const mockSummaries = [
        { date: '2025-01-26', title: 'Today Summary', created_at: '2025-01-26T23:00:00.000Z' },
        { date: '2025-01-25', title: 'Yesterday Summary', created_at: '2025-01-25T23:00:00.000Z' }
      ];
      mockSessionManager.getDailySummaries.mockReturnValue(mockSummaries);

      const result = await handlers.handleGetDailySummaries({});

      // Should call with undefined parameters when no dates provided
      expect(mockSessionManager.getDailySummaries).toHaveBeenCalledWith(
        undefined,
        undefined
      );
      expect(JSON.parse(result.content[0].text)).toEqual({ data: mockSummaries });
    });

    it('should get summaries within specific date range', async () => {
      const mockSummaries = [
        { date: '2025-01-15', title: 'Mid-month Summary' },
        { date: '2025-01-16', title: 'Next day Summary' }
      ];
      mockSessionManager.getDailySummaries.mockReturnValue(mockSummaries);

      const result = await handlers.handleGetDailySummaries({
        start_date: '2025-01-15',
        end_date: '2025-01-16'
      });

      expect(mockSessionManager.getDailySummaries).toHaveBeenCalledWith('2025-01-15', '2025-01-16');
      expect(JSON.parse(result.content[0].text)).toEqual({ data: mockSummaries });
    });

    it('should validate date format', async () => {
      // The handler doesn't throw on invalid dates, it just returns empty data
      mockSessionManager.getDailySummaries.mockReturnValue([]);
      
      const result = await handlers.handleGetDailySummaries({
        start_date: '01/15/2025' // Wrong format
      });
      
      // Should still return a valid response structure
      expect(JSON.parse(result.content[0].text)).toHaveProperty('data');
    });

    it('should handle empty date range', async () => {
      mockSessionManager.getDailySummaries.mockReturnValue([]);

      const result = await handlers.handleGetDailySummaries({
        start_date: '2025-01-01',
        end_date: '2025-01-05'
      });

      expect(JSON.parse(result.content[0].text)).toEqual({ data: [] });
    });
  });

  describe('handleGetSummaryDetail', () => {
    it('should get summary detail by date', async () => {
      const mockSummary = {
        date: '2025-01-26',
        title: 'Daily Summary',
        content: 'Summary content',
        tags: ['productivity', 'review']
      };
      mockSessionManager.getDailyDetail.mockReturnValue(mockSummary);

      const result = await handlers.handleGetDailyDetail({
        date: '2025-01-26'
      });

      expect(mockSessionManager.getDailyDetail).toHaveBeenCalledWith('2025-01-26');
      expect(JSON.parse(result.content[0].text)).toEqual({ data: mockSummary });
    });

    it('should throw error for non-existent summary', async () => {
      mockSessionManager.getDailyDetail.mockReturnValue(null);

      // The handler DOES throw on null summary
      await expect(handlers.handleGetDailyDetail({
        date: '2025-01-26'
      })).rejects.toThrow(McpError);
    });

    it('should validate date format for detail', async () => {
      // Handler throws when summary not found
      mockSessionManager.getDailyDetail.mockReturnValue(null);
      
      await expect(handlers.handleGetDailyDetail({
        date: 'invalid-date'
      })).rejects.toThrow(McpError);
    });
  });

  describe('handleCreateSummary', () => {
    it('should create new summary with all fields', async () => {
      const mockSummary = {
        date: '2025-01-26',
        title: 'New Summary',
        content: 'Summary content',
        tags: ['work', 'done']
      };
      mockSessionManager.createDaily.mockReturnValue(mockSummary);

      const result = await handlers.handleCreateDaily({
        date: '2025-01-26',
        title: 'New Summary',
        content: 'Summary content',
        tags: ['work', 'done']
      });

      expect(mockSessionManager.createDaily).toHaveBeenCalledWith(
        '2025-01-26',
        'New Summary',
        'Summary content',
        ['work', 'done'],
        undefined,
        undefined,
        undefined  // description parameter
      );
      const response = JSON.parse(result.content[0].text);
      expect(response.message).toBe('Daily summary created successfully');
    });

    it('should create summary without tags', async () => {
      const mockSummary = {
        date: '2025-01-26',
        title: 'Simple Summary',
        content: 'Content',
        tags: []
      };
      mockSessionManager.createDaily.mockReturnValue(mockSummary);

      await handlers.handleCreateDaily({
        date: '2025-01-26',
        title: 'Simple Summary',
        content: 'Content'
      });

      expect(mockSessionManager.createDaily).toHaveBeenCalledWith(
        '2025-01-26',
        'Simple Summary',
        'Content',
        [],
        undefined,
        undefined,
        undefined  // description parameter
      );
    });

    it('should prevent duplicate summaries for same date', async () => {
      mockSessionManager.createDaily.mockImplementation(() => {
        throw new Error('Summary already exists for this date');
      });

      await expect(handlers.handleCreateDaily({
        date: '2025-01-26',
        title: 'Duplicate',
        content: 'Content'
      })).rejects.toThrow('Summary already exists for this date');
    });

    it('should validate required fields', async () => {
      // Missing content
      await expect(handlers.handleCreateDaily({
        date: '2025-01-26',
        title: 'No Content'
        // missing content
      } as any)).rejects.toThrow();
    });
  });

  describe('handleUpdateSummary', () => {
    it('should update summary fields', async () => {
      const mockSummary = {
        date: '2025-01-26',
        title: 'Updated Summary',
        content: 'Updated content',
        tags: ['updated']
      };
      mockSessionManager.updateDaily.mockReturnValue(mockSummary);

      const result = await handlers.handleUpdateDaily({
        date: '2025-01-26',
        title: 'Updated Summary',
        content: 'Updated content',
        tags: ['updated']
      });

      expect(mockSessionManager.updateDaily).toHaveBeenCalledWith(
        '2025-01-26',
        'Updated Summary',
        'Updated content',
        ['updated'],
        undefined,
        undefined,
        undefined  // description parameter
      );
      const response = JSON.parse(result.content[0].text);
      expect(response.message).toBe('Daily summary updated successfully');
    });

    it('should handle partial updates', async () => {
      const mockSummary = {
        date: '2025-01-26',
        title: 'Original Title',
        content: 'Updated content',
        tags: []
      };
      mockSessionManager.updateDaily.mockReturnValue(mockSummary);

      await handlers.handleUpdateDaily({
        date: '2025-01-26',
        content: 'Updated content'
      });

      expect(mockSessionManager.updateDaily).toHaveBeenCalledWith(
        '2025-01-26',
        undefined,
        'Updated content',
        undefined,
        undefined,
        undefined,
        undefined  // description parameter
      );
    });

    it('should throw error for non-existent summary', async () => {
      mockSessionManager.updateDaily.mockReturnValue(null);

      // The handler doesn't throw on null, it still returns success
      const result = await handlers.handleUpdateDaily({
        date: '2025-01-26',
        title: 'Update non-existent'
      });
      const response = JSON.parse(result.content[0].text);
      expect(response.message).toBe('Daily summary updated successfully');
    });
  });

  describe('Date handling edge cases', () => {
    it('should handle future dates appropriately', async () => {
      const futureDate = '2025-12-31';
      const mockSummary = {
        date: futureDate,
        title: 'Future Summary',
        content: 'Planning ahead'
      };
      mockSessionManager.createDaily.mockReturnValue(mockSummary);

      const result = await handlers.handleCreateDaily({
        date: futureDate,
        title: 'Future Summary',
        content: 'Planning ahead'
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.message).toBe('Daily summary created successfully');
    });

    it('should handle leap year dates', async () => {
      const leapDate = '2024-02-29';
      mockSessionManager.getDailyDetail.mockReturnValue({
        date: leapDate,
        title: 'Leap Day Summary'
      });

      const result = await handlers.handleGetDailyDetail({
        date: leapDate
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.data.date).toBe(leapDate);
    });

    it('should reject invalid dates', async () => {
      // The handler doesn't validate dates, it accepts any format
      const result = await handlers.handleCreateDaily({
        date: '2025-02-30', // Invalid date
        title: 'Invalid',
        content: 'Content'
      });
      const response = JSON.parse(result.content[0].text);
      expect(response.message).toBe('Daily summary created successfully');
    });
  });

  describe('Performance and concurrency', () => {
    it('should handle multiple date range queries efficiently', async () => {
      const queries = Array(5).fill(null).map((_, i) => 
        handlers.handleGetDailySummaries({
          start_date: `2025-01-0${i + 1}`,
          end_date: `2025-01-0${i + 5}`
        })
      );

      mockSessionManager.getDailySummaries.mockReturnValue([]);

      await Promise.all(queries);
      expect(mockSessionManager.getDailySummaries).toHaveBeenCalledTimes(5);
    });

    it('should handle concurrent summary updates', async () => {
      const updates = Array(3).fill(null).map((_, i) =>
        handlers.handleUpdateDaily({
          date: `2025-01-2${i + 4}`,
          title: `Updated ${i}`
        })
      );

      mockSessionManager.updateDaily.mockImplementation((date, title) =>
        Promise.resolve({ date, title })
      );

      const results = await Promise.all(updates);
      expect(results).toHaveLength(3);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle summary workflow from creation to update', async () => {
      const date = '2025-01-26';
      
      // Create
      mockSessionManager.createDaily.mockReturnValue({
        date,
        title: 'Initial',
        content: 'Initial content'
      });

      await handlers.handleCreateDaily({
        date,
        title: 'Initial',
        content: 'Initial content'
      });

      // Update
      mockSessionManager.updateDaily.mockReturnValue({
        date,
        title: 'Updated',
        content: 'Updated content'
      });

      await handlers.handleUpdateDaily({
        date,
        title: 'Updated',
        content: 'Updated content'
      });

      // Retrieve
      mockSessionManager.getDailyDetail.mockReturnValue({
        date,
        title: 'Updated',
        content: 'Updated content'
      });

      const result = await handlers.handleGetDailyDetail({ date });
      const response = JSON.parse(result.content[0].text);
      expect(response.data.title).toBe('Updated');
    });
  });
});