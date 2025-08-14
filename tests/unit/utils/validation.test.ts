/**
 * Unit tests for validation utilities
 * TDD Red Phase - These tests should fail initially
 */

import { describe, it, expect } from 'vitest';
import { validateType, isValidType, normalizeType } from '../../../src/utils/validation.js';

describe('validateType', () => {
  describe('should validate correct type formats', () => {
    it('should accept lowercase letters only', () => {
      expect(validateType('issue')).toBe('issue');
      expect(validateType('knowledge')).toBe('knowledge');
    });

    it('should accept numbers', () => {
      expect(validateType('bug123')).toBe('bug123');
      expect(validateType('123')).toBe('123');
    });

    it('should accept underscores', () => {
      expect(validateType('bug_fix')).toBe('bug_fix');
      expect(validateType('feature_123')).toBe('feature_123');
    });

    it('should accept mixed valid characters', () => {
      expect(validateType('test_case_123')).toBe('test_case_123');
      expect(validateType('v2_beta_release')).toBe('v2_beta_release');
    });
  });

  describe('should reject invalid type formats', () => {
    it('should reject uppercase letters', () => {
      expect(() => validateType('Issue')).toThrow('Invalid type format');
      expect(() => validateType('BUG')).toThrow('Invalid type format');
    });

    it('should reject special characters', () => {
      expect(() => validateType('bug-fix')).toThrow('Invalid type format');
      expect(() => validateType('feature#123')).toThrow('Invalid type format');
      expect(() => validateType('test@case')).toThrow('Invalid type format');
    });

    it('should reject spaces', () => {
      expect(() => validateType('bug fix')).toThrow('Invalid type format');
      expect(() => validateType(' issue')).toThrow('Invalid type format');
      expect(() => validateType('issue ')).toThrow('Invalid type format');
    });

    it('should reject empty strings', () => {
      expect(() => validateType('')).toThrow('Invalid type format');
    });

    it('should reject null and undefined', () => {
      // @ts-expect-error Testing invalid input
      expect(() => validateType(null)).toThrow();
      // @ts-expect-error Testing invalid input
      expect(() => validateType(undefined)).toThrow();
    });
  });

  describe('auto-normalize mode', () => {
    it('should normalize uppercase to lowercase when autoNormalize is true', () => {
      expect(validateType('ISSUE', true)).toBe('issue');
      expect(validateType('BugFix', true)).toBe('bugfix');
    });

    it('should replace invalid characters with underscores when autoNormalize is true', () => {
      expect(validateType('bug-fix', true)).toBe('bug_fix');
      expect(validateType('feature#123', true)).toBe('feature_123');
      expect(validateType('test@case', true)).toBe('test_case');
    });

    it('should handle spaces when autoNormalize is true', () => {
      expect(validateType('bug fix', true)).toBe('bug_fix');
      expect(validateType('  issue  ', true)).toBe('issue');
    });

    it('should collapse multiple underscores when autoNormalize is true', () => {
      expect(validateType('bug___fix', true)).toBe('bug_fix');
      expect(validateType('__test__', true)).toBe('test');
    });

    it('should handle mixed invalid characters when autoNormalize is true', () => {
      expect(validateType('Bug-Fix #123!', true)).toBe('bug_fix_123');
      expect(validateType('Test::Case', true)).toBe('test_case');
    });

    it('should throw error for empty result after normalization', () => {
      expect(() => validateType('###', true)).toThrow('Type contains no valid characters');
      expect(() => validateType('___', true)).toThrow('Type contains no valid characters');
    });
  });

  describe('edge cases', () => {
    it('should handle single character types', () => {
      expect(validateType('a')).toBe('a');
      expect(validateType('1')).toBe('1');
      expect(validateType('_')).toBe('_');
    });

    it('should handle very long type strings', () => {
      const longType = 'a'.repeat(100) + '_' + '1'.repeat(100);
      expect(validateType(longType)).toBe(longType);
    });

    it('should handle types starting with numbers', () => {
      expect(validateType('123issue')).toBe('123issue');
      expect(validateType('0_bug')).toBe('0_bug');
    });

    it('should handle types starting or ending with underscores', () => {
      expect(validateType('_issue')).toBe('_issue');
      expect(validateType('issue_')).toBe('issue_');
      expect(validateType('_issue_')).toBe('_issue_');
    });

    it('should preserve consecutive underscores in valid input', () => {
      expect(validateType('bug__fix')).toBe('bug__fix');
    });
  });
});

describe('isValidType', () => {
  describe('should correctly identify valid types', () => {
    it('should return true for valid lowercase types', () => {
      expect(isValidType('issue')).toBe(true);
      expect(isValidType('bug_fix')).toBe(true);
      expect(isValidType('feature123')).toBe(true);
    });

    it('should return true for numeric types', () => {
      expect(isValidType('123')).toBe(true);
      expect(isValidType('0')).toBe(true);
    });

    it('should return true for underscore-only types', () => {
      expect(isValidType('_')).toBe(true);
      expect(isValidType('___')).toBe(true);
    });
  });

  describe('should correctly identify invalid types', () => {
    it('should return false for uppercase letters', () => {
      expect(isValidType('Issue')).toBe(false);
      expect(isValidType('BUG')).toBe(false);
    });

    it('should return false for special characters', () => {
      expect(isValidType('bug-fix')).toBe(false);
      expect(isValidType('feature#123')).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(isValidType('')).toBe(false);
    });

    it('should return false for null and undefined', () => {
      // @ts-expect-error Testing invalid input
      expect(isValidType(null)).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isValidType(undefined)).toBe(false);
    });
  });
});

describe('normalizeType', () => {
  describe('should normalize invalid types', () => {
    it('should convert uppercase to lowercase', () => {
      expect(normalizeType('ISSUE')).toBe('issue');
      expect(normalizeType('BugFix')).toBe('bugfix');
    });

    it('should replace special characters with underscores', () => {
      expect(normalizeType('bug-fix')).toBe('bug_fix');
      expect(normalizeType('feature#123')).toBe('feature_123');
      expect(normalizeType('test.case')).toBe('test_case');
    });

    it('should handle spaces', () => {
      expect(normalizeType('bug fix')).toBe('bug_fix');
      expect(normalizeType('  issue  ')).toBe('issue');
    });

    it('should collapse multiple underscores', () => {
      expect(normalizeType('bug___fix')).toBe('bug_fix');
      expect(normalizeType('test____case')).toBe('test_case');
    });

    it('should remove leading and trailing underscores', () => {
      expect(normalizeType('_issue_')).toBe('issue');
      expect(normalizeType('___test___')).toBe('test');
    });
  });

  describe('should handle edge cases', () => {
    it('should preserve valid types', () => {
      expect(normalizeType('issue')).toBe('issue');
      expect(normalizeType('bug_123')).toBe('bug_123');
    });

    it('should handle complex mixed characters', () => {
      expect(normalizeType('Bug-Fix #123! @test')).toBe('bug_fix_123_test');
      expect(normalizeType('***test***case***')).toBe('test_case');
    });

    it('should throw error for empty input', () => {
      expect(() => normalizeType('')).toThrow('Type cannot be empty');
      // @ts-expect-error Testing invalid input
      expect(() => normalizeType(null)).toThrow('Type cannot be empty');
      // @ts-expect-error Testing invalid input
      expect(() => normalizeType(undefined)).toThrow('Type cannot be empty');
    });

    it('should throw error when normalization results in empty string', () => {
      expect(() => normalizeType('###')).toThrow('Type contains no valid characters');
      expect(() => normalizeType('   ')).toThrow('Type contains no valid characters');
      expect(() => normalizeType('___')).toThrow('Type contains no valid characters');
    });
  });

  describe('should handle unicode and international characters', () => {
    it('should replace non-ASCII characters', () => {
      expect(normalizeType('café')).toBe('caf');
      expect(normalizeType('日本語')).toBe('');
    });

    it('should handle emoji', () => {
      expect(() => normalizeType('🚀')).toThrow('Type contains no valid characters');
      expect(normalizeType('test🚀case')).toBe('test_case');
    });
  });
});

describe('integration between validation functions', () => {
  it('should maintain consistency between isValidType and validateType', () => {
    const validTypes = ['issue', 'bug_123', 'test_case'];
    validTypes.forEach(type => {
      expect(isValidType(type)).toBe(true);
      expect(validateType(type)).toBe(type);
    });
  });

  it('should maintain consistency between normalizeType and validateType with autoNormalize', () => {
    const invalidTypes = ['Bug-Fix', 'TEST CASE', 'feature#123'];
    invalidTypes.forEach(type => {
      const normalized = normalizeType(type);
      const validated = validateType(type, true);
      expect(normalized).toBe(validated);
      expect(isValidType(normalized)).toBe(true);
    });
  });

  it('should handle round-trip normalization', () => {
    const types = ['BUG-FIX', 'Test Case 123', 'feature###update'];
    types.forEach(type => {
      const normalized = normalizeType(type);
      expect(validateType(normalized)).toBe(normalized);
      expect(isValidType(normalized)).toBe(true);
    });
  });
});