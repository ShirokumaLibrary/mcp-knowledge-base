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