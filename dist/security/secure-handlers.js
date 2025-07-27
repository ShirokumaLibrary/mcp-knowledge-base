/**
 * @ai-context Secure handler wrappers with security features
 * @ai-pattern Defense in depth implementation
 * @ai-critical Applies all security layers to handlers
 * @ai-why Single point for security enforcement
 */
import { BaseHandler } from '../handlers/base-handler.js';
import { InputSanitizer, createSanitizationMiddleware } from './input-sanitizer.js';
import { RateLimiter } from './rate-limiter.js';
import { AccessControlManager, ResourceType, createUserContext } from './access-control.js';
import { createLogger } from '../utils/logger.js';
import { BaseError, ValidationError } from '../errors/custom-errors.js';
import { redactSensitiveFields } from './security-utils.js';
const logger = createLogger('SecureHandlers');
/**
 * @ai-intent Secure handler wrapper
 * @ai-pattern Decorator pattern for security layers
 * @ai-critical Applies multiple security controls
 */
export class SecureHandler extends BaseHandler {
    securityConfig;
    rateLimiter;
    accessControl;
    constructor(databasePath, securityConfig) {
        super(databasePath);
        this.securityConfig = securityConfig;
        // Initialize security components
        if (securityConfig.rateLimit?.enabled) {
            this.rateLimiter = new RateLimiter(securityConfig.rateLimit.config);
        }
        if (securityConfig.accessControl?.enabled) {
            this.accessControl = new AccessControlManager();
        }
    }
    /**
     * @ai-intent Wrap handler method with security
     * @ai-flow 1. Validate -> 2. Sanitize -> 3. Rate limit -> 4. Access control -> 5. Execute -> 6. Log
     * @ai-return Secured handler function
     */
    secureMethod(method, methodName, options) {
        return (async (...args) => {
            const startTime = Date.now();
            const context = args[1] || {};
            try {
                // 1. Request validation
                if (this.securityConfig.validation?.enabled) {
                    this.validateRequest(args[0], methodName);
                }
                // 2. Input sanitization
                let sanitizedParams = args[0];
                if (this.securityConfig.sanitization?.enabled && options?.sanitizeSchema) {
                    sanitizedParams = this.sanitizeInput(args[0], options.sanitizeSchema);
                    args[0] = sanitizedParams;
                }
                // 3. Rate limiting
                if (this.securityConfig.rateLimit?.enabled && !options?.skipRateLimit && this.rateLimiter) {
                    await this.rateLimiter.checkLimit(context);
                }
                // 4. Access control
                if (this.securityConfig.accessControl?.enabled && options?.permission && this.accessControl) {
                    const userContext = context.user || createUserContext();
                    this.accessControl.requirePermission(userContext, this.securityConfig.accessControl.resource, options.permission);
                }
                // 5. Log request
                if (this.securityConfig.logging?.enabled && this.securityConfig.logging.logRequests) {
                    logger.info(`${methodName} request`, {
                        method: methodName,
                        params: redactSensitiveFields(sanitizedParams, this.securityConfig.logging.redactFields),
                        user: context.user?.userId,
                        ip: context.ip
                    });
                }
                // 6. Execute method
                const result = await method.apply(this, args);
                // 7. Log response
                if (this.securityConfig.logging?.enabled && this.securityConfig.logging.logResponses) {
                    logger.info(`${methodName} response`, {
                        method: methodName,
                        duration: Date.now() - startTime,
                        success: true,
                        user: context.user?.userId
                    });
                }
                return result;
            }
            catch (error) {
                // Log error
                if (this.securityConfig.logging?.enabled) {
                    logger.error(`${methodName} error`, {
                        method: methodName,
                        duration: Date.now() - startTime,
                        error: error instanceof BaseError ? error.toJSON() : String(error),
                        user: context?.user?.userId,
                        ip: context?.ip
                    });
                }
                throw error;
            }
        });
    }
    /**
     * @ai-intent Validate request size and structure
     * @ai-pattern Prevent DoS through large requests
     */
    validateRequest(params, methodName) {
        // Size check
        const maxSize = this.securityConfig.validation?.maxRequestSize || 1048576; // 1MB default
        const size = JSON.stringify(params).length;
        if (size > maxSize) {
            throw new ValidationError('Request too large', [{ field: 'request', message: 'Exceeds size limit', value: size }]);
        }
        // Structure check
        if (typeof params !== 'object' || params === null) {
            throw new ValidationError('Invalid request format', [{ field: 'request', message: 'Must be an object', value: typeof params }]);
        }
    }
    /**
     * @ai-intent Sanitize input parameters
     * @ai-pattern Apply sanitization schema
     * @ai-return Sanitized parameters
     */
    sanitizeInput(params, schema) {
        const sanitizer = createSanitizationMiddleware(schema);
        return sanitizer(params);
    }
    /**
     * @ai-intent Create standard sanitization schemas
     * @ai-pattern Common schemas for reuse
     */
    static SANITIZATION_SCHEMAS = {
        createItem: {
            type: (input) => InputSanitizer.sanitizeString(input, 'type'),
            title: (input) => InputSanitizer.sanitizeString(input, 'title'),
            content: (input) => InputSanitizer.sanitizeString(input, 'content'),
            description: (input) => input ? InputSanitizer.sanitizeString(input, 'description') : undefined,
            tags: (input) => input ? InputSanitizer.sanitizeArray(input, 'tags', (tag) => InputSanitizer.sanitizeString(tag, 'tag'), { maxLength: 20 }) : undefined,
            priority: (input) => input ? InputSanitizer.sanitizeEnum(input, 'priority', ['high', 'medium', 'low']) : undefined,
            status: (input) => input ? InputSanitizer.sanitizeString(input, 'status') : undefined
        },
        updateItem: {
            type: (input) => InputSanitizer.sanitizeString(input, 'type'),
            id: (input) => InputSanitizer.sanitizeNumber(input, 'id', { min: 1 }),
            title: (input) => input !== undefined ? InputSanitizer.sanitizeString(input, 'title') : undefined,
            content: (input) => input !== undefined ? InputSanitizer.sanitizeString(input, 'content') : undefined,
            description: (input) => input !== undefined ? InputSanitizer.sanitizeString(input, 'description') : undefined,
            tags: (input) => input !== undefined ? InputSanitizer.sanitizeArray(input, 'tags', (tag) => InputSanitizer.sanitizeString(tag, 'tag'), { maxLength: 20 }) : undefined
        },
        deleteItem: {
            type: (input) => InputSanitizer.sanitizeString(input, 'type'),
            id: (input) => InputSanitizer.sanitizeNumber(input, 'id', { min: 1 })
        },
        getItems: {
            type: (input) => InputSanitizer.sanitizeString(input, 'type'),
            limit: (input) => input !== undefined ? InputSanitizer.sanitizeNumber(input, 'limit', { min: 1, max: 1000 }) : undefined,
            offset: (input) => input !== undefined ? InputSanitizer.sanitizeNumber(input, 'offset', { min: 0 }) : undefined,
            statusIds: (input) => input !== undefined ? InputSanitizer.sanitizeArray(input, 'statusIds', (id) => InputSanitizer.sanitizeNumber(id, 'statusId', { min: 1 })) : undefined
        },
        search: {
            query: (input) => InputSanitizer.sanitizeSearchQuery(input),
            types: (input) => input !== undefined ? InputSanitizer.sanitizeArray(input, 'types', (type) => InputSanitizer.sanitizeString(type, 'type')) : undefined
        }
    };
}
/**
 * @ai-intent Create secure handler instance
 * @ai-pattern Factory with default security config
 */
export function createSecureHandler(databasePath, customConfig) {
    const defaultConfig = {
        sanitization: {
            enabled: true,
            schemas: SecureHandler.SANITIZATION_SCHEMAS
        },
        rateLimit: {
            enabled: true,
            config: RateLimiter.PRESETS.normal
        },
        accessControl: {
            enabled: false, // Disabled by default, enable per deployment
            resource: ResourceType.SYSTEM,
            permissions: {}
        },
        logging: {
            enabled: true,
            logRequests: true,
            logResponses: true,
            redactFields: ['password', 'token', 'secret', 'key']
        },
        validation: {
            enabled: true,
            maxRequestSize: 1048576 // 1MB
        }
    };
    // Merge configs
    const config = {
        ...defaultConfig,
        ...customConfig,
        sanitization: {
            ...defaultConfig.sanitization,
            ...customConfig?.sanitization
        },
        rateLimit: {
            ...defaultConfig.rateLimit,
            ...customConfig?.rateLimit
        },
        accessControl: {
            ...defaultConfig.accessControl,
            ...customConfig?.accessControl
        },
        logging: {
            ...defaultConfig.logging,
            ...customConfig?.logging
        },
        validation: {
            ...defaultConfig.validation,
            ...customConfig?.validation
        }
    };
    return new SecureHandler(databasePath, config);
}
/**
 * @ai-intent Security audit helper
 * @ai-pattern Log security-relevant events
 */
export class SecurityAuditor {
    static logger = createLogger('SecurityAudit');
    static logSecurityEvent(event, details, severity = 'info') {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            event,
            severity,
            details: redactSensitiveFields(details),
            source: 'mcp-knowledge-base'
        };
        this.logger[severity]('Security event', auditEntry);
    }
    static logAuthenticationAttempt(success, userId, ip, reason) {
        this.logSecurityEvent('authentication_attempt', { success, userId, ip, reason }, success ? 'info' : 'warn');
    }
    static logAuthorizationFailure(userId, resource, permission, ip) {
        this.logSecurityEvent('authorization_failure', { userId, resource, permission, ip }, 'warn');
    }
    static logSuspiciousActivity(type, details, ip) {
        this.logSecurityEvent('suspicious_activity', { type, ...details, ip }, 'error');
    }
}
//# sourceMappingURL=secure-handlers.js.map