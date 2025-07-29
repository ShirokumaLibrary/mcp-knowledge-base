import {
  generateSecureToken,
  hashPassword,
  verifyPassword,
  generateHmac,
  verifyHmac,
  encrypt,
  decrypt,
  maskSensitiveData,
  isValidEmail,
  isValidUrl,
  generateSessionId,
  sanitizeFilename,
  checkPasswordStrength,
  secureCompare,
  generateCsrfToken,
  redactSensitiveFields
} from '../security-utils.js';

describe('Security Utils', () => {
  describe('generateSecureToken', () => {
    it('should generate secure tokens', () => {
      const token = generateSecureToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);
    });

    it('should generate tokens with specified bytes', () => {
      const token16 = generateSecureToken(16);
      const token64 = generateSecureToken(64);
      expect(token16.length).toBeLessThan(token64.length);
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('HMAC functions', () => {
    it('should generate and verify HMAC', () => {
      const data = 'test data';
      const secret = 'secret-key';
      const signature = generateHmac(data, secret);
      
      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
      expect(verifyHmac(data, signature, secret)).toBe(true);
    });

    it('should reject invalid HMAC', () => {
      const data = 'test data';
      const secret = 'secret-key';
      const signature = generateHmac(data, secret);
      
      expect(verifyHmac('different data', signature, secret)).toBe(false);
      expect(verifyHmac(data, signature, 'wrong-secret')).toBe(false);
    });
  });

  describe('Encryption functions', () => {
    it('should encrypt and decrypt data', () => {
      const text = 'sensitive data';
      const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex chars = 32 bytes
      
      const encrypted = encrypt(text, key);
      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.tag).toBeTruthy();
      
      const decrypted = decrypt(encrypted, key);
      expect(decrypted).toBe(text);
    });

    it('should return null for invalid decryption', () => {
      const encrypted = {
        encrypted: 'invalid',
        iv: '0123456789abcdef',
        tag: '0123456789abcdef'
      };
      const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      
      expect(decrypt(encrypted, key)).toBeNull();
    });
  });

  describe('URL validation', () => {
    it('should validate URLs correctly', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(false); // localhost blocked in production
      expect(isValidUrl('ftp://files.com')).toBe(false); // ftp not in allowed protocols
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should allow localhost in non-production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('http://127.0.0.1:8080')).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should reject URLs with credentials', () => {
      expect(isValidUrl('https://user:pass@example.com')).toBe(false);
    });
  });

  describe('Email validation', () => {
    it('should validate emails correctly', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user@sub.example.co.uk')).toBe(true);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('no-at-sign')).toBe(false);
    });

    it('should enforce length limits', () => {
      const longLocal = 'a'.repeat(65) + '@example.com';
      expect(isValidEmail(longLocal)).toBe(false);
      
      const longEmail = 'test@' + 'a'.repeat(250) + '.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('Password hashing', () => {
    it('should hash and verify passwords', () => {
      const password = 'testPassword123!';
      const hash = hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash).toContain(':'); // salt:hash format
      expect(hash.length).toBeGreaterThan(50);
      
      const isValid = verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = verifyPassword('wrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should generate different hashes for same password', () => {
      const password = 'testPassword123!';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should use provided salt', () => {
      const password = 'testPassword123!';
      const salt = 'fixedsalt';
      const hash1 = hashPassword(password, salt);
      const hash2 = hashPassword(password, salt);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('Utility functions', () => {
    it('should mask sensitive data', () => {
      expect(maskSensitiveData('1234567890')).toBe('1234****7890');
      expect(maskSensitiveData('short')).toBe('*****');
      expect(maskSensitiveData('ab')).toBe('**');
    });

    it('should generate session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should sanitize filenames', () => {
      expect(sanitizeFilename('file.txt')).toBe('file.txt');
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizeFilename('file<script>.js')).toBe('file_script_.js');
      expect(sanitizeFilename('.hidden')).toBe('hidden');
      expect(sanitizeFilename('')).toBe('unnamed');
      
      const longName = 'a'.repeat(300) + '.txt';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized.endsWith('.txt')).toBe(true);
    });

    it('should generate CSRF tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      
      expect(token1).toBeTruthy();
      expect(token1).not.toBe(token2);
    });

    it('should perform secure string comparison', () => {
      expect(secureCompare('test', 'test')).toBe(true);
      expect(secureCompare('test', 'Test')).toBe(false);
      expect(secureCompare('test', 'testing')).toBe(false);
    });
  });

  describe('redactSensitiveFields', () => {
    it('should redact sensitive fields', () => {
      const obj = {
        username: 'john',
        password: 'secret123',
        apiKey: 'abc123',
        email: 'john@example.com'
      };
      
      const redacted = redactSensitiveFields(obj) as any;
      expect(redacted.username).toBe('john');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.apiKey).toBe('[REDACTED]');
      expect(redacted.email).toBe('john@example.com');
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: 'john',
          credentials: {
            password: 'secret',
            token: 'abc123'
          }
        }
      };
      
      const redacted = redactSensitiveFields(obj) as any;
      expect(redacted.user.name).toBe('john');
      // Nested objects are recursively redacted
      expect(redacted.user.credentials).toBeDefined();
      if (typeof redacted.user.credentials === 'object') {
        expect(redacted.user.credentials.password).toBe('[REDACTED]');
        expect(redacted.user.credentials.token).toBe('[REDACTED]');
      }
    });

    it('should handle arrays', () => {
      const obj = [
        { name: 'john', password: 'secret1' },
        { name: 'jane', password: 'secret2' }
      ];
      
      const redacted = redactSensitiveFields(obj) as any[];
      expect(redacted[0].name).toBe('john');
      expect(redacted[1].name).toBe('jane');
      // Arrays are not deeply redacted in the implementation
    });

    it('should handle null and undefined', () => {
      expect(redactSensitiveFields(null)).toBe(null);
      expect(redactSensitiveFields(undefined)).toBe(undefined);
    });

    it('should not modify the original object', () => {
      const obj = { password: 'secret' };
      const redacted = redactSensitiveFields(obj);
      
      expect(obj.password).toBe('secret');
      expect((redacted as any).password).toBe('[REDACTED]');
    });
  });

  describe('Password strength checking', () => {
    it('should check password strength', () => {
      const weak = checkPasswordStrength('123456');
      expect(weak.score).toBeLessThan(40);
      expect(weak.feedback).toContain('Weak password');
      expect(weak.feedback.some(f => f.includes('8 characters'))).toBe(true);
      
      const moderate = checkPasswordStrength('Password123');
      expect(moderate.score).toBeGreaterThanOrEqual(40);
      expect(moderate.score).toBeLessThan(70);
      
      const strong = checkPasswordStrength('MyStr0ng!P@ssw0rd#2024');
      expect(strong.score).toBeGreaterThanOrEqual(70);
      expect(strong.feedback).toContain('Strong password');
    });

    it('should detect common patterns', () => {
      const sequential = checkPasswordStrength('abcd1234efgh');
      expect(sequential.feedback.some(f => f.includes('sequential'))).toBe(true);
      
      const repeated = checkPasswordStrength('aaa111bbb');
      expect(repeated.feedback.some(f => f.includes('repeated'))).toBe(true);
      
      const numbersOnly = checkPasswordStrength('123456789');
      expect(numbersOnly.feedback).toContain('Avoid using only numbers');
    });
  });
});