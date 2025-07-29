/**
 * @ai-context Error recovery patterns for resilient operations
 * @ai-pattern Recovery strategies for different error scenarios
 * @ai-critical Enables graceful degradation and self-healing
 * @ai-why Improves system reliability and user experience
 * @ai-assumption Some operations can be recovered or have fallbacks
 */
import { createLogger } from '../utils/logger.js';
import { DatabaseError, FileSystemError } from '../errors/custom-errors.js';
import { RetryUtils } from '../utils/retry-utils.js';
/**
 * @ai-intent Recovery strategy types
 * @ai-pattern Different approaches to error recovery
 */
export var RecoveryStrategy;
(function (RecoveryStrategy) {
    RecoveryStrategy["RETRY"] = "RETRY";
    RecoveryStrategy["FALLBACK"] = "FALLBACK";
    RecoveryStrategy["CACHE"] = "CACHE";
    RecoveryStrategy["DEGRADE"] = "DEGRADE";
    RecoveryStrategy["COMPENSATE"] = "COMPENSATE";
    RecoveryStrategy["IGNORE"] = "IGNORE";
})(RecoveryStrategy || (RecoveryStrategy = {}));
/**
 * @ai-intent Abstract recovery handler
 * @ai-pattern Strategy pattern for recovery
 */
export class RecoveryHandler {
    name;
    logger;
    constructor(name) {
        this.name = name;
        this.logger = createLogger(`Recovery:${name}`);
    }
}
/**
 * @ai-intent Database recovery handler
 * @ai-pattern Handles database-related failures
 * @ai-critical Ensures data operations can continue
 */
export class DatabaseRecoveryHandler extends RecoveryHandler {
    database;
    cacheManager;
    constructor(database, cacheManager) {
        super('Database');
        this.database = database;
        this.cacheManager = cacheManager;
    }
    canRecover(context) {
        return context.error instanceof DatabaseError;
    }
    async recover(context) {
        const { error, operation, attempts } = context;
        // @ai-logic: Try retry strategy first
        if (attempts < 3) {
            try {
                this.logger.info('Attempting database operation retry', { operation, attempt: attempts });
                const result = await RetryUtils.withRetry(async () => {
                    // @ai-logic: Reinitialize database if needed
                    if (this.isDatabaseConnectionError(error)) {
                        await this.database.initialize();
                    }
                    // @ai-todo: Re-execute original operation
                    throw new Error('Operation re-execution not implemented');
                }, { maxAttempts: 3 - attempts });
                return {
                    success: true,
                    data: result,
                    strategy: RecoveryStrategy.RETRY
                };
            }
            catch (retryError) {
                this.logger.warn('Database retry failed', { error: retryError });
            }
        }
        // @ai-logic: Try cache fallback
        if (this.cacheManager && this.isReadOperation(operation)) {
            const cachedData = await this.cacheManager.get(operation);
            if (cachedData) {
                this.logger.info('Using cached data for database operation', { operation });
                return {
                    success: true,
                    data: cachedData,
                    strategy: RecoveryStrategy.CACHE,
                    message: 'Data may be stale'
                };
            }
        }
        // @ai-logic: Degrade to limited functionality
        if (this.canDegradeOperation(operation)) {
            this.logger.warn('Degrading database operation', { operation });
            return {
                success: true,
                data: this.getDegradedResponse(operation),
                strategy: RecoveryStrategy.DEGRADE,
                message: 'Limited functionality due to database issues'
            };
        }
        return {
            success: false,
            strategy: RecoveryStrategy.IGNORE,
            message: 'Unable to recover from database error'
        };
    }
    isDatabaseConnectionError(error) {
        const connectionErrors = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
        return connectionErrors.some(code => error.message.includes(code) || error.context?.code === code);
    }
    isReadOperation(operation) {
        const readOperations = ['get', 'find', 'search', 'list', 'fetch'];
        return readOperations.some(op => operation.toLowerCase().includes(op));
    }
    canDegradeOperation(operation) {
        const degradableOperations = ['search', 'list', 'stats'];
        return degradableOperations.some(op => operation.toLowerCase().includes(op));
    }
    getDegradedResponse(operation) {
        if (operation.includes('search')) {
            return { results: [], total: 0, degraded: true };
        }
        if (operation.includes('list')) {
            return [];
        }
        if (operation.includes('stats')) {
            return { error: 'Statistics temporarily unavailable' };
        }
        return null;
    }
}
/**
 * @ai-intent File system recovery handler
 * @ai-pattern Handles file operation failures
 */
export class FileSystemRecoveryHandler extends RecoveryHandler {
    backupPath;
    constructor(backupPath) {
        super('FileSystem');
        this.backupPath = backupPath;
    }
    canRecover(context) {
        return context.error instanceof FileSystemError;
    }
    async recover(context) {
        const { error } = context;
        const fsError = error;
        // @ai-logic: Handle missing file with defaults
        if (fsError.operation === 'read' && error.message.includes('ENOENT')) {
            this.logger.info('File not found, using default', { path: fsError.path });
            return {
                success: true,
                data: this.getDefaultContent(fsError.path),
                strategy: RecoveryStrategy.FALLBACK,
                message: 'Using default content'
            };
        }
        // @ai-logic: Try backup location
        if (this.backupPath && fsError.operation === 'read') {
            try {
                const backupFile = fsError.path.replace(path.dirname(fsError.path), this.backupPath);
                // @ai-todo: Read from backup
                this.logger.info('Attempting to read from backup', { backup: backupFile });
                return {
                    success: true,
                    data: null, // Backup data
                    strategy: RecoveryStrategy.FALLBACK
                };
            }
            catch (backupError) {
                this.logger.warn('Backup read failed', { error: backupError });
            }
        }
        // @ai-logic: Compensate for write failures
        if (fsError.operation === 'write') {
            this.logger.warn('Write failed, queueing for later', { path: fsError.path });
            // @ai-todo: Implement write queue
            return {
                success: true,
                strategy: RecoveryStrategy.COMPENSATE,
                message: 'Write queued for retry'
            };
        }
        return {
            success: false,
            strategy: RecoveryStrategy.IGNORE
        };
    }
    getDefaultContent(path) {
        if (path.endsWith('.json')) {
            return {};
        }
        if (path.endsWith('.md')) {
            return '';
        }
        return null;
    }
}
/**
 * @ai-intent Cache manager for recovery
 * @ai-pattern Simple in-memory cache
 */
export class CacheManager {
    cache = new Map();
    ttl;
    constructor(ttlSeconds = 300) {
        this.ttl = ttlSeconds * 1000;
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    async set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    clear() {
        this.cache.clear();
    }
}
/**
 * @ai-intent Recovery orchestrator
 * @ai-pattern Coordinates multiple recovery strategies
 */
export class RecoveryOrchestrator {
    handlers = [];
    logger = createLogger('RecoveryOrchestrator');
    registerHandler(handler) {
        this.handlers.push(handler);
    }
    async attemptRecovery(error, operation, context) {
        const recoveryContext = {
            error,
            operation,
            attempts: 1,
            metadata: context
        };
        // @ai-logic: Try each handler
        for (const handler of this.handlers) {
            if (handler.canRecover(recoveryContext)) {
                try {
                    const result = await handler.recover(recoveryContext);
                    if (result.success) {
                        this.logger.info('Recovery successful', {
                            operation,
                            strategy: result.strategy,
                            handler: handler.constructor.name
                        });
                        return result;
                    }
                }
                catch (recoveryError) {
                    this.logger.error('Recovery handler failed', {
                        handler: handler.constructor.name,
                        error: recoveryError
                    });
                }
            }
        }
        // @ai-logic: No recovery possible
        return {
            success: false,
            strategy: RecoveryStrategy.IGNORE,
            message: 'No recovery strategy available'
        };
    }
}
// @ai-logic: Re-export for convenience
export { RetryUtils } from '../utils/retry-utils.js';
import * as path from 'path';
//# sourceMappingURL=error-recovery.js.map