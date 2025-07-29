import * as crypto from 'crypto';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('SecurityUtils');
export function generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('base64url');
}
export function hashPassword(password, salt) {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
}
export function verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
    return hash === verifyHash.toString('hex');
}
export function generateHmac(data, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');
}
export function verifyHmac(data, signature, secret) {
    const expected = generateHmac(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
export function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
    };
}
export function decrypt(encryptedData, key) {
    try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(encryptedData.iv, 'hex'));
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        logger.error('Decryption failed', { error });
        return null;
    }
}
export function maskSensitiveData(data, visibleChars = 4) {
    if (data.length <= visibleChars * 2) {
        return '*'.repeat(data.length);
    }
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const masked = '*'.repeat(Math.max(4, data.length - visibleChars * 2));
    return `${start}${masked}${end}`;
}
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return false;
    }
    if (email.length > 254) {
        return false;
    }
    const [localPart] = email.split('@');
    if (localPart.length > 64) {
        return false;
    }
    return true;
}
export function isValidUrl(url, allowedProtocols = ['http:', 'https:']) {
    try {
        const parsed = new URL(url);
        if (!allowedProtocols.includes(parsed.protocol)) {
            return false;
        }
        if (parsed.username || parsed.password) {
            return false;
        }
        if (process.env.NODE_ENV === 'production') {
            const hostname = parsed.hostname;
            if (hostname === 'localhost' ||
                hostname === '127.0.0.1' ||
                hostname.startsWith('192.168.') ||
                hostname.startsWith('10.') ||
                hostname.startsWith('172.')) {
                return false;
            }
        }
        return true;
    }
    catch {
        return false;
    }
}
export function generateSessionId() {
    return generateSecureToken(32);
}
export function sanitizeFilename(filename) {
    let sanitized = filename.replace(/[/\\]/g, '');
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
    sanitized = sanitized.replace(/^\.+/, '');
    if (sanitized.length > 255) {
        const ext = sanitized.substring(sanitized.lastIndexOf('.'));
        sanitized = sanitized.substring(0, 255 - ext.length) + ext;
    }
    if (!sanitized) {
        sanitized = 'unnamed';
    }
    return sanitized;
}
export function checkPasswordStrength(password) {
    const feedback = [];
    let score = 0;
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
    if (/^[0-9]+$/.test(password)) {
        score -= 20;
        feedback.push('Avoid using only numbers');
    }
    if (/^[a-zA-Z]+$/.test(password)) {
        score -= 10;
        feedback.push('Consider adding numbers or symbols');
    }
    if (/012|123|234|345|456|567|678|789|890/.test(password)) {
        score -= 10;
        feedback.push('Avoid sequential numbers');
    }
    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) {
        score -= 10;
        feedback.push('Avoid sequential letters');
    }
    if (/(.)\1{2,}/.test(password)) {
        score -= 10;
        feedback.push('Avoid repeated characters');
    }
    score = Math.max(0, Math.min(100, score));
    if (score < 40) {
        feedback.unshift('Weak password');
    }
    else if (score < 70) {
        feedback.unshift('Moderate password');
    }
    else {
        feedback.unshift('Strong password');
    }
    return { score, feedback };
}
export function secureCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export function generateCsrfToken() {
    return generateSecureToken(24);
}
export function redactSensitiveFields(obj, sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential']) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    const redacted = Array.isArray(obj) ? [...obj] : { ...obj };
    if (!Array.isArray(redacted)) {
        for (const key in redacted) {
            const lowerKey = key.toLowerCase();
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                redacted[key] = '[REDACTED]';
            }
            else if (typeof redacted[key] === 'object') {
                redacted[key] = redactSensitiveFields(redacted[key], sensitiveFields);
            }
        }
    }
    return redacted;
}
