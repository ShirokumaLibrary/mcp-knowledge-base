/**
 * @ai-context Integration test helpers
 * @ai-pattern Common utilities for integration tests
 * @ai-critical Simplifies test setup and assertions
 */

import { ChildProcess } from 'child_process';

export interface TestContext {
  serverProcess: ChildProcess;
  messageId: number;
  testDataDir: string;
  createdItems: Array<{ type: string; id: number }>;
}

export class MCPTestClient {
  private messageId = 1;
  private serverProcess: ChildProcess;
  private responseHandlers = new Map<number, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();

  constructor(serverProcess: ChildProcess) {
    this.serverProcess = serverProcess;
    this.setupResponseHandler();
  }

  private setupResponseHandler() {
    this.serverProcess.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const response = JSON.parse(line);
          const handler = this.responseHandlers.get(response.id);
          if (handler) {
            clearTimeout(handler.timeout);
            this.responseHandlers.delete(response.id);
            if (response.error) {
              handler.reject(new Error(response.error.message));
            } else {
              handler.resolve(response.result);
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
  }

  async sendRequest(method: string, params: any, timeoutMs = 10000): Promise<any> {
    const id = this.messageId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(id);
        reject(new Error(`Timeout waiting for response to ${method}`));
      }, timeoutMs);

      this.responseHandlers.set(id, { resolve, reject, timeout });
      this.serverProcess.stdin?.write(JSON.stringify(request) + '\n');
    });
  }

  async callTool(toolName: string, args: any): Promise<any> {
    const result = await this.sendRequest('tools/call', {
      name: toolName,
      arguments: args
    });
    
    return this.parseToolResponse(result);
  }

  private parseToolResponse(result: any): any {
    if (!result?.content?.[0]?.text) {
      return result;
    }

    const text = result.content[0].text;
    
    // Handle different response formats
    const patterns = [
      { regex: /(.+) created: (.+)$/, handler: (m: RegExpMatchArray) => {
        try {
          return JSON.parse(m[2]);
        } catch {
          // If JSON parse fails, return as text
          return m[2];
        }
      }},
      { regex: /(.+) updated: (.+)$/, handler: (m: RegExpMatchArray) => {
        try {
          return JSON.parse(m[2]);
        } catch {
          return m[2];
        }
      }},
      { regex: /Tag created: (.+)/, handler: (m: RegExpMatchArray) => ({ name: m[1].trim() }) },
      { regex: /Tag "(.+)" deleted/, handler: (m: RegExpMatchArray) => ({ deleted: true, name: m[1] }) },
      { regex: /^(\{|\[)/, handler: () => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }}
    ];

    for (const { regex, handler } of patterns) {
      const match = text.match(regex);
      if (match) {
        return handler(match);
      }
    }

    // Try to extract JSON from text
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}

    return text;
  }

  async initialize(): Promise<void> {
    await this.sendRequest('initialize', {
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
  }
}

export class TestDataBuilder {
  static createIssue(overrides: Partial<any> = {}) {
    return {
      type: 'issues',
      title: 'Test Issue',
      content: 'Test issue content',
      priority: 'medium',
      status: 'Open',
      tags: ['test'],
      ...overrides
    };
  }

  static createPlan(overrides: Partial<any> = {}) {
    return {
      type: 'plans',
      title: 'Test Plan',
      content: 'Test plan content',
      priority: 'high',
      status: 'Open', // Changed from 'Planning' which doesn't exist by default
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      tags: ['test'],
      ...overrides
    };
  }

  static createDocument(type: 'docs' | 'knowledge', overrides: Partial<any> = {}) {
    return {
      type,
      title: `Test ${type}`,
      content: `Test ${type} content`,
      tags: ['test'],
      ...overrides
    };
  }

  static createSession(overrides: Partial<any> = {}) {
    return {
      title: 'Test Session',
      content: 'Test session content',
      tags: ['test'],
      ...overrides
    };
  }

  static createSummary(overrides: Partial<any> = {}) {
    return {
      date: new Date().toISOString().split('T')[0],
      title: 'Test Summary',
      content: 'Test summary content',
      tags: ['test'],
      ...overrides
    };
  }
}

export class TestAssertions {
  static assertValidItem(item: any, expectedType: string) {
    expect(item).toBeDefined();
    expect(item.id).toBeGreaterThan(0);
    expect(item.type).toBe(expectedType);
    expect(item.title).toBeDefined();
    expect(item.created_at).toBeDefined();
    expect(item.updated_at).toBeDefined();
  }

  static assertValidTask(task: any) {
    this.assertValidItem(task, task.type);
    expect(['high', 'medium', 'low']).toContain(task.priority);
    expect(task.status).toBeDefined();
    // status_id may not always be present in summary views
    if (task.status_id !== undefined) {
      expect(task.status_id).toBeGreaterThan(0);
    }
  }

  static assertValidDocument(doc: any) {
    this.assertValidItem(doc, doc.type);
    expect(doc.content).toBeDefined();
  }

  static assertValidSession(session: any) {
    expect(session.id).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}\.\d{2}\.\d{2}\.\d{3}$/);
    expect(session.title).toBeDefined();
    expect(session.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }

  static assertValidSummary(summary: any) {
    expect(summary.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(summary.title).toBeDefined();
    expect(summary.content).toBeDefined();
  }

  static assertRelationships(item: any, expectedTasks: string[] = [], expectedDocs: string[] = []) {
    if (expectedTasks.length > 0) {
      expect(item.related_tasks).toBeDefined();
      expect(item.related_tasks).toEqual(expect.arrayContaining(expectedTasks));
    }
    if (expectedDocs.length > 0) {
      expect(item.related_documents).toBeDefined();
      expect(item.related_documents).toEqual(expect.arrayContaining(expectedDocs));
    }
  }

  static assertTags(item: any, expectedTags: string[]) {
    expect(item.tags).toBeDefined();
    expect(item.tags).toEqual(expect.arrayContaining(expectedTags));
  }

  static assertSearchResults(results: any, minCount: number = 1) {
    expect(results).toBeDefined();
    
    let totalCount = 0;
    
    // Handle different response formats
    if (results.data) {
      if (results.data.tasks) {
        Object.values(results.data.tasks).forEach((items: any) => {
          if (Array.isArray(items)) totalCount += items.length;
        });
      }
      if (results.data.documents) {
        Object.values(results.data.documents).forEach((items: any) => {
          if (Array.isArray(items)) totalCount += items.length;
        });
      }
    } else if (results.tasks || results.documents) {
      // Direct object format
      if (results.tasks) {
        Object.values(results.tasks).forEach((items: any) => {
          if (Array.isArray(items)) totalCount += items.length;
        });
      }
      if (results.documents) {
        Object.values(results.documents).forEach((items: any) => {
          if (Array.isArray(items)) totalCount += items.length;
        });
      }
    } else if (Array.isArray(results)) {
      totalCount = results.length;
    }
    
    expect(totalCount).toBeGreaterThanOrEqual(minCount);
  }
}

export class TestCleanup {
  private client: MCPTestClient;
  private createdItems: Array<{ type: string; id: number }> = [];
  private createdTags: string[] = [];
  private createdTypes: string[] = [];

  constructor(client: MCPTestClient) {
    this.client = client;
  }

  trackItem(type: string, id: number) {
    // Avoid duplicates
    if (!this.createdItems.find(item => item.type === type && item.id === id)) {
      this.createdItems.push({ type, id });
    }
  }

  trackTag(name: string) {
    this.createdTags.push(name);
  }

  trackType(name: string) {
    this.createdTypes.push(name);
  }

  async cleanup() {
    // Delete items in reverse order
    for (const item of this.createdItems.reverse()) {
      try {
        await this.client.callTool('delete_item', {
          type: item.type,
          id: item.id
        });
      } catch (error) {
        console.warn(`Failed to delete ${item.type} ${item.id}:`, error);
      }
    }

    // Delete tags
    for (const tag of this.createdTags) {
      try {
        await this.client.callTool('delete_tag', { name: tag });
      } catch (error) {
        console.warn(`Failed to delete tag ${tag}:`, error);
      }
    }

    // Delete custom types
    for (const type of this.createdTypes) {
      try {
        await this.client.callTool('delete_type', { name: type });
      } catch (error) {
        console.warn(`Failed to delete type ${type}:`, error);
      }
    }

    this.createdItems = [];
    this.createdTags = [];
    this.createdTypes = [];
  }
}

export async function waitForServer(process: ChildProcess, timeoutMs = 5000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (process.stdout) {
      return new Promise(resolve => setTimeout(resolve, 1000));
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Server failed to start within timeout');
}