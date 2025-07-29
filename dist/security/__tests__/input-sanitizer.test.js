import { InputSanitizer, createSanitizationMiddleware } from '../input-sanitizer.js';
import { ValidationError } from '../../errors/custom-errors.js';
describe('InputSanitizer', () => {
    describe('sanitizeString', () => {
        it('should allow valid strings', () => {
            expect(InputSanitizer.sanitizeString('valid-string', 'test')).toBe('valid-string');
            expect(InputSanitizer.sanitizeString('  trimmed  ', 'test')).toBe('trimmed');
            expect(InputSanitizer.sanitizeString('String with spaces', 'test')).toBe('String with spaces');
        });
        it('should reject non-string inputs', () => {
            expect(() => InputSanitizer.sanitizeString(123, 'test')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeString(null, 'test')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeString(undefined, 'test')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeString({}, 'test')).toThrow(ValidationError);
        });
        it('should reject empty strings', () => {
            expect(() => InputSanitizer.sanitizeString('', 'test')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeString('   ', 'test')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeString('\t\n', 'test')).toThrow(ValidationError);
        });
        it('should enforce max length', () => {
            const longString = 'a'.repeat(51);
            expect(() => InputSanitizer.sanitizeString(longString, 'id')).toThrow(ValidationError);
            // Custom max length
            expect(() => InputSanitizer.sanitizeString('12345', 'test', 4)).toThrow(ValidationError);
            expect(InputSanitizer.sanitizeString('1234', 'test', 4)).toBe('1234');
        });
        it('should detect SQL injection attempts', () => {
            expect(() => InputSanitizer.sanitizeString('1; DROP TABLE users--', 'test')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeString('1 UNION SELECT * FROM passwords', 'test')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeString('id/*comment*/123', 'test')).toThrow(ValidationError);
        });
        it('should detect XSS attempts', () => {
            expect(() => InputSanitizer.sanitizeString('<script>alert("xss")</script>', 'test')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeString('javascript:alert(1)', 'test')).toThrow(ValidationError);
        });
        it('should allow strings that contain some keywords in safe contexts', () => {
            // These should pass as they're not injection attempts
            expect(InputSanitizer.sanitizeString('value and another', 'test')).toBe('value and another');
            expect(InputSanitizer.sanitizeString('make new item', 'test')).toBe('make new item');
        });
    });
    describe('sanitizePath', () => {
        it('should allow valid paths', () => {
            expect(InputSanitizer.sanitizePath('data/issues/issue-123.md', 'path')).toBe('data/issues/issue-123.md');
            expect(InputSanitizer.sanitizePath('docs/readme.md', 'path')).toBe('docs/readme.md');
            expect(InputSanitizer.sanitizePath('local/file.txt', 'path')).toBe('local/file.txt');
            expect(InputSanitizer.sanitizePath('data/subfolder/file.json', 'path')).toBe('data/subfolder/file.json');
        });
        it('should reject path traversal attempts', () => {
            expect(() => InputSanitizer.sanitizePath('../../../etc/passwd', 'path')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizePath('..\\..\\windows\\system32', 'path')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizePath('/data/../../../etc', 'path')).toThrow(ValidationError);
        });
        it('should reject empty paths', () => {
            expect(() => InputSanitizer.sanitizePath('', 'path')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizePath('   ', 'path')).toThrow(ValidationError);
        });
    });
    describe('sanitizeNumber', () => {
        it('should parse valid numbers', () => {
            expect(InputSanitizer.sanitizeNumber(123, 'test')).toBe(123);
            expect(InputSanitizer.sanitizeNumber('456', 'test')).toBe(456);
            expect(InputSanitizer.sanitizeNumber('0', 'test')).toBe(0);
            expect(InputSanitizer.sanitizeNumber(-10, 'test')).toBe(-10);
        });
        it('should reject invalid numbers', () => {
            expect(() => InputSanitizer.sanitizeNumber('not a number', 'test')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeNumber('123abc', 'test')).toThrow(ValidationError);
            // null becomes 0, which is a valid number, so it doesn't throw
            expect(InputSanitizer.sanitizeNumber(null, 'test')).toBe(0);
            // undefined becomes NaN
            expect(() => InputSanitizer.sanitizeNumber(undefined, 'test')).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeNumber({}, 'test')).toThrow(ValidationError);
        });
        it('should enforce min/max constraints', () => {
            expect(InputSanitizer.sanitizeNumber(5, 'test', { min: 0, max: 10 })).toBe(5);
            expect(() => InputSanitizer.sanitizeNumber(-1, 'test', { min: 0, max: 10 })).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeNumber(11, 'test', { min: 0, max: 10 })).toThrow(ValidationError);
        });
        it('should handle float validation', () => {
            expect(() => InputSanitizer.sanitizeNumber(3.14, 'test')).toThrow(ValidationError); // Default: no float
            expect(InputSanitizer.sanitizeNumber(3.14, 'test', { allowFloat: true })).toBe(3.14);
            expect(InputSanitizer.sanitizeNumber(3, 'test', { allowFloat: true })).toBe(3);
        });
    });
    describe('sanitizeBoolean', () => {
        it('should parse valid booleans', () => {
            expect(InputSanitizer.sanitizeBoolean(true, 'test')).toBe(true);
            expect(InputSanitizer.sanitizeBoolean(false, 'test')).toBe(false);
            expect(InputSanitizer.sanitizeBoolean('true', 'test')).toBe(true);
            expect(InputSanitizer.sanitizeBoolean('false', 'test')).toBe(false);
            expect(InputSanitizer.sanitizeBoolean(1, 'test')).toBe(true);
            expect(InputSanitizer.sanitizeBoolean(0, 'test')).toBe(false);
        });
        it('should handle additional boolean strings', () => {
            // 'yes' and 'no' are actually valid according to the implementation
            expect(InputSanitizer.sanitizeBoolean('yes', 'test')).toBe(true);
            expect(InputSanitizer.sanitizeBoolean('no', 'test')).toBe(false);
            // Non-zero numbers return true, only 0 returns false
            expect(InputSanitizer.sanitizeBoolean(2, 'test')).toBe(true);
            expect(() => InputSanitizer.sanitizeBoolean(null, 'test')).toThrow(ValidationError);
        });
    });
    describe('sanitizeArray', () => {
        it('should sanitize array elements', () => {
            const numbers = [1, '2', 3];
            const result = InputSanitizer.sanitizeArray(numbers, 'numbers', (item) => InputSanitizer.sanitizeNumber(item, 'number'));
            expect(result).toEqual([1, 2, 3]);
        });
        it('should reject non-array inputs', () => {
            expect(() => InputSanitizer.sanitizeArray(null, 'test', (x) => x)).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeArray(undefined, 'test', (x) => x)).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeArray('string', 'test', (x) => x)).toThrow(ValidationError);
        });
        it('should enforce max array length', () => {
            const longArray = Array(101).fill('item');
            expect(() => InputSanitizer.sanitizeArray(longArray, 'items', (x) => x, { maxLength: 100 })).toThrow(ValidationError);
        });
        it('should propagate element validation errors', () => {
            const mixed = ['valid', null, 'another'];
            expect(() => InputSanitizer.sanitizeArray(mixed, 'test', (item) => {
                if (!item)
                    throw new ValidationError('Invalid item', []);
                return item;
            })).toThrow(ValidationError);
        });
    });
    describe('sanitizeEnum', () => {
        it('should allow valid enum values', () => {
            const priorities = ['low', 'medium', 'high'];
            expect(InputSanitizer.sanitizeEnum('low', 'priority', priorities)).toBe('low');
            expect(InputSanitizer.sanitizeEnum('medium', 'priority', priorities)).toBe('medium');
            expect(InputSanitizer.sanitizeEnum('high', 'priority', priorities)).toBe('high');
        });
        it('should reject invalid enum values', () => {
            const priorities = ['low', 'medium', 'high'];
            expect(() => InputSanitizer.sanitizeEnum('critical', 'priority', priorities)).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeEnum('LOW', 'priority', priorities)).toThrow(ValidationError);
            expect(() => InputSanitizer.sanitizeEnum('', 'priority', priorities)).toThrow(ValidationError);
        });
    });
    describe('createSanitizationMiddleware', () => {
        it('should create middleware that sanitizes data', () => {
            const schema = {
                name: (val) => InputSanitizer.sanitizeString(val, 'name'),
                age: (val) => InputSanitizer.sanitizeNumber(val, 'age', { min: 0, max: 150 }),
                active: (val) => InputSanitizer.sanitizeBoolean(val, 'active')
            };
            const middleware = createSanitizationMiddleware(schema);
            const input = {
                name: '  John Doe  ',
                age: '25',
                active: 'true',
                extra: 'ignored'
            };
            const result = middleware(input);
            expect(result).toEqual({
                name: 'John Doe',
                age: 25,
                active: true
            });
        });
        it('should handle validation errors', () => {
            const schema = {
                path: (val) => InputSanitizer.sanitizePath(val, 'path'),
                name: (val) => InputSanitizer.sanitizeString(val, 'name')
            };
            const middleware = createSanitizationMiddleware(schema);
            // Path with script tag should throw due to SQL injection pattern
            expect(() => middleware({ path: '<script>alert(1)</script>' })).toThrow(ValidationError);
            // Valid path should work
            const validResult = middleware({ path: 'data/file.txt' });
            expect(validResult).toEqual({ path: 'data/file.txt' });
            // Empty object doesn't throw because missing fields are skipped
            const result = middleware({});
            expect(result).toEqual({});
        });
        it('should skip missing fields', () => {
            const schema = {
                required: (val) => InputSanitizer.sanitizeString(val, 'required'),
                optional: (val) => InputSanitizer.sanitizeString(val, 'optional')
            };
            const middleware = createSanitizationMiddleware(schema);
            const result = middleware({ required: 'test' });
            expect(result).toEqual({ required: 'test' });
            expect(result).not.toHaveProperty('optional');
        });
    });
    describe('edge cases', () => {
        it('should handle unicode and special characters', () => {
            const unicode = 'Hello 世界 🌍';
            expect(InputSanitizer.sanitizeString(unicode, 'test')).toBe(unicode);
            const special = 'user@example.com';
            expect(InputSanitizer.sanitizeString(special, 'email')).toBe(special);
        });
        it('should handle very long but valid strings', () => {
            const longValid = 'a'.repeat(1000);
            expect(InputSanitizer.sanitizeString(longValid, 'content')).toBe(longValid);
        });
        it('should handle boundary values for numbers', () => {
            expect(InputSanitizer.sanitizeNumber(0, 'test', { min: 0, max: 100 })).toBe(0);
            expect(InputSanitizer.sanitizeNumber(100, 'test', { min: 0, max: 100 })).toBe(100);
            expect(InputSanitizer.sanitizeNumber(Number.MIN_SAFE_INTEGER, 'test')).toBe(Number.MIN_SAFE_INTEGER);
            expect(InputSanitizer.sanitizeNumber(Number.MAX_SAFE_INTEGER, 'test')).toBe(Number.MAX_SAFE_INTEGER);
        });
    });
});
//# sourceMappingURL=input-sanitizer.test.js.map