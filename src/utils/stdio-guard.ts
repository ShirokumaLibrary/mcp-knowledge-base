/**
 * @ai-context Protects stdio from being polluted by third-party libraries
 * @ai-critical MCP protocol requires clean stdio for JSON communication
 */

/**
 * @ai-intent Prevent any non-JSON output to stdout/stderr
 * @ai-why MCP uses stdio for JSON-RPC communication
 */
export function guardStdio(): void {
  // Skip in test environment
  if (process.env.NODE_ENV === 'test' || process.env.MCP_MODE === 'false') {
    return;
  }

  if (process.env.NODE_ENV === 'production' || process.env.MCP_GUARD_STDIO === 'true') {
    try {
      // Save original stdout write
      const originalStdoutWrite = process.stdout.write.bind(process.stdout);

      // Override process.stderr.write - completely silence it
      process.stderr.write = function(): boolean {
        return true;
      };

      // Override process.stdout.write to filter non-JSON output
      process.stdout.write = function(chunk: unknown, encoding?: BufferEncoding | ((err?: Error | null) => void), callback?: (err?: Error | null) => void): boolean {
        if (typeof encoding === 'function') {
          callback = encoding;
          encoding = undefined;
        }

        const str = String(chunk);

        // Only allow JSON-RPC messages through
        if (str.trim().startsWith('{') && (str.includes('"jsonrpc"') || str.includes('"result"') || str.includes('"method"'))) {
          originalStdoutWrite.call(process.stdout, str, encoding as BufferEncoding, callback);
        } else if (str.trim() === '') {
          // Allow empty lines
          originalStdoutWrite.call(process.stdout, str, encoding as BufferEncoding, callback);
        }

        if (callback) {
          callback();
        }
        return true;
      };

      // Override console methods
      const noop = (): void => {};
      (console as unknown as Record<string, unknown>).error = noop;
      (console as unknown as Record<string, unknown>).warn = noop;
      (console as unknown as Record<string, unknown>).log = noop;
      (console as unknown as Record<string, unknown>).info = noop;
      (console as unknown as Record<string, unknown>).debug = noop;
      (console as unknown as Record<string, unknown>).trace = noop;

      // Override process.emitWarning
      process.emitWarning = noop;

    } catch {
      // Silently fail
    }
  }
}