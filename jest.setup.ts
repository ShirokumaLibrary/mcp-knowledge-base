// Increase listener limit during test execution to prevent EventEmitter memory leak warnings
process.setMaxListeners(100);

// Also increase listener limit for Console object (with type extension)
if (typeof (console as any).setMaxListeners === 'function') {
  (console as any).setMaxListeners(100);
}

// Set listener limit for winston logger
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 100;

// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.MCP_LOGGING_ENABLED = 'false';

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