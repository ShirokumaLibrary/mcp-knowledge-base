/**
 * @ai-context Secure handler wrappers with security features
 * @ai-pattern Defense in depth implementation
 * @ai-critical Applies all security layers to handlers
 * @ai-why Single point for security enforcement
 */

import { BaseHandler } from '../handlers/base-handler.js';
import { InputSanitizer, createSanitizationMiddleware } from './input-sanitizer.js';
import { RateLimiter } from './rate-limiter.js';
import type { Permission} from './access-control.js';
import { AccessControlManager, ResourceType, createUserContext } from './access-control.js';
import { createLogger } from '../utils/logger.js';
import { BaseError, ValidationError } from '../errors/custom-errors.js';
import { redactSensitiveFields } from './security-utils.js';

const logger = createLogger('SecureHandlers');

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
export class SecureHandler extends BaseHandler {
  private rateLimiter?: RateLimiter;
  private accessControl?: AccessControlManager;

  constructor(
    databasePath: string,
    private securityConfig: SecurityConfig
  ) {
    super(databasePath);

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
  protected secureMethod<T extends (...args: any[]) => any>(
    method: T,
    methodName: string,
    options?: {
      sanitizeSchema?: Record<string, (input: unknown) => unknown>;
      permission?: Permission;
      skipRateLimit?: boolean;
    }
  ): T {
    return (async (...args: Parameters<T>) => {
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
          this.accessControl.requirePermission(
            userContext,
            this.securityConfig.accessControl.resource,
            options.permission
          );
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
      } catch (error) {
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
    }) as T;
  }

  /**
   * @ai-intent Validate request size and structure
   * @ai-pattern Prevent DoS through large requests
   */
  private validateRequest(params: any, _methodName: string): void {
    // Size check
    const maxSize = this.securityConfig.validation?.maxRequestSize || 1048576; // 1MB default
    const size = JSON.stringify(params).length;

    if (size > maxSize) {
      throw new ValidationError(
        'Request too large',
        [{ field: 'request', message: 'Exceeds size limit', value: size }]
      );
    }

    // Structure check
    if (typeof params !== 'object' || params === null) {
      throw new ValidationError(
        'Invalid request format',
        [{ field: 'request', message: 'Must be an object', value: typeof params }]
      );
    }
  }

  /**
   * @ai-intent Sanitize input parameters
   * @ai-pattern Apply sanitization schema
   * @ai-return Sanitized parameters
   */
  private sanitizeInput(
    params: any,
    schema: Record<string, (input: unknown) => unknown>
  ): any {
    const sanitizer = createSanitizationMiddleware(schema);
    return sanitizer(params);
  }

  /**
   * @ai-intent Create standard sanitization schemas
   * @ai-pattern Common schemas for reuse
   */
  static readonly SANITIZATION_SCHEMAS = {
    createItem: {
      type: (input: any) => InputSanitizer.sanitizeString(input, 'type'),
      title: (input: any) => InputSanitizer.sanitizeString(input, 'title'),
      content: (input: any) => InputSanitizer.sanitizeString(input, 'content'),
      description: (input: any) => input ? InputSanitizer.sanitizeString(input, 'description') : undefined,
      tags: (input: any) => input ? InputSanitizer.sanitizeArray(
        input,
        'tags',
        (tag: any) => InputSanitizer.sanitizeString(tag, 'tag'),
        { maxLength: 20 }
      ) : undefined,
      priority: (input: any) => input ? InputSanitizer.sanitizeEnum(input, 'priority', ['high', 'medium', 'low']) : undefined,
      status: (input: any) => input ? InputSanitizer.sanitizeString(input, 'status') : undefined
    },

    updateItem: {
      type: (input: any) => InputSanitizer.sanitizeString(input, 'type'),
      id: (input: any) => InputSanitizer.sanitizeNumber(input, 'id', { min: 1 }),
      title: (input: any) => input !== undefined ? InputSanitizer.sanitizeString(input, 'title') : undefined,
      content: (input: any) => input !== undefined ? InputSanitizer.sanitizeString(input, 'content') : undefined,
      description: (input: any) => input !== undefined ? InputSanitizer.sanitizeString(input, 'description') : undefined,
      tags: (input: any) => input !== undefined ? InputSanitizer.sanitizeArray(
        input,
        'tags',
        (tag: any) => InputSanitizer.sanitizeString(tag, 'tag'),
        { maxLength: 20 }
      ) : undefined
    },

    deleteItem: {
      type: (input: any) => InputSanitizer.sanitizeString(input, 'type'),
      id: (input: any) => InputSanitizer.sanitizeNumber(input, 'id', { min: 1 })
    },

    getItems: {
      type: (input: any) => InputSanitizer.sanitizeString(input, 'type'),
      limit: (input: any) => input !== undefined ? InputSanitizer.sanitizeNumber(input, 'limit', { min: 1, max: 1000 }) : undefined,
      offset: (input: any) => input !== undefined ? InputSanitizer.sanitizeNumber(input, 'offset', { min: 0 }) : undefined,
      statusIds: (input: any) => input !== undefined ? InputSanitizer.sanitizeArray(
        input,
        'statusIds',
        (id: any) => InputSanitizer.sanitizeNumber(id, 'statusId', { min: 1 })
      ) : undefined
    },

    search: {
      query: (input: any) => InputSanitizer.sanitizeSearchQuery(input),
      types: (input: any) => input !== undefined ? InputSanitizer.sanitizeArray(
        input,
        'types',
        (type: any) => InputSanitizer.sanitizeString(type, 'type')
      ) : undefined
    }
  };
}

/**
 * @ai-intent Create secure handler instance
 * @ai-pattern Factory with default security config
 */
export function createSecureHandler(
  databasePath: string,
  customConfig?: Partial<SecurityConfig>
): SecureHandler {
  const defaultConfig: SecurityConfig = {
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
  const config: SecurityConfig = {
    ...defaultConfig,
    ...customConfig,
    sanitization: {
      ...defaultConfig.sanitization!,
      ...customConfig?.sanitization
    } as SecurityConfig['sanitization'],
    rateLimit: {
      ...defaultConfig.rateLimit!,
      ...customConfig?.rateLimit
    } as SecurityConfig['rateLimit'],
    accessControl: {
      ...defaultConfig.accessControl!,
      ...customConfig?.accessControl
    } as SecurityConfig['accessControl'],
    logging: {
      ...defaultConfig.logging!,
      ...customConfig?.logging
    } as SecurityConfig['logging'],
    validation: {
      ...defaultConfig.validation!,
      ...customConfig?.validation
    } as SecurityConfig['validation']
  };

  return new SecureHandler(databasePath, config);
}

/**
 * @ai-intent Security audit helper
 * @ai-pattern Log security-relevant events
 */
export class SecurityAuditor {
  private static logger = createLogger('SecurityAudit');

  static logSecurityEvent(
    event: string,
    details: Record<string, any>,
    severity: 'info' | 'warn' | 'error' = 'info'
  ): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      details: redactSensitiveFields(details),
      source: 'mcp-knowledge-base'
    };

    this.logger[severity]('Security event', auditEntry);
  }

  static logAuthenticationAttempt(
    success: boolean,
    userId?: string,
    ip?: string,
    reason?: string
  ): void {
    this.logSecurityEvent(
      'authentication_attempt',
      { success, userId, ip, reason },
      success ? 'info' : 'warn'
    );
  }

  static logAuthorizationFailure(
    userId: string,
    resource: string,
    permission: string,
    ip?: string
  ): void {
    this.logSecurityEvent(
      'authorization_failure',
      { userId, resource, permission, ip },
      'warn'
    );
  }

  static logSuspiciousActivity(
    type: string,
    details: Record<string, any>,
    ip?: string
  ): void {
    this.logSecurityEvent(
      'suspicious_activity',
      { type, ...details, ip },
      'error'
    );
  }
}