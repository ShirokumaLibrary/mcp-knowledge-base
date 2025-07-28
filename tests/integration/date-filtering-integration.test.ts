/**
 * @ai-context Integration tests for date filtering in get_items
 * @ai-pattern MCP protocol testing with real server
 */

import { spawn, ChildProcess } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';

describe('Date Filtering Integration', () => {
  let client: Client;
  let transport: StdioClientTransport;
  let serverProcess: ChildProcess;
  let testDataPath: string;

  beforeAll(async () => {
    // Create temporary test directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-date-test-'));
    testDataPath = path.join(tempDir, '.shirokuma/data');
    await fs.mkdir(testDataPath, { recursive: true });

    // Start MCP server
    const serverPath = path.join(process.cwd(), 'dist/server.js');
    serverProcess = spawn('node', [serverPath], {
      env: {
        ...process.env,
        MCP_DATABASE_PATH: testDataPath
      }
    });

    // Create client and connect
    transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
      env: {
        ...process.env,
        MCP_DATABASE_PATH: testDataPath
      }
    });

    client = new Client({
      name: 'date-filter-test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    await client.connect(transport);
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
    // Clean up test directory
    try {
      await fs.rm(path.dirname(testDataPath), { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  const callTool = async (name: string, args: any): Promise<any> => {
    const result = await client.callTool({ name, arguments: args }) as CallToolResult;
    if (result.isError) {
      throw new Error(result.text || 'Tool call failed');
    }
    const text = result.text || result.content?.[0]?.text || '';
    try {
      return JSON.parse(text).data || JSON.parse(text);
    } catch {
      return text;
    }
  };

  describe('Date filtering for sessions', () => {
    beforeAll(async () => {
      // Create sessions on different dates
      const sessions = [
        { date: '2025-07-10', title: 'Early July Session' },
        { date: '2025-07-20', title: 'Mid July Session' },
        { date: '2025-07-30', title: 'Late July Session' },
        { date: '2025-08-05', title: 'August Session' }
      ];

      for (const session of sessions) {
        await callTool('create_item', {
          type: 'sessions',
          title: session.title,
          content: 'Session content',
          datetime: `${session.date}T10:00:00.000Z`
        });
      }
    });

    test('should filter sessions by date range', async () => {
      // Get July sessions only
      const julyResults = await callTool('get_items', {
        type: 'sessions',
        start_date: '2025-07-01',
        end_date: '2025-07-31'
      });

      expect(julyResults).toHaveLength(3);
      const titles = julyResults.map((s: any) => s.title);
      expect(titles).toContain('Early July Session');
      expect(titles).toContain('Mid July Session');
      expect(titles).toContain('Late July Session');
      expect(titles).not.toContain('August Session');
    });

    test('should get sessions from specific date onwards', async () => {
      const results = await callTool('get_items', {
        type: 'sessions',
        start_date: '2025-07-20'
      });

      expect(results.length).toBeGreaterThanOrEqual(3);
      const titles = results.map((s: any) => s.title);
      expect(titles).toContain('Mid July Session');
      expect(titles).toContain('Late July Session');
      expect(titles).toContain('August Session');
    });

    test('should get sessions up to specific date', async () => {
      const results = await callTool('get_items', {
        type: 'sessions',
        end_date: '2025-07-20'
      });

      expect(results.length).toBeGreaterThanOrEqual(2);
      const titles = results.map((s: any) => s.title);
      expect(titles).toContain('Early July Session');
      expect(titles).toContain('Mid July Session');
    });
  });

  describe('Date filtering for other types', () => {
    test('should filter documents by updated_at', async () => {
      // Create documents
      const doc1 = await callTool('create_item', {
        type: 'docs',
        title: 'Old Document',
        content: 'Created first'
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));

      const doc2 = await callTool('create_item', {
        type: 'docs',
        title: 'New Document',
        content: 'Created second'
      });

      // Get recently created documents
      const recentDocs = await callTool('get_items', {
        type: 'docs',
        start_date: new Date().toISOString().split('T')[0]
      });

      expect(recentDocs.length).toBeGreaterThanOrEqual(2);
      const titles = recentDocs.map((d: any) => d.title);
      expect(titles).toContain('Old Document');
      expect(titles).toContain('New Document');
    });

    test('should combine date and status filters', async () => {
      // Create issues with different statuses
      await callTool('create_item', {
        type: 'issues',
        title: 'Open Issue Today',
        content: 'Test issue',
        status: 'Open'
      });

      await callTool('create_item', {
        type: 'issues',
        title: 'Closed Issue Today',
        content: 'Test issue',
        status: 'Closed'
      });

      const today = new Date().toISOString().split('T')[0];

      // Get today's open issues only (default excludes closed)
      const openIssues = await callTool('get_items', {
        type: 'issues',
        start_date: today
      });

      // Should only get open issues
      const titles = openIssues.map((i: any) => i.title);
      expect(titles).toContain('Open Issue Today');
      expect(titles).not.toContain('Closed Issue Today');

      // Get all issues including closed
      const allIssues = await callTool('get_items', {
        type: 'issues',
        start_date: today,
        includeClosedStatuses: true
      });

      const allTitles = allIssues.map((i: any) => i.title);
      expect(allTitles).toContain('Open Issue Today');
      expect(allTitles).toContain('Closed Issue Today');
    });
  });

  describe('Edge cases', () => {
    test('should handle single day range', async () => {
      const testDate = '2025-09-15';
      
      // Create a session on specific date
      await callTool('create_item', {
        type: 'sessions',
        title: 'Single Day Session',
        content: 'Test',
        datetime: `${testDate}T14:30:00.000Z`
      });

      // Query for that exact day
      const results = await callTool('get_items', {
        type: 'sessions',
        start_date: testDate,
        end_date: testDate
      });

      const titles = results.map((s: any) => s.title);
      expect(titles).toContain('Single Day Session');
    });

    test('should return empty array for no matches', async () => {
      // Query for future dates with no data
      const results = await callTool('get_items', {
        type: 'docs',
        start_date: '2099-01-01',
        end_date: '2099-12-31'
      });

      expect(results).toEqual([]);
    });
  });
});