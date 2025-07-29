import { SessionSearchService } from '../session-search-service.js';
import type { FileIssueDatabase } from '../../database.js';
import type { SessionRepository } from '../../repositories/session-repository.js';

// Mock dependencies
jest.mock('../../database.js');
jest.mock('../../repositories/session-repository.js');

describe('SessionSearchService', () => {
  let service: SessionSearchService;
  let mockDb: jest.Mocked<FileIssueDatabase>;
  let mockRepository: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock database
    mockDb = {
      searchSessions: jest.fn(),
      searchSessionsByTag: jest.fn(),
      searchDailySummaries: jest.fn()
    } as any;
    
    // Create mock repository
    mockRepository = {
      searchSessionsFullText: jest.fn(),
      searchSessionsByTag: jest.fn()
    } as any;
    
    service = new SessionSearchService(mockDb, mockRepository);
  });

  describe('searchSessionsFast', () => {
    it('should search sessions by query using SQLite', async () => {
      const mockResults = [
        {
          id: '2025-01-29-10.00.00.000',
          title: 'Development Session',
          date: '2025-01-29',
          startTime: '10:00:00',
          createdAt: '2025-01-29T10:00:00Z'
        }
      ];

      mockDb.searchSessions.mockResolvedValueOnce(mockResults);

      const results = await service.searchSessionsFast('bug');

      expect(mockDb.searchSessions).toHaveBeenCalledWith('bug');
      expect(results).toEqual(mockResults);
    });

    it('should handle empty search results', async () => {
      mockDb.searchSessions.mockResolvedValueOnce([]);

      const results = await service.searchSessionsFast('nonexistent');

      expect(results).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockDb.searchSessions.mockRejectedValueOnce(new Error('Database error'));

      await expect(service.searchSessionsFast('test')).rejects.toThrow('Database error');
    });
  });

  describe('searchSessionsByTagFast', () => {
    it('should search sessions by tag using SQLite', async () => {
      const mockResults = [
        {
          id: '2025-01-15-10.00.00.000',
          title: 'Tagged Session',
          tags: ['work', 'important'],
          date: '2025-01-15',
          createdAt: '2025-01-15T10:00:00Z'
        }
      ];

      mockDb.searchSessionsByTag.mockResolvedValueOnce(mockResults);

      const results = await service.searchSessionsByTagFast('work');

      expect(mockDb.searchSessionsByTag).toHaveBeenCalledWith('work');
      expect(results).toHaveLength(1);
    });
  });

  describe('searchSessionsDetailed', () => {
    it('should search sessions by reading files', async () => {
      const mockResults = [
        {
          id: '2025-01-29-10.00.00.000',
          title: 'Detailed Session',
          content: 'Full content from file',
          date: '2025-01-29',
          createdAt: '2025-01-29T10:00:00Z'
        }
      ];

      mockRepository.searchSessionsFullText.mockResolvedValueOnce(mockResults);

      const results = await service.searchSessionsDetailed('query');

      expect(mockRepository.searchSessionsFullText).toHaveBeenCalledWith('query');
      expect(results).toEqual(mockResults);
    });
  });

  describe('searchSessionsByTagDetailed', () => {
    it('should search sessions by tag using file scan', async () => {
      const mockResults = [
        {
          id: '2025-01-29-10.00.00.000',
          title: 'Session with tag',
          tags: ['target-tag'],
          date: '2025-01-29',
          createdAt: '2025-01-29T10:00:00Z'
        }
      ];

      mockRepository.searchSessionsByTag.mockResolvedValueOnce(mockResults);

      const results = await service.searchSessionsByTagDetailed('target-tag');

      expect(mockRepository.searchSessionsByTag).toHaveBeenCalledWith('target-tag');
      expect(results).toEqual(mockResults);
    });
  });

  describe('searchDailySummariesFast', () => {
    it('should search daily summaries using SQLite', async () => {
      const mockResults = [
        {
          id: '2025-01-29',
          date: '2025-01-29',
          title: 'Daily Summary',
          content: 'Summary content',
          tags: [],
          createdAt: '2025-01-29T23:59:59Z'
        }
      ];

      mockDb.searchDailySummaries.mockResolvedValueOnce(mockResults);

      const results = await service.searchDailySummariesFast('summary');

      expect(mockDb.searchDailySummaries).toHaveBeenCalledWith('summary');
      expect(results).toEqual(mockResults);
    });
  });
});