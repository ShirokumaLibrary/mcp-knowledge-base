// MUST be at the very top before any imports
import { EventEmitter } from 'events';

// Increase default max listeners for all EventEmitters FIRST
EventEmitter.defaultMaxListeners = 100;

// Then increase for process
process.setMaxListeners(100);

// Also increase listener limit for Console object (with type extension)
if (typeof (console as any).setMaxListeners === 'function') {
  (console as any).setMaxListeners(100);
}

// Suppress the warning entirely
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    return; // Ignore this warning
  }
  console.warn(warning);
});

// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.MCP_LOGGING_ENABLED = 'false';
process.env.LOG_LEVEL = 'silent';  // Suppress all logs during tests

// Use test-specific paths to avoid polluting production environment
const path = require('path');
const os = require('os');

// Check if we should keep test data
const keepTestData = process.env.KEEP_TEST_DATA === 'true';

// Set test data directory to project tmp folder
const projectTmpDir = path.join(process.cwd(), 'tmp');
process.env.TEST_DATA_DIR = projectTmpDir;

// Don't create a global test directory here - let each test manage its own
const testDataDir = path.join(projectTmpDir, 'mcp-unit-tests-default');
process.env.MCP_DATABASE_PATH = testDataDir;
process.env.MCP_SQLITE_PATH = path.join(testDataDir, 'test-search.db');

if (keepTestData) {
  console.log(`\n📁 KEEP_TEST_DATA is enabled - test data will be preserved\n`);
}

// Suppress console output during tests unless explicitly enabled
if (process.env.SHOW_TEST_LOGS !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

