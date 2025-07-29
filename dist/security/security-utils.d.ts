/**
 * @ai-context Security utility functions
 * @ai-pattern Common security helpers and validators
 * @ai-critical Security best practices implementation
 * @ai-why Centralized security functions for consistency
 */
/**
 * @ai-intent Generate cryptographically secure random string
 * @ai-pattern For tokens, IDs, and secrets
 * @ai-return Base64 URL-safe string
 */
export declare function generateSecureToken(bytes?: number): string;
/**
 * @ai-intent Hash sensitive data
 * @ai-pattern One-way hashing for passwords
 * @ai-critical Never store plain text passwords
 */
export declare function hashPassword(password: string, salt?: string): string;
/**
 * @ai-intent Verify password hash
 * @ai-pattern Compare password with stored hash
 * @ai-return true if password matches
 */
export declare function verifyPassword(password: string, hashedPassword: string): boolean;
/**
 * @ai-intent Generate HMAC signature
 * @ai-pattern For request signing and verification
 * @ai-usage API authentication
 */
export declare function generateHmac(data: string, secret: string): string;
/**
 * @ai-intent Verify HMAC signature
 * @ai-pattern Constant-time comparison
 * @ai-critical Prevents timing attacks
 */
export declare function verifyHmac(data: string, signature: string, secret: string): boolean;
/**
 * @ai-intent Encrypt sensitive data
 * @ai-pattern AES-256-GCM encryption
 * @ai-usage For storing sensitive configuration
 */
export declare function encrypt(text: string, key: string): {
    encrypted: string;
    iv: string;
    tag: string;
};
/**
 * @ai-intent Decrypt sensitive data
 * @ai-pattern AES-256-GCM decryption
 * @ai-return Decrypted text or null on failure
 */
export declare function decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
}, key: string): string | null;
/**
 * @ai-intent Mask sensitive data for logging
 * @ai-pattern Partial masking for identification
 * @ai-usage Log sanitization
 */
export declare function maskSensitiveData(data: string, visibleChars?: number): string;
/**
 * @ai-intent Validate email format
 * @ai-pattern RFC-compliant email validation
 * @ai-return true if valid email
 */
export declare function isValidEmail(email: string): boolean;
/**
 * @ai-intent Validate URL format
 * @ai-pattern Safe URL validation
 * @ai-usage Prevent malicious URLs
 */
export declare function isValidUrl(url: string, allowedProtocols?: string[]): boolean;
/**
 * @ai-intent Generate secure session ID
 * @ai-pattern Cryptographically secure session identifiers
 * @ai-usage For session management
 */
export declare function generateSessionId(): string;
/**
 * @ai-intent Sanitize filename
 * @ai-pattern Remove dangerous characters from filenames
 * @ai-usage For file upload security
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * @ai-intent Check password strength
 * @ai-pattern NIST guidelines for password security
 * @ai-return Strength score and feedback
 */
export declare function checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
};
/**
 * @ai-intent Time-constant string comparison
 * @ai-pattern Prevent timing attacks
 * @ai-critical Use for sensitive comparisons
 */
export declare function secureCompare(a: string, b: string): boolean;
/**
 * @ai-intent Generate CSRF token
 * @ai-pattern Cross-Site Request Forgery prevention
 * @ai-usage For form submissions
 */
export declare function generateCsrfToken(): string;
/**
 * @ai-intent Redact sensitive fields from object
 * @ai-pattern Remove sensitive data before logging
 * @ai-usage Log sanitization
 */
export declare function redactSensitiveFields(obj: unknown, sensitiveFields?: string[]): unknown;
