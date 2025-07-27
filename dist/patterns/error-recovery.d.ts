/**
 * @ai-context Error recovery patterns for resilient operations
 * @ai-pattern Recovery strategies for different error scenarios
 * @ai-critical Enables graceful degradation and self-healing
 * @ai-why Improves system reliability and user experience
 * @ai-assumption Some operations can be recovered or have fallbacks
 */
import type { Logger } from 'winston';
import type { BaseError } from '../errors/custom-errors.js';
import type { IDatabase } from '../database/interfaces/repository-interfaces.js';
/**
 * @ai-intent Recovery strategy types
 * @ai-pattern Different approaches to error recovery
 */
export declare enum RecoveryStrategy {
    RETRY = "RETRY",
    FALLBACK = "FALLBACK",
    CACHE = "CACHE",
    DEGRADE = "DEGRADE",
    COMPENSATE = "COMPENSATE",
    IGNORE = "IGNORE"
}
/**
 * @ai-intent Recovery context information
 * @ai-pattern Context for recovery decisions
 */
export interface RecoveryContext {
    error: BaseError;
    operation: string;
    attempts: number;
    data?: unknown;
    metadata?: Record<string, unknown>;
}
/**
 * @ai-intent Recovery action result
 * @ai-pattern Outcome of recovery attempt
 */
export interface RecoveryResult<T> {
    success: boolean;
    data?: T;
    strategy: RecoveryStrategy;
    message?: string;
}
/**
 * @ai-intent Abstract recovery handler
 * @ai-pattern Strategy pattern for recovery
 */
export declare abstract class RecoveryHandler<T> {
    protected name: string;
    protected logger: Logger;
    constructor(name: string);
    /**
     * @ai-intent Determine if recovery is possible
     * @ai-pattern Recovery feasibility check
     */
    abstract canRecover(context: RecoveryContext): boolean;
    /**
     * @ai-intent Execute recovery strategy
     * @ai-pattern Recovery implementation
     */
    abstract recover(context: RecoveryContext): Promise<RecoveryResult<T>>;
}
/**
 * @ai-intent Database recovery handler
 * @ai-pattern Handles database-related failures
 * @ai-critical Ensures data operations can continue
 */
export declare class DatabaseRecoveryHandler extends RecoveryHandler<any> {
    private database;
    private cacheManager?;
    constructor(database: IDatabase, cacheManager?: CacheManager | undefined);
    canRecover(context: RecoveryContext): boolean;
    recover(context: RecoveryContext): Promise<RecoveryResult<any>>;
    private isDatabaseConnectionError;
    private isReadOperation;
    private canDegradeOperation;
    private getDegradedResponse;
}
/**
 * @ai-intent File system recovery handler
 * @ai-pattern Handles file operation failures
 */
export declare class FileSystemRecoveryHandler extends RecoveryHandler<any> {
    private backupPath?;
    constructor(backupPath?: string | undefined);
    canRecover(context: RecoveryContext): boolean;
    recover(context: RecoveryContext): Promise<RecoveryResult<any>>;
    private getDefaultContent;
}
/**
 * @ai-intent Cache manager for recovery
 * @ai-pattern Simple in-memory cache
 */
export declare class CacheManager {
    private cache;
    private readonly ttl;
    constructor(ttlSeconds?: number);
    get(key: string): Promise<any | null>;
    set(key: string, data: any): Promise<void>;
    clear(): void;
}
/**
 * @ai-intent Recovery orchestrator
 * @ai-pattern Coordinates multiple recovery strategies
 */
export declare class RecoveryOrchestrator {
    private handlers;
    private readonly logger;
    registerHandler(handler: RecoveryHandler<any>): void;
    attemptRecovery<T>(error: BaseError, operation: string, context?: Record<string, unknown>): Promise<RecoveryResult<T>>;
}
export { RetryUtils } from '../utils/retry-utils.js';
