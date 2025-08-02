/**
 * @ai-test Tests for search query parser with boolean operators
 */

import { describe, it, expect } from '@jest/globals';
import { parseSearchQuery, toFTS5Query, hasFieldSpecificSearch } from '../search-query-parser.js';

describe('parseSearchQuery', () => {
  describe('simple queries', () => {
    it('should parse single term', () => {
      const result = parseSearchQuery('bug');
      expect(result.expression).toEqual({
        type: 'term',
        value: 'bug',
        negated: false
      });
    });

    it('should parse multiple terms with implicit AND', () => {
      const result = parseSearchQuery('bug fix');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'AND',
        left: { type: 'term', value: 'bug', negated: false },
        right: { type: 'term', value: 'fix', negated: false }
      });
    });

    it('should parse quoted phrases', () => {
      const result = parseSearchQuery('"bug fix"');
      expect(result.expression).toEqual({
        type: 'term',
        value: 'bug fix',
        negated: false
      });
    });
  });

  describe('field-specific searches', () => {
    it('should parse single field search', () => {
      const result = parseSearchQuery('title:bug');
      expect(result.expression).toEqual({
        type: 'term',
        field: 'title',
        value: 'bug',
        negated: false
      });
    });

    it('should parse multiple field searches', () => {
      const result = parseSearchQuery('title:bug content:fix');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'AND',
        left: { type: 'term', field: 'title', value: 'bug', negated: false },
        right: { type: 'term', field: 'content', value: 'fix', negated: false }
      });
    });

    it('should parse field searches with quoted values', () => {
      const result = parseSearchQuery('title:"bug fix"');
      expect(result.expression).toEqual({
        type: 'term',
        field: 'title',
        value: 'bug fix',
        negated: false
      });
    });

    it('should handle all valid fields', () => {
      const fields = ['title', 'content', 'description', 'tags', 'type'];
      fields.forEach(field => {
        const result = parseSearchQuery(`${field}:test`);
        expect(result.expression).toEqual({
          type: 'term',
          field: field,
          value: 'test',
          negated: false
        });
      });
    });

    it('should treat invalid fields as plain text', () => {
      const result = parseSearchQuery('invalid:field');
      expect(result.expression).toEqual({
        type: 'term',
        value: 'invalid:field',
        negated: false
      });
    });
  });

  describe('boolean operators', () => {
    it('should parse explicit AND', () => {
      const result = parseSearchQuery('bug AND fix');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'AND',
        left: { type: 'term', value: 'bug', negated: false },
        right: { type: 'term', value: 'fix', negated: false }
      });
    });

    it('should parse OR operator', () => {
      const result = parseSearchQuery('bug OR fix');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'OR',
        left: { type: 'term', value: 'bug', negated: false },
        right: { type: 'term', value: 'fix', negated: false }
      });
    });

    it('should handle operator precedence (AND before OR)', () => {
      const result = parseSearchQuery('bug AND fix OR error');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'OR',
        left: {
          type: 'boolean',
          operator: 'AND',
          left: { type: 'term', value: 'bug', negated: false },
          right: { type: 'term', value: 'fix', negated: false }
        },
        right: { type: 'term', value: 'error', negated: false }
      });
    });

    it('should handle complex boolean expressions', () => {
      const result = parseSearchQuery('bug OR fix AND error OR warning');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'OR',
        left: {
          type: 'boolean',
          operator: 'OR',
          left: { type: 'term', value: 'bug', negated: false },
          right: {
            type: 'boolean',
            operator: 'AND',
            left: { type: 'term', value: 'fix', negated: false },
            right: { type: 'term', value: 'error', negated: false }
          }
        },
        right: { type: 'term', value: 'warning', negated: false }
      });
    });

    it('should handle parentheses for grouping', () => {
      const result = parseSearchQuery('(bug OR fix) AND error');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'AND',
        left: {
          type: 'boolean',
          operator: 'OR',
          left: { type: 'term', value: 'bug', negated: false },
          right: { type: 'term', value: 'fix', negated: false }
        },
        right: { type: 'term', value: 'error', negated: false }
      });
    });
  });

  describe('negation', () => {
    it('should parse NOT operator', () => {
      const result = parseSearchQuery('NOT bug');
      expect(result.expression).toEqual({
        type: 'term',
        value: 'bug',
        negated: true
      });
    });

    it('should parse negation prefix', () => {
      const result = parseSearchQuery('-bug');
      expect(result.expression).toEqual({
        type: 'term',
        value: 'bug',
        negated: true
      });
    });

    it('should parse negated field searches', () => {
      const result = parseSearchQuery('-title:bug');
      expect(result.expression).toEqual({
        type: 'term',
        field: 'title',
        value: 'bug',
        negated: true
      });
    });

    it('should handle NOT with field search', () => {
      const result = parseSearchQuery('NOT title:bug');
      expect(result.expression).toEqual({
        type: 'term',
        field: 'title',
        value: 'bug',
        negated: true
      });
    });

    it('should handle negation in complex expressions', () => {
      const result = parseSearchQuery('bug AND NOT fix');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'AND',
        left: { type: 'term', value: 'bug', negated: false },
        right: { type: 'term', value: 'fix', negated: true }
      });
    });
  });

  describe('mixed queries', () => {
    it('should parse mixed field and boolean operators', () => {
      const result = parseSearchQuery('title:bug AND content:fix OR tags:important');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'OR',
        left: {
          type: 'boolean',
          operator: 'AND',
          left: { type: 'term', field: 'title', value: 'bug', negated: false },
          right: { type: 'term', field: 'content', value: 'fix', negated: false }
        },
        right: { type: 'term', field: 'tags', value: 'important', negated: false }
      });
    });

    it('should handle complex query with all features', () => {
      const result = parseSearchQuery('(title:"bug fix" OR -content:error) AND tags:critical');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'AND',
        left: {
          type: 'boolean',
          operator: 'OR',
          left: { type: 'term', field: 'title', value: 'bug fix', negated: false },
          right: { type: 'term', field: 'content', value: 'error', negated: true }
        },
        right: { type: 'term', field: 'tags', value: 'critical', negated: false }
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty query', () => {
      const result = parseSearchQuery('');
      expect(result.expression).toEqual({
        type: 'term',
        value: '',
        negated: false
      });
    });

    it('should handle whitespace-only query', () => {
      const result = parseSearchQuery('   ');
      expect(result.expression).toEqual({
        type: 'term',
        value: '',
        negated: false
      });
    });

    it('should handle operators as search terms when quoted', () => {
      const result = parseSearchQuery('"AND" "OR"');
      expect(result.expression).toEqual({
        type: 'boolean',
        operator: 'AND',
        left: { type: 'term', value: 'AND', negated: false },
        right: { type: 'term', value: 'OR', negated: false }
      });
    });
  });
});

describe('toFTS5Query', () => {
  it('should convert simple term to FTS5', () => {
    const parsed = parseSearchQuery('bug');
    expect(toFTS5Query(parsed)).toBe('bug');
  });

  it('should convert multiple terms with AND', () => {
    const parsed = parseSearchQuery('bug fix');
    expect(toFTS5Query(parsed)).toBe('(bug AND fix)');
  });

  it('should convert OR expressions', () => {
    const parsed = parseSearchQuery('bug OR fix');
    expect(toFTS5Query(parsed)).toBe('(bug OR fix)');
  });

  it('should convert field-specific searches', () => {
    const parsed = parseSearchQuery('title:bug content:fix');
    expect(toFTS5Query(parsed)).toBe('({title}:bug AND {content}:fix)');
  });

  it('should handle negation', () => {
    const parsed = parseSearchQuery('-title:bug');
    expect(toFTS5Query(parsed)).toBe('-{title}:bug');
  });

  it('should handle complex expressions with parentheses', () => {
    const parsed = parseSearchQuery('(title:bug OR content:fix) AND -tags:old');
    expect(toFTS5Query(parsed)).toBe('(({title}:bug OR {content}:fix) AND -{tags}:old)');
  });

  it('should escape special characters', () => {
    const parsed = parseSearchQuery('title:"test\'s"');
    expect(toFTS5Query(parsed)).toBe('{title}:tests');
  });

  it('should handle empty query', () => {
    const parsed = parseSearchQuery('');
    expect(toFTS5Query(parsed)).toBe('');
  });

  it('should handle mixed boolean operators', () => {
    const parsed = parseSearchQuery('bug AND fix OR error');
    expect(toFTS5Query(parsed)).toBe('((bug AND fix) OR error)');
  });

  it('should preserve operator precedence in FTS5', () => {
    const parsed = parseSearchQuery('a OR b AND c OR d');
    expect(toFTS5Query(parsed)).toBe('((a OR (b AND c)) OR d)');
  });
});

describe('hasFieldSpecificSearch', () => {
  it('should return true for field-specific searches', () => {
    expect(hasFieldSpecificSearch('title:bug')).toBe(true);
    expect(hasFieldSpecificSearch('content:fix OR title:bug')).toBe(true);
    expect(hasFieldSpecificSearch('bug AND title:fix')).toBe(true);
  });

  it('should return false for non-field searches', () => {
    expect(hasFieldSpecificSearch('bug')).toBe(false);
    expect(hasFieldSpecificSearch('bug AND fix')).toBe(false);
    expect(hasFieldSpecificSearch('bug OR fix')).toBe(false);
    expect(hasFieldSpecificSearch('')).toBe(false);
  });

  it('should detect fields in complex expressions', () => {
    expect(hasFieldSpecificSearch('(bug OR fix) AND title:important')).toBe(true);
    expect(hasFieldSpecificSearch('NOT content:error')).toBe(true);
  });
});

describe('operator case sensitivity', () => {
  it('should recognize operators regardless of case', () => {
    const queries = [
      'bug and fix',
      'bug And fix',
      'bug AND fix',
      'bug or fix',
      'bug Or fix',
      'bug OR fix',
      'not bug',
      'Not bug',
      'NOT bug'
    ];

    expect(parseSearchQuery('bug and fix').expression).toEqual(
      parseSearchQuery('bug AND fix').expression
    );
    expect(parseSearchQuery('bug or fix').expression).toEqual(
      parseSearchQuery('bug OR fix').expression
    );
    expect(parseSearchQuery('not bug').expression).toEqual(
      parseSearchQuery('NOT bug').expression
    );
  });
});