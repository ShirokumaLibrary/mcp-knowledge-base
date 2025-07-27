/**
 * @ai-context E2E test setup and utilities
 * @ai-pattern Test environment configuration
 * @ai-critical Ensures consistent test environment
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { McpClient } from '@modelcontextprotocol/sdk';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/dist/client/transports/stdio.js';

export interface E2ETestContext {
  client: McpClient;
  serverProcess: ChildProcess;
  testDbPath: string;
  cleanup: () => Promise<void>;
}

/**
 * @ai-intent Setup E2E test environment
 * @ai-flow 1. Create test DB -> 2. Start server -> 3. Connect client -> 4. Return context
 */
export async function setupE2ETest(): Promise<E2ETestContext> {
  // Create temporary test database
  const testDir = path.join(process.cwd(), 'tmp', 'e2e-test', Date.now().toString());
  await fs.mkdir(testDir, { recursive: true });
  
  const testDbPath = path.join(testDir, 'test.db');
  
  // Start MCP server
  const serverPath = path.join(process.cwd(), 'dist', 'server.js');
  const serverProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      DATABASE_PATH: testDbPath,
      LOG_LEVEL: 'error' // Reduce noise during tests
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Wait for server to start
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 10000);
    
    serverProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server started') || output.includes('ready')) {
        clearTimeout(timeout);
        resolve(void 0);
      }
    });
    
    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
  
  // Create MCP client
  const transport = new StdioClientTransport({
    stdin: serverProcess.stdout!,
    stdout: serverProcess.stdin!,
    stderr: serverProcess.stderr!
  });
  
  const client = new McpClient({
    name: 'e2e-test-client',
    version: '1.0.0'
  });
  
  await client.connect(transport);
  
  // Cleanup function
  const cleanup = async () => {
    try {
      await client.close();
      serverProcess.kill();
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };
  
  return {
    client,
    serverProcess,
    testDbPath,
    cleanup
  };
}

/**
 * @ai-intent Wait for condition with timeout
 * @ai-pattern Polling with exponential backoff
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    backoff?: number;
  } = {}
): Promise<void> {
  const {
    timeout = 30000,
    interval = 100,
    backoff = 1.5
  } = options;
  
  const startTime = Date.now();
  let currentInterval = interval;
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, currentInterval));
    currentInterval = Math.min(currentInterval * backoff, 1000);
  }
  
  throw new Error('Timeout waiting for condition');
}

/**
 * @ai-intent Call MCP tool and get result
 * @ai-pattern Simplified tool calling
 */
export async function callTool(
  client: McpClient,
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  const result = await client.request({
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    }
  });
  
  if ('error' in result) {
    throw new Error(`Tool error: ${result.error.message}`);
  }
  
  return result.content;
}

/**
 * @ai-intent Create test data fixtures
 * @ai-pattern Consistent test data
 */
export const testFixtures = {
  issue: {
    title: 'Test Issue E2E',
    content: 'This is a test issue for E2E testing',
    priority: 'high',
    status: 'Open',
    tags: ['test', 'e2e']
  },
  
  plan: {
    title: 'Test Plan E2E',
    content: 'This is a test plan for E2E testing',
    priority: 'medium',
    status: 'In Progress',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    tags: ['test', 'e2e']
  },
  
  document: {
    title: 'Test Document E2E',
    content: 'This is a test document for E2E testing',
    description: 'E2E test document',
    tags: ['test', 'e2e']
  },
  
  session: {
    title: 'Test Session E2E',
    content: 'Work done during E2E testing',
    category: 'Testing',
    tags: ['test', 'e2e']
  },
  
  summary: {
    title: 'Test Summary E2E',
    content: 'Summary of E2E testing activities',
    date: new Date().toISOString().split('T')[0],
    tags: ['test', 'e2e']
  }
};

/**
 * @ai-intent Assert tool result matches expected
 * @ai-pattern Flexible assertion helper
 */
export function assertToolResult(
  actual: any,
  expected: Partial<any>,
  message?: string
): void {
  for (const [key, value] of Object.entries(expected)) {
    if (actual[key] !== value) {
      throw new Error(
        message || `Expected ${key} to be ${value}, but got ${actual[key]}`
      );
    }
  }
}

/**
 * @ai-intent Measure operation performance
 * @ai-pattern Performance testing helper
 */
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  name: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await operation();
  const duration = performance.now() - start;
  
  console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * @ai-intent Run test scenario
 * @ai-pattern Structured test execution
 */
export async function runScenario(
  name: string,
  steps: Array<{
    name: string;
    action: () => Promise<any>;
    assertions?: (result: any) => void;
  }>
): Promise<void> {
  console.log(`\n📋 Scenario: ${name}`);
  
  for (const step of steps) {
    console.log(`  ▶️  ${step.name}`);
    
    try {
      const result = await step.action();
      
      if (step.assertions) {
        step.assertions(result);
      }
      
      console.log(`  ✅ ${step.name} - PASSED`);
    } catch (error) {
      console.log(`  ❌ ${step.name} - FAILED`);
      throw error;
    }
  }
  
  console.log(`✅ Scenario: ${name} - COMPLETED\n`);
}