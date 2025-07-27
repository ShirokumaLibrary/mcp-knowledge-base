/**
 * @ai-context Unit tests for validation utilities
 * @ai-pattern Test all validation functions and edge cases
 * @ai-critical Ensures validation logic is correct
 */
import { describe, it, expect } from '@jest/globals';
import { CommonValidators, ValidationUtils, SchemaBuilders } from '../validation-utils.js';
import { ValidationError } from '../../errors/custom-errors.js';
describe('CommonValidators', () => {
    describe('nonEmptyString', () => {
        it('should accept valid strings', () => {
            expect(() => CommonValidators.nonEmptyString.parse('test')).not.toThrow();
            expect(() => CommonValidators.nonEmptyString.parse('  test  ')).not.toThrow();
        });
        it('should reject empty strings', () => {
            expect(() => CommonValidators.nonEmptyString.parse('')).toThrow();
            expect(() => CommonValidators.nonEmptyString.parse('   ')).toThrow();
        });
    });
    describe('tagName', () => {
        it('should accept valid tag names', () => {
            expect(() => CommonValidators.tagName.parse('test')).not.toThrow();
            expect(() => CommonValidators.tagName.parse('test-tag')).not.toThrow();
            expect(() => CommonValidators.tagName.parse('test123')).not.toThrow();
        });
        it('should reject invalid tag names', () => {
            expect(() => CommonValidators.tagName.parse('Test')).toThrow(); // uppercase
            expect(() => CommonValidators.tagName.parse('123test')).toThrow(); // starts with number
            expect(() => CommonValidators.tagName.parse('test_tag')).toThrow(); // underscore
            expect(() => CommonValidators.tagName.parse('test tag')).toThrow(); // space
        });
    });
    describe('dateString', () => {
        it('should accept valid dates', () => {
            expect(() => CommonValidators.dateString.parse('2024-01-01')).not.toThrow();
            expect(() => CommonValidators.dateString.parse('2024-12-31')).not.toThrow();
        });
        it('should reject invalid dates', () => {
            expect(() => CommonValidators.dateString.parse('2024/01/01')).toThrow();
            expect(() => CommonValidators.dateString.parse('01-01-2024')).toThrow();
            expect(() => CommonValidators.dateString.parse('2024-13-01')).toThrow();
        });
    });
    describe('sessionId', () => {
        it('should accept valid session IDs', () => {
            expect(() => CommonValidators.sessionId.parse('2024-01-01-12.34.56.789')).not.toThrow();
        });
        it('should reject invalid session IDs', () => {
            expect(() => CommonValidators.sessionId.parse('2024-01-01-12:34:56.789')).toThrow();
            expect(() => CommonValidators.sessionId.parse('2024-01-01-12.34.56')).toThrow();
        });
    });
    describe('reference', () => {
        it('should accept valid references', () => {
            expect(() => CommonValidators.reference.parse('issues-123')).not.toThrow();
            expect(() => CommonValidators.reference.parse('custom_type-456')).not.toThrow();
        });
        it('should reject invalid references', () => {
            expect(() => CommonValidators.reference.parse('123-issues')).toThrow();
            expect(() => CommonValidators.reference.parse('issues_123')).toThrow();
            expect(() => CommonValidators.reference.parse('issues')).toThrow();
        });
    });
});
describe('ValidationUtils', () => {
    describe('cleanTags', () => {
        it('should clean and deduplicate tags', () => {
            const result = ValidationUtils.cleanTags(['  tag1  ', 'tag2', 'tag1', '', 'tag3']);
            expect(result).toEqual(['tag1', 'tag2', 'tag3']);
        });
        it('should handle empty input', () => {
            expect(ValidationUtils.cleanTags()).toEqual([]);
            expect(ValidationUtils.cleanTags([])).toEqual([]);
            expect(ValidationUtils.cleanTags(['', '  '])).toEqual([]);
        });
    });
    describe('validateDateRange', () => {
        it('should accept valid date ranges', () => {
            expect(() => ValidationUtils.validateDateRange('2024-01-01', '2024-12-31')).not.toThrow();
            expect(() => ValidationUtils.validateDateRange('2024-01-01', '2024-01-01')).not.toThrow();
            expect(() => ValidationUtils.validateDateRange()).not.toThrow();
        });
        it('should reject invalid date ranges', () => {
            expect(() => ValidationUtils.validateDateRange('2024-12-31', '2024-01-01')).toThrow(ValidationError);
        });
    });
    describe('parseReferences', () => {
        it('should parse valid references', () => {
            const result = ValidationUtils.parseReferences(['issues-1', 'plans-2', 'issues-3']);
            expect(result.get('issues')).toEqual([1, 3]);
            expect(result.get('plans')).toEqual([2]);
        });
        it('should throw on invalid references', () => {
            expect(() => ValidationUtils.parseReferences(['invalid'])).toThrow(ValidationError);
        });
        it('should handle empty input', () => {
            const result = ValidationUtils.parseReferences([]);
            expect(result.size).toBe(0);
        });
    });
    describe('validateRequired', () => {
        it('should pass when all required fields are present', () => {
            const data = { name: 'test', age: 25 };
            expect(() => ValidationUtils.validateRequired(data, ['name', 'age'])).not.toThrow();
        });
        it('should throw when required fields are missing', () => {
            const data = { name: 'test' };
            expect(() => ValidationUtils.validateRequired(data, ['name', 'age'])).toThrow(ValidationError);
        });
        it('should throw when required fields are empty', () => {
            const data = { name: '  ', age: null };
            expect(() => ValidationUtils.validateRequired(data, ['name', 'age'])).toThrow(ValidationError);
        });
    });
    describe('sanitizeString', () => {
        it('should trim and normalize whitespace', () => {
            expect(ValidationUtils.sanitizeString('  test  string  ')).toBe('test string');
            expect(ValidationUtils.sanitizeString('test\n\n\nstring')).toBe('test string');
        });
        it('should handle empty input', () => {
            expect(ValidationUtils.sanitizeString()).toBe('');
            expect(ValidationUtils.sanitizeString('')).toBe('');
            expect(ValidationUtils.sanitizeString('   ')).toBe('');
        });
    });
    describe('validateEnum', () => {
        const colors = ['red', 'green', 'blue'];
        it('should accept valid enum values', () => {
            expect(ValidationUtils.validateEnum('red', colors, 'color')).toBe('red');
        });
        it('should throw on invalid enum values', () => {
            expect(() => ValidationUtils.validateEnum('yellow', colors, 'color')).toThrow(ValidationError);
        });
    });
    describe('getPaginationParams', () => {
        it('should return valid pagination params', () => {
            expect(ValidationUtils.getPaginationParams(2, 10)).toEqual({ offset: 10, limit: 10 });
            expect(ValidationUtils.getPaginationParams()).toEqual({ offset: 0, limit: 20 });
        });
        it('should handle edge cases', () => {
            expect(ValidationUtils.getPaginationParams(0, 10)).toEqual({ offset: 0, limit: 10 });
            expect(ValidationUtils.getPaginationParams(1, 200)).toEqual({ offset: 0, limit: 100 });
        });
    });
    describe('validateId', () => {
        it('should accept valid IDs', () => {
            expect(ValidationUtils.validateId(123)).toBe(123);
            expect(ValidationUtils.validateId('456')).toBe(456);
        });
        it('should reject invalid IDs', () => {
            expect(() => ValidationUtils.validateId('abc')).toThrow(ValidationError);
            expect(() => ValidationUtils.validateId(0)).toThrow(ValidationError);
            expect(() => ValidationUtils.validateId(-1)).toThrow(ValidationError);
            expect(() => ValidationUtils.validateId(1.5)).toThrow(ValidationError);
        });
    });
});
describe('SchemaBuilders', () => {
    describe('createSchema', () => {
        it('should build valid create schema', () => {
            const schema = SchemaBuilders.createSchema({
                priority: CommonValidators.priority
            });
            const valid = {
                title: 'Test',
                description: 'Description',
                tags: ['tag1', 'tag2'],
                priority: 'high'
            };
            expect(() => schema.parse(valid)).not.toThrow();
        });
        it('should require title', () => {
            const schema = SchemaBuilders.createSchema();
            expect(() => schema.parse({ description: 'test' })).toThrow();
        });
    });
    describe('updateSchema', () => {
        it('should make all fields optional', () => {
            const schema = SchemaBuilders.updateSchema({
                priority: CommonValidators.priority
            });
            expect(() => schema.parse({})).not.toThrow();
            expect(() => schema.parse({ title: 'New Title' })).not.toThrow();
            expect(() => schema.parse({ priority: 'low' })).not.toThrow();
        });
    });
    describe('dateRangeSchema', () => {
        it('should validate date ranges', () => {
            const schema = SchemaBuilders.dateRangeSchema();
            expect(() => schema.parse({
                start_date: '2024-01-01',
                end_date: '2024-12-31'
            })).not.toThrow();
        });
        it('should reject invalid date ranges', () => {
            const schema = SchemaBuilders.dateRangeSchema();
            expect(() => schema.parse({
                start_date: '2024-12-31',
                end_date: '2024-01-01'
            })).toThrow();
        });
    });
});
//# sourceMappingURL=validation-utils.test.js.map