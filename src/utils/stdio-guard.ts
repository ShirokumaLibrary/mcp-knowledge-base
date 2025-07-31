/**
 * @ai-context Protects stdio from being polluted by third-party libraries
 * @ai-critical MCP protocol requires clean stdio for JSON communication
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * @ai-intent Redirect stderr to a file to prevent stdio pollution
 * @ai-why Some native modules (like sqlite3) may write directly to stderr
 */
export function guardStdio(): void {
  if (process.env.NODE_ENV === 'production' || process.env.MCP_GUARD_STDIO === 'true') {
    try {
      // Create a log directory if it doesn't exist
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Create a writable stream to a log file
      const stderrLog = path.join(logDir, `stderr-${Date.now()}.log`);
      const stderrStream = fs.createWriteStream(stderrLog, { flags: 'a' });

      // Save original write methods
      const originalStderrWrite = process.stderr.write.bind(process.stderr);
      const originalStdoutWrite = process.stdout.write.bind(process.stdout);
      
      // Track if we're in JSON response mode
      let inJsonResponse = false;
      
      // Override process.stderr.write
      process.stderr.write = function(chunk: any, encoding?: any, callback?: any): boolean {
        // Write to file instead of stderr
        if (typeof encoding === 'function') {
          callback = encoding;
          encoding = undefined;
        }
        
        stderrStream.write(chunk, encoding, callback);
        return true;
      };
      
      // Override process.stdout.write to filter non-JSON output
      process.stdout.write = function(chunk: any, encoding?: any, callback?: any): boolean {
        if (typeof encoding === 'function') {
          callback = encoding;
          encoding = undefined;
        }
        
        const str = chunk.toString();
        
        // Log ALL stdout for debugging
        stderrStream.write(`[STDOUT DEBUG] Length: ${str.length}, First 20 chars: ${JSON.stringify(str.substring(0, 20))}\n`);
        
        // Check if this looks like JSON
        if (str.trim().startsWith('{') || inJsonResponse) {
          // Allow JSON through
          originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
          inJsonResponse = str.includes('"jsonrpc"');
        } else {
          // Redirect non-JSON to stderr log
          stderrStream.write('STDOUT NON-JSON: ' + chunk, encoding);
        }
        
        return true;
      };

      // Also override console methods that might write to stderr
      const noop = () => {};
      console.error = noop;
      console.warn = noop;
      console.log = noop;
      console.info = noop;
      console.debug = noop;
      console.trace = noop;

    } catch (error) {
      // Silently fail - we can't log errors when guarding stdio
    }
  }
}