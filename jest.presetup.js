// This runs BEFORE any test files are loaded
// @ai-context Jest presetup file for early environment configuration
// @ai-critical Must run before Winston logger is imported
// @ai-why Ensures test environment is configured before any logger instances are created

// Winston specific - set before winston is imported anywhere
// @ai-fix Part of MaxListenersExceededWarning solution
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.MCP_LOGGING_ENABLED = 'false';