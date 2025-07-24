/**
 * @ai-context Configuration management for MCP server
 * @ai-pattern Environment-based configuration with defaults
 * @ai-critical Configuration affects all system behavior
 * @ai-assumption Environment variables override defaults
 * @ai-why Centralized config for easy deployment changes
 */
import * as path from 'path';
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
            // @ai-logic: Entity-specific subdirectories
            issuesPath: path.join(baseDir, 'issues'),
            plansPath: path.join(baseDir, 'plans'),
            docsPath: path.join(baseDir, 'docs'),
            knowledgePath: path.join(baseDir, 'knowledge'),
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
//# sourceMappingURL=config.js.map