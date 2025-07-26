/**
 * @ai-context Configuration management for MCP server
 * @ai-pattern Environment-based configuration with defaults
 * @ai-critical Configuration affects all system behavior
 * @ai-assumption Environment variables override defaults
 * @ai-why Centralized config for easy deployment changes
 */
/**
 * @ai-context System configuration interface
 * @ai-pattern Nested structure for logical grouping
 * @ai-critical All paths and settings flow from here
 * @ai-assumption Paths are absolute or relative to CWD
 */
export interface Config {
    database: {
        path: string;
        sqlitePath: string;
        getTypePath(type: string): string;
        getTypeFileName(type: string, id: number | string): string;
        sessionsPath: string;
    };
    server: {
        name: string;
        version: string;
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        enabled: boolean;
        logDir: string;
    };
}
/**
 * @ai-intent Load configuration from environment with defaults
 * @ai-flow 1. Check env vars -> 2. Apply defaults -> 3. Build paths
 * @ai-pattern Environment variables prefixed with MCP_
 * @ai-critical Database path affects all file operations
 * @ai-defaults database: ./database, logs: ./logs, level: info
 * @ai-return Immutable configuration object
 */
export declare function getConfig(): Config;
/**
 * @ai-intent Helper function to get content path
 * @ai-pattern Convenience wrapper for common path access
 */
export declare function contentPath(dataDir: string): string;
/**
 * @ai-intent Singleton configuration instance
 * @ai-pattern Module-level constant for global access
 * @ai-critical Used throughout the application
 */
export declare const config: Config;
/**
 * @ai-intent Convenience export for data directory
 * @ai-pattern Common access pattern for file operations
 */
export declare const dataDir: string;
