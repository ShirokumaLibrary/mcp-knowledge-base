/**
 * @ai-context Secure handler wrappers with security features
 * @ai-pattern Defense in depth implementation
 * @ai-critical Applies all security layers to handlers
 * @ai-why Single point for security enforcement
 */
import { BaseHandler } from '../handlers/base-handler.js';
import type { Permission } from './access-control.js';
import { ResourceType } from './access-control.js';
/**
 * @ai-intent Security configuration for handlers
 * @ai-pattern Configurable security policies
 */
export interface SecurityConfig {
    sanitization?: {
        enabled: boolean;
        schemas: Record<string, Record<string, (input: unknown) => unknown>>;
    };
    rateLimit?: {
        enabled: boolean;
        config: {
            windowMs: number;
            maxRequests: number;
        };
    };
    accessControl?: {
        enabled: boolean;
        resource: ResourceType;
        permissions: Record<string, Permission>;
    };
    logging?: {
        enabled: boolean;
        logRequests: boolean;
        logResponses: boolean;
        redactFields?: string[];
    };
    validation?: {
        enabled: boolean;
        maxRequestSize?: number;
    };
}
/**
 * @ai-intent Secure handler wrapper
 * @ai-pattern Decorator pattern for security layers
 * @ai-critical Applies multiple security controls
 */
export declare class SecureHandler extends BaseHandler {
    private securityConfig;
    private rateLimiter?;
    private accessControl?;
    constructor(databasePath: string, securityConfig: SecurityConfig);
    /**
     * @ai-intent Wrap handler method with security
     * @ai-flow 1. Validate -> 2. Sanitize -> 3. Rate limit -> 4. Access control -> 5. Execute -> 6. Log
     * @ai-return Secured handler function
     */
    protected secureMethod<T extends (...args: any[]) => any>(method: T, methodName: string, options?: {
        sanitizeSchema?: Record<string, (input: unknown) => unknown>;
        permission?: Permission;
        skipRateLimit?: boolean;
    }): T;
    /**
     * @ai-intent Validate request size and structure
     * @ai-pattern Prevent DoS through large requests
     */
    private validateRequest;
    /**
     * @ai-intent Sanitize input parameters
     * @ai-pattern Apply sanitization schema
     * @ai-return Sanitized parameters
     */
    private sanitizeInput;
    /**
     * @ai-intent Create standard sanitization schemas
     * @ai-pattern Common schemas for reuse
     */
    static readonly SANITIZATION_SCHEMAS: {
        createItem: {
            type: (input: any) => string;
            title: (input: any) => string;
            content: (input: any) => string;
            description: (input: any) => string | undefined;
            tags: (input: any) => string[] | undefined;
            priority: (input: any) => "medium" | "high" | "low" | undefined;
            status: (input: any) => string | undefined;
        };
        updateItem: {
            type: (input: any) => string;
            id: (input: any) => number;
            title: (input: any) => string | undefined;
            content: (input: any) => string | undefined;
            description: (input: any) => string | undefined;
            tags: (input: any) => string[] | undefined;
        };
        deleteItem: {
            type: (input: any) => string;
            id: (input: any) => number;
        };
        getItems: {
            type: (input: any) => string;
            limit: (input: any) => number | undefined;
            offset: (input: any) => number | undefined;
            statusIds: (input: any) => number[] | undefined;
        };
        search: {
            query: (input: any) => string;
            types: (input: any) => string[] | undefined;
        };
    };
}
/**
 * @ai-intent Create secure handler instance
 * @ai-pattern Factory with default security config
 */
export declare function createSecureHandler(databasePath: string, customConfig?: Partial<SecurityConfig>): SecureHandler;
/**
 * @ai-intent Security audit helper
 * @ai-pattern Log security-relevant events
 */
export declare class SecurityAuditor {
    private static logger;
    static logSecurityEvent(event: string, details: Record<string, any>, severity?: 'info' | 'warn' | 'error'): void;
    static logAuthenticationAttempt(success: boolean, userId?: string, ip?: string, reason?: string): void;
    static logAuthorizationFailure(userId: string, resource: string, permission: string, ip?: string): void;
    static logSuspiciousActivity(type: string, details: Record<string, any>, ip?: string): void;
}
