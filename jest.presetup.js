// This runs BEFORE any test files are loaded
// Increase EventEmitter limits to prevent warnings

// Set this BEFORE any modules are loaded
const EventEmitter = require('events').EventEmitter;
EventEmitter.defaultMaxListeners = 100;

// Increase process limits
process.setMaxListeners(100);

// Winston specific - set before winston is imported anywhere
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.MCP_LOGGING_ENABLED = 'false';