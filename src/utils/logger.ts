/**
 * Simple logger utility for database operations and server startup
 * Uses console.error for MCP server compatibility (stdout is reserved for MCP protocol)
 */

export const logger = {
  info: (message: string): void => {
    // Use console.error for MCP compatibility (stdout is for protocol)
    console.error(`[INFO] ${message}`);
  },

  warn: (message: string): void => {
    console.error(`[WARN] ${message}`);
  },

  error: (message: string, error?: unknown): void => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}: ${error.message}`);
    } else if (error) {
      console.error(`[ERROR] ${message}: ${String(error)}`);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },

  success: (message: string): void => {
    console.error(`[✓] ${message}`);
  }
};