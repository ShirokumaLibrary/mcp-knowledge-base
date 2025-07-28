// Jest setup file - runs after test environment is set up
// @ai-context Test environment configuration and console mocking
// @ai-pattern Clean setup without MaxListeners workarounds
// @ai-why Previous MaxListeners fixes removed after solving root cause in logger.ts

// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.MCP_LOGGING_ENABLED = 'false';
process.env.LOG_LEVEL = 'silent';  // Suppress all logs during tests

// Use test-specific paths to avoid polluting production environment
const path = require('path');
const os = require('os');
// We'll handle closeAllTestDatabases in the tests themselves
// const { closeAllTestDatabases } = require('./dist/test-utils/database-test-helper.js');

// Check if we should keep test data
const keepTestData = process.env.KEEP_TEST_DATA === 'true';

// Set test data directory to OS temp folder for better isolation
const projectTmpDir = os.tmpdir();
process.env.TEST_DATA_DIR = projectTmpDir;

// Don't set global paths - let each test create its own isolated environment
// This prevents tests from interfering with each other
// process.env.MCP_DATABASE_PATH = testDataDir;
// process.env.MCP_SQLITE_PATH = path.join(testDataDir, 'test-search.db');

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

// Global cleanup after all tests
// afterAll(async () => {
//   // Close any remaining database connections
//   await closeAllTestDatabases();
// });

