import * as path from 'path';
import { typeRegistry } from './types/type-registry.js';
export function getConfig() {
    const baseDir = process.env.MCP_DATABASE_PATH || path.join(process.cwd(), '.shirokuma', 'data');
    return {
        database: {
            path: baseDir,
            sqlitePath: process.env.MCP_SQLITE_PATH || path.join(baseDir, 'search.db'),
            getTypePath(type) {
                const typeDef = typeRegistry.getType(type);
                if (typeDef?.baseType === 'tasks') {
                    return path.join(baseDir, 'tasks');
                }
                return path.join(baseDir, type);
            },
            getTypeFileName(type, id) {
                const prefix = typeRegistry.getFilePrefix(type);
                return `${prefix}-${id}.md`;
            },
            sessionsPath: path.join(baseDir, 'sessions')
        },
        server: {
            name: process.env.MCP_SERVER_NAME || 'shirokuma-knowledge-base',
            version: process.env.MCP_SERVER_VERSION || '1.0.0'
        },
        logging: {
            level: process.env.MCP_LOG_LEVEL || 'info',
            enabled: process.env.MCP_LOGGING_ENABLED !== 'false',
            logDir: process.env.MCP_LOG_DIR || path.join(process.cwd(), 'logs')
        },
    };
}
export function contentPath(dataDir) {
    return path.join(dataDir, 'contents');
}
export const config = getConfig();
export const dataDir = config.database.path;
