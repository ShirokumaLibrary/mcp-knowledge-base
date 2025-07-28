import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

describe('Simple MCP Server Integration Test', () => {
  let serverProcess: ChildProcess;
  let messageId = 1;
  let testDataDir: string;

  const sendRequest = (method: string, params: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to ${method}`));
      }, 5000);

      const handleData = (data: Buffer) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const response = JSON.parse(line);
            if (response.id === id) {
              clearTimeout(timeout);
              serverProcess.stdout?.removeListener('data', handleData);
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response.result);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      };

      serverProcess.stdout?.on('data', handleData);
      serverProcess.stdin?.write(JSON.stringify(request) + '\n');
    });
  };

  beforeAll(async () => {
    // Create isolated test directory
    // Create test directory in project tmp folder
    await fs.mkdir(path.join(process.cwd(), 'tmp'), { recursive: true });
    testDataDir = await fs.mkdtemp(path.join(process.cwd(), 'tmp', 'mcp-simple-test-'));
    
    // Start MCP server with test directory
    serverProcess = spawn('node', [path.join(process.cwd(), 'dist/server.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MCP_DATABASE_PATH: testDataDir,
        MCP_SQLITE_PATH: path.join(testDataDir, 'test-search.db')
      }
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send initialize message
    const initResult = await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: true },
        sampling: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });

    expect(initResult).toBeDefined();
    expect(initResult.protocolVersion).toBe('2024-11-05');
  }, 10000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Clean up test directory unless KEEP_TEST_DATA is set
    if (testDataDir) {
      if (process.env.KEEP_TEST_DATA !== 'true') {
        try {
          await fs.rm(testDataDir, { recursive: true, force: true });
        } catch (error) {
          console.error('Failed to clean up test directory:', error);
        }
      } else {
        console.log(`Test data kept in: ${testDataDir}`);
      }
    }
  });

  test('should list available tools', async () => {
    const result = await sendRequest('tools/list', {});
    
    expect(result).toBeDefined();
    expect(result.tools).toBeInstanceOf(Array);
    expect(result.tools.length).toBeGreaterThan(0);
    
    const toolNames = result.tools.map((t: any) => t.name);
    expect(toolNames).toContain('get_items');
    expect(toolNames).toContain('create_item');
  });

  test('should create and retrieve an issue', async () => {
    // Create an issue
    const createResult = await sendRequest('tools/call', {
      name: 'create_item',
      arguments: {
        type: 'issues',
        title: 'Test Issue',
        content: 'This is a test issue',
        priority: 'medium',
        status: 'Open'
      }
    });

    expect(createResult).toBeDefined();
    expect(createResult.content).toBeDefined();
    expect(createResult.content[0].type).toBe('text');
    
    const createText = createResult.content[0].text;
    
    // Parse the response - handle unified handler format
    const responseData = JSON.parse(createText);
    const createdIssue = responseData.data || responseData;
    expect(createdIssue.id).toBeDefined();
    expect(parseInt(createdIssue.id)).toBeGreaterThan(0);
    expect(createdIssue.title).toBe('Test Issue');

    // Get issues to verify
    const getResult = await sendRequest('tools/call', {
      name: 'get_items',
      arguments: {
        type: 'issues'
      }
    });

    expect(getResult).toBeDefined();
    const getResponse = JSON.parse(getResult.content[0].text);
    const foundIssue = getResponse.data.find((i: any) => i.id === createdIssue.id);
    expect(foundIssue).toBeDefined();
    expect(foundIssue.title).toBe('Test Issue');

    // Clean up
    await sendRequest('tools/call', {
      name: 'delete_item',
      arguments: {
        type: 'issues',
        id: createdIssue.id
      }
    });
  });
});