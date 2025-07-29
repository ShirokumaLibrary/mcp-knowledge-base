/**
 * @ai-context Security utility functions
 * @ai-pattern Common security helpers and validators
 * @ai-critical Security best practices implementation
 * @ai-why Centralized security functions for consistency
 */

import * as crypto from 'crypto';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SecurityUtils');

/**
 * @ai-intent Generate cryptographically secure random string
 * @ai-pattern For tokens, IDs, and secrets
 * @ai-return Base64 URL-safe string
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * @ai-intent Hash sensitive data
 * @ai-pattern One-way hashing for passwords
 * @ai-critical Never store plain text passwords
 */
export function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512');

  return `${actualSalt}:${hash.toString('hex')}`;
}

/**
 * @ai-intent Verify password hash
 * @ai-pattern Compare password with stored hash
 * @ai-return true if password matches
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');

  return hash === verifyHash.toString('hex');
}

/**
 * @ai-intent Generate HMAC signature
 * @ai-pattern For request signing and verification
 * @ai-usage API authentication
 */
export function generateHmac(data: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * @ai-intent Verify HMAC signature
 * @ai-pattern Constant-time comparison
 * @ai-critical Prevents timing attacks
 */
export function verifyHmac(data: string, signature: string, secret: string): boolean {
  const expected = generateHmac(data, secret);

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

/**
 * @ai-intent Encrypt sensitive data
 * @ai-pattern AES-256-GCM encryption
 * @ai-usage For storing sensitive configuration
 */
export function encrypt(text: string, key: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    iv
  );

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * @ai-intent Decrypt sensitive data
 * @ai-pattern AES-256-GCM decryption
 * @ai-return Decrypted text or null on failure
 */
export function decrypt(
  encryptedData: { encrypted: string; iv: string; tag: string },
  key: string
): string | null {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', { error });
    return null;
  }
}

/**
 * @ai-intent Mask sensitive data for logging
 * @ai-pattern Partial masking for identification
 * @ai-usage Log sanitization
 */
export function maskSensitiveData(
  data: string,
  visibleChars: number = 4
): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }

  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(Math.max(4, data.length - visibleChars * 2));

  return `${start}${masked}${end}`;
}

/**
 * @ai-intent Validate email format
 * @ai-pattern RFC-compliant email validation
 * @ai-return true if valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Basic format check
  if (!emailRegex.test(email)) {
    return false;
  }

  // Length check
  if (email.length > 254) {
    return false;
  }

  // Local part length check
  const [localPart] = email.split('@');
  if (localPart.length > 64) {
    return false;
  }

  return true;
}

/**
 * @ai-intent Validate URL format
 * @ai-pattern Safe URL validation
 * @ai-usage Prevent malicious URLs
 */
export function isValidUrl(url: string, allowedProtocols = ['http:', 'https:']): boolean {
  try {
    const parsed = new URL(url);

    // Protocol check
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }

    // No credentials in URL
    if (parsed.username || parsed.password) {
      return false;
    }

    // No localhost/private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname;
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * @ai-intent Generate secure session ID
 * @ai-pattern Cryptographically secure session identifiers
 * @ai-usage For session management
 */
export function generateSessionId(): string {
  return generateSecureToken(32);
}

/**
 * @ai-intent Sanitize filename
 * @ai-pattern Remove dangerous characters from filenames
 * @ai-usage For file upload security
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/[/\\]/g, '');

  // Remove special characters except dots, dashes, underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  // Default if empty
  if (!sanitized) {
    sanitized = 'unnamed';
  }

  return sanitized;
}

/**
 * @ai-intent Check password strength
 * @ai-pattern NIST guidelines for password security
 * @ai-return Strength score and feedback
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-100
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check (most important)
  if (password.length >= 8) {
    score += 20;
  }
  if (password.length >= 12) {
    score += 20;
  }
  if (password.length >= 16) {
    score += 20;
  }

  if (password.length < 8) {
    feedback.push('Password should be at least 8 characters');
  }

  // Character variety
  if (/[a-z]/.test(password)) {
    score += 10;
  }
  if (/[A-Z]/.test(password)) {
    score += 10;
  }
  if (/[0-9]/.test(password)) {
    score += 10;
  }
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 10;
  }

  // Common patterns (negative score)
  if (/^[0-9]+$/.test(password)) {
    score -= 20;
    feedback.push('Avoid using only numbers');
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 10;
    feedback.push('Consider adding numbers or symbols');
  }

  // Sequential characters
  if (/012|123|234|345|456|567|678|789|890/.test(password)) {
    score -= 10;
    feedback.push('Avoid sequential numbers');
  }

  if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
    score -= 10;
    feedback.push('Avoid sequential letters');
  }

  // Repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeated characters');
  }

  // Ensure score is 0-100
  score = Math.max(0, Math.min(100, score));

  // Overall feedback
  if (score < 40) {
    feedback.unshift('Weak password');
  } else if (score < 70) {
    feedback.unshift('Moderate password');
  } else {
    feedback.unshift('Strong password');
  }

  return { score, feedback };
}

/**
 * @ai-intent Time-constant string comparison
 * @ai-pattern Prevent timing attacks
 * @ai-critical Use for sensitive comparisons
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
}

/**
 * @ai-intent Generate CSRF token
 * @ai-pattern Cross-Site Request Forgery prevention
 * @ai-usage For form submissions
 */
export function generateCsrfToken(): string {
  return generateSecureToken(24);
}

/**
 * @ai-intent Redact sensitive fields from object
 * @ai-pattern Remove sensitive data before logging
 * @ai-usage Log sanitization
 */
export function redactSensitiveFields(
  obj: unknown,
  sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential']
): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const redacted = Array.isArray(obj) ? [...obj] : { ...(obj as Record<string, unknown>) };

  if (!Array.isArray(redacted)) {
    for (const key in redacted) {
      const lowerKey = key.toLowerCase();

      // Check if field name contains sensitive keywords
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        (redacted as Record<string, unknown>)[key] = '[REDACTED]';
      } else if (typeof (redacted as Record<string, unknown>)[key] === 'object') {
        (redacted as Record<string, unknown>)[key] = redactSensitiveFields((redacted as Record<string, unknown>)[key], sensitiveFields);
      }
    }
  }

  return redacted;
}