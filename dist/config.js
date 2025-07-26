/**
 * @ai-context Configuration management for MCP server
 * @ai-pattern Environment-based configuration with defaults
 * @ai-critical Configuration affects all system behavior
 * @ai-assumption Environment variables override defaults
 * @ai-why Centralized config for easy deployment changes
 */
import * as path from 'path';
import { typeRegistry } from './types/type-registry.js';
/**
 * @ai-intent Load configuration from environment with defaults
 * @ai-flow 1. Check env vars -> 2. Apply defaults -> 3. Build paths
 * @ai-pattern Environment variables prefixed with MCP_
 * @ai-critical Database path affects all file operations
 * @ai-defaults database: ./database, logs: ./logs, level: info
 * @ai-return Immutable configuration object
 */
export function getConfig() {
    // @ai-logic: Database base directory from env or relative to CWD
    const baseDir = process.env.MCP_DATABASE_PATH || path.join(process.cwd(), '.shirokuma', 'data');
    return {
        database: {
            path: baseDir,
            // @ai-logic: SQLite can be relocated independently
            sqlitePath: process.env.MCP_SQLITE_PATH || path.join(baseDir, 'search.db'),
            // @ai-logic: Dynamic path resolution based on type registry
            getTypePath(type) {
                const typeDef = typeRegistry.getType(type);
                if (typeDef?.baseType === 'tasks') {
                    return path.join(baseDir, 'tasks');
                }
                // For documents and custom types, use type name as directory
                return path.join(baseDir, type);
            },
            // @ai-logic: Dynamic file name generation using type registry
            getTypeFileName(type, id) {
                const prefix = typeRegistry.getFilePrefix(type);
                return `${prefix}-${id}.md`;
            },
            sessionsPath: path.join(baseDir, 'sessions')
        },
        server: {
            // @ai-default: Shirokuma knowledge base server
            name: process.env.MCP_SERVER_NAME || 'shirokuma-knowledge-base',
            version: process.env.MCP_SERVER_VERSION || '1.0.0'
        },
        logging: {
            // @ai-validation: Type cast with fallback to info
            level: process.env.MCP_LOG_LEVEL || 'info',
            // @ai-pattern: Explicit false to disable, else enabled
            enabled: process.env.MCP_LOGGING_ENABLED !== 'false',
            // @ai-default: Logs directory at project root
            logDir: process.env.MCP_LOG_DIR || path.join(process.cwd(), 'logs')
        }
    };
}
/**
 * @ai-intent Helper function to get content path
 * @ai-pattern Convenience wrapper for common path access
 */
export function contentPath(dataDir) {
    return path.join(dataDir, 'contents');
}
/**
 * @ai-intent Singleton configuration instance
 * @ai-pattern Module-level constant for global access
 * @ai-critical Used throughout the application
 */
export const config = getConfig();
/**
 * @ai-intent Convenience export for data directory
 * @ai-pattern Common access pattern for file operations
 */
export const dataDir = config.database.path;
//# sourceMappingURL=config.js.map