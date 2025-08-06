// @ts-nocheck
import { SessionHandlers } from '../handlers/session-handlers.js';
import { SessionManager } from '../session-manager.js';
import { McpError } from '@modelcontextprotocol/sdk/types.js';

// Mock the session manager
jest.mock('../session-manager.js');

describe('SessionHandlers', () => {
  let handlers: SessionHandlers;
  let mockSessionManager: jest.Mocked<SessionManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionManager = {
      getSessions: jest.fn(),
      getSessionDetail: jest.fn(),
      getLatestSession: jest.fn(),
      createSession: jest.fn(),
      updateSession: jest.fn(),
      searchSessionsByTag: jest.fn()
    } as any;
    handlers = new SessionHandlers(mockSessionManager);
  });

  describe('handleGetSessions', () => {
    it('should get today\'s sessions by default', async () => {
      const mockSessions = [
        { id: '2025-01-26-12.00.00.000', title: 'Session 1', created_at: '2025-01-26T12:00:00.000Z' },
        { id: '2025-01-26-14.00.00.000', title: 'Session 2', created_at: '2025-01-26T14:00:00.000Z' }
      ];
      mockSessionManager.getSessions.mockReturnValue(mockSessions);

      const result = await handlers.handleGetSessions({});

      // Should call getSessions but with undefined params when none provided
      expect(mockSessionManager.getSessions).toHaveBeenCalledWith(
        undefined,
        undefined
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual(mockSessions);
    });

    it('should get sessions within date range', async () => {
      const mockSessions = [
        { id: '2025-01-01-12.00.00.000', title: 'Session 1', created_at: '2025-01-01T12:00:00.000Z' },
        { id: '2025-01-02-14.00.00.000', title: 'Session 2', created_at: '2025-01-02T14:00:00.000Z' }
      ];
      mockSessionManager.getSessions.mockReturnValue(mockSessions);

      const result = await handlers.handleGetSessions({
        start_date: '2025-01-01',
        end_date: '2025-01-02'
      });

      expect(mockSessionManager.getSessions).toHaveBeenCalledWith('2025-01-01', '2025-01-02');
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual(mockSessions);
    });

    it('should handle invalid date format', async () => {
      // Handler doesn't validate date format, it passes through
      mockSessionManager.getSessions.mockReturnValue([]);
      
      const result = await handlers.handleGetSessions({
        start_date: '2025/01/01'
      });
      
      expect(mockSessionManager.getSessions).toHaveBeenCalledWith('2025/01/01', undefined);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual([]);
    });
  });

  describe('handleGetSessionDetail', () => {
    it('should get session detail by ID', async () => {
      const mockSession = {
        id: '2025-01-26-12.00.00.000',
        title: 'Session Detail',
        content: 'Session content',
        tags: ['work', 'development']
      };
      mockSessionManager.getSessionDetail.mockReturnValue(mockSession);

      const result = await handlers.handleGetSessionDetail({
        id: '2025-01-26-12.00.00.000'
      });

      expect(mockSessionManager.getSessionDetail).toHaveBeenCalledWith('2025-01-26-12.00.00.000');
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual(mockSession);
    });

    it('should throw error for non-existent session', async () => {
      mockSessionManager.getSessionDetail.mockReturnValue(null);

      await expect(handlers.handleGetSessionDetail({
        id: 'nonexistent'
      })).rejects.toThrow(McpError);
    });
  });

  describe('handleGetLatestSession', () => {
    it('should get the latest session for today', async () => {
      const mockSession = {
        id: '2025-01-26-16.00.00.000',
        title: 'Latest Session',
        created_at: '2025-01-26T16:00:00.000Z'
      };
      mockSessionManager.getLatestSession.mockReturnValue(mockSession);

      const result = await handlers.handleGetLatestSession({});

      expect(mockSessionManager.getLatestSession).toHaveBeenCalled();
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual(mockSession);
    });

    it('should return null when no sessions exist today', async () => {
      mockSessionManager.getLatestSession.mockReturnValue(null);

      const result = await handlers.handleGetLatestSession({});
      
      expect(result.content[0].text).toContain('"data":null');
    });
  });

  describe('handleCreateSession', () => {
    it('should create new session with required fields', async () => {
      const mockSession = {
        id: '2025-01-26-17.00.00.000',
        title: 'New Session',
        content: 'Session content',
        tags: []
      };
      mockSessionManager.createSession.mockReturnValue(mockSession);

      const result = await handlers.handleCreateSession({
        title: 'New Session'
      });

      expect(mockSessionManager.createSession).toHaveBeenCalledWith(
        'New Session',
        undefined,
        [],  // Default empty array for tags
        undefined,
        undefined,  // datetime parameter
        undefined,
        undefined  // description parameter
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual(mockSession);
    });

    it('should create session with custom ID', async () => {
      const mockSession = {
        id: '2025-01-26-17.00.00.000',
        title: 'Session with ID',
        content: 'Content'
      };
      mockSessionManager.createSession.mockReturnValue(mockSession);

      const result = await handlers.handleCreateSession({
        id: '2025-01-26-17.00.00.000',
        title: 'Session with ID',
        content: 'Content'
      });

      expect(mockSessionManager.createSession).toHaveBeenCalledWith(
        'Session with ID',
        'Content',
        [],  // Default empty array for tags
        '2025-01-26-17.00.00.000',
        undefined,  // datetime parameter
        undefined,
        undefined  // description parameter
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual(mockSession);
    });

    it('should handle session with tags', async () => {
      const mockSession = {
        id: '2025-01-26-18.00.00.000',
        title: 'Tagged Session',
        tags: ['work', 'important']
      };
      mockSessionManager.createSession.mockReturnValue(mockSession);

      await handlers.handleCreateSession({
        title: 'Tagged Session',
        tags: ['work', 'important']
      });

      expect(mockSessionManager.createSession).toHaveBeenCalledWith(
        'Tagged Session',
        undefined,
        ['work', 'important'],
        undefined,
        undefined,  // datetime parameter
        undefined,
        undefined  // description parameter
      );
    });

    it('should create session with custom datetime', async () => {
      const customDatetime = '2024-12-01T10:30:00.000Z';
      const mockSession = {
        id: '2024-12-01-10.30.00.000',
        title: 'Past Session',
        content: 'Historical data migration',
        datetime: customDatetime
      };
      mockSessionManager.createSession.mockReturnValue(mockSession);

      const result = await handlers.handleCreateSession({
        title: 'Past Session',
        content: 'Historical data migration',
        datetime: customDatetime
      });

      expect(mockSessionManager.createSession).toHaveBeenCalledWith(
        'Past Session',
        'Historical data migration',
        [],  // Default empty array for tags
        undefined,
        customDatetime,
        undefined,
        undefined  // description parameter
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual(mockSession);
    });
  });

  describe('handleUpdateSession', () => {
    it('should update session fields', async () => {
      const mockSession = {
        id: '2025-01-26-17.00.00.000',
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated']
      };
      mockSessionManager.updateSession.mockReturnValue(mockSession);

      const result = await handlers.handleUpdateSession({
        id: '2025-01-26-17.00.00.000',
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated']
      });

      expect(mockSessionManager.updateSession).toHaveBeenCalledWith(
        '2025-01-26-17.00.00.000',
        'Updated Title',
        'Updated content',
        ['updated'],
        undefined,
        undefined  // description parameter
      );
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual(mockSession);
    });

    it('should handle partial updates', async () => {
      const mockSession = {
        id: '2025-01-26-17.00.00.000',
        title: 'Original Title',
        content: 'Updated content only'
      };
      mockSessionManager.updateSession.mockReturnValue(mockSession);

      await handlers.handleUpdateSession({
        id: '2025-01-26-17.00.00.000',
        content: 'Updated content only'
      });

      expect(mockSessionManager.updateSession).toHaveBeenCalledWith(
        '2025-01-26-17.00.00.000',
        undefined,
        'Updated content only',
        undefined,
        undefined,
        undefined  // description parameter
      );
    });

    it('should throw error for non-existent session', async () => {
      mockSessionManager.updateSession.mockImplementation(() => {
        throw new Error('Session nonexistent not found');
      });

      await expect(handlers.handleUpdateSession({
        id: 'nonexistent',
        title: 'Update'
      })).rejects.toThrow();
    });
  });

  describe('handleSearchSessionsByTag', () => {
    it('should search sessions by tag', async () => {
      const mockSessions = [
        { id: '2025-01-26-10.00.00.000', title: 'Work Session 1', tags: ['work'] },
        { id: '2025-01-26-11.00.00.000', title: 'Work Session 2', tags: ['work', 'meeting'] }
      ];
      mockSessionManager.searchSessionsByTag.mockReturnValue(mockSessions);

      const result = await handlers.handleSearchSessionsByTag({
        tag: 'work'
      });

      expect(mockSessionManager.searchSessionsByTag).toHaveBeenCalledWith('work');
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual(mockSessions);
    });

    it('should return empty array for non-existent tag', async () => {
      mockSessionManager.searchSessionsByTag.mockReturnValue([]);

      const result = await handlers.handleSearchSessionsByTag({
        tag: 'nonexistent'
      });

      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.data).toEqual([]);
    });
  });

  describe('Session ID validation', () => {
    it('should validate session ID format', async () => {
      // Valid format: YYYY-MM-DD-HH.MM.SS.sss
      const validId = '2025-01-26-12.30.45.678';
      mockSessionManager.getSessionDetail.mockReturnValue({ id: validId });

      await handlers.handleGetSessionDetail({ id: validId });
      expect(mockSessionManager.getSessionDetail).toHaveBeenCalledWith(validId);
    });

    it('should handle legacy session ID formats', async () => {
      // Handle different ID formats that might exist
      const legacyId = '20250126-123045678';  // Old format
      mockSessionManager.getSessionDetail.mockReturnValue({ id: legacyId });

      await handlers.handleGetSessionDetail({ id: legacyId });
      expect(mockSessionManager.getSessionDetail).toHaveBeenCalledWith(legacyId);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSessionManager.createSession.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(handlers.handleCreateSession({
        title: 'Session'
      })).rejects.toThrow('Database error');
    });

    it('should handle concurrent session operations', async () => {
      const promises = Array(5).fill(null).map((_, i) =>
        handlers.handleCreateSession({
          title: `Concurrent Session ${i}`
        })
      );

      mockSessionManager.createSession.mockImplementation((title: any) =>
        Promise.resolve({
          id: `2025-01-26-12.00.00.00${title.slice(-1)}`,
          title
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      expect(mockSessionManager.createSession).toHaveBeenCalledTimes(5);
    });
  });
});