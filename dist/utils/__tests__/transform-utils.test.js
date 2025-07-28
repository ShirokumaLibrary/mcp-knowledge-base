/**
 * @ai-context Unit tests for data transformation utilities
 * @ai-pattern Test all transformation and formatting functions
 * @ai-critical Ensures data is correctly transformed
 */
import { describe, it, expect } from '@jest/globals';
import { MarkdownTransformers, DataConverters, ResponseFormatters, FieldMappings } from '../transform-utils.js';
describe('MarkdownTransformers', () => {
    describe('formatIssue', () => {
        it('should format issue with all fields', () => {
            const issue = {
                id: 1,
                title: 'Test Issue',
                content: 'Issue content',
                priority: 'high',
                status: 'Open',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
                tags: ['bug', 'urgent'],
                description: 'Issue description',
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                related_tasks: ['plans-1'],
                related_documents: ['docs-1']
            };
            const result = MarkdownTransformers.formatIssue(issue);
            expect(result).toContain('# Test Issue');
            expect(result).toContain('**ID:** 1');
            expect(result).toContain('**Priority:** high');
            expect(result).toContain('**Status:** Open');
            expect(result).toContain('## Description');
            expect(result).toContain('Issue description');
            expect(result).toContain('## Tags');
            expect(result).toContain('- bug');
            expect(result).toContain('- urgent');
            expect(result).toContain('## Timeline');
            expect(result).toContain('**Start:** 2024-01-01');
            expect(result).toContain('**End:** 2024-01-31');
            expect(result).toContain('## Related Tasks');
            expect(result).toContain('- plans-1');
            expect(result).toContain('## Related Documents');
            expect(result).toContain('- docs-1');
        });
        it('should handle issue with minimal fields', () => {
            const issue = {
                id: 1,
                title: 'Simple Issue',
                content: 'Content',
                priority: 'medium',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
            };
            const result = MarkdownTransformers.formatIssue(issue);
            expect(result).toContain('# Simple Issue');
            expect(result).toContain('**Status:** No status');
            expect(result).not.toContain('## Description');
            expect(result).not.toContain('## Tags');
            expect(result).not.toContain('## Timeline');
        });
    });
    describe('formatSession', () => {
        it('should format work session correctly', () => {
            const session = {
                id: '2024-01-01-10.30.00.000',
                title: 'Development Session',
                date: '2024-01-01',
                startTime: '10:30:00',
                endTime: '12:30:00',
                summary: 'Fixed bugs',
                content: 'Detailed work log',
                tags: ['coding'],
                createdAt: '2024-01-01T10:30:00Z',
                related_tasks: ['issues-1'],
                related_documents: ['docs-1']
            };
            const result = MarkdownTransformers.formatSession(session);
            expect(result).toContain('# Development Session');
            expect(result).toContain('**ID:** 2024-01-01-10.30.00.000');
            expect(result).toContain('**Date:** 2024-01-01');
            expect(result).toContain('**Time:** 10:30:00 - 12:30:00');
            expect(result).toContain('## Summary');
            expect(result).toContain('Fixed bugs');
            expect(result).toContain('## Details');
            expect(result).toContain('Detailed work log');
        });
    });
});
describe('DataConverters', () => {
    describe('rowToEntity', () => {
        it('should map database row to entity', () => {
            const row = {
                id: 1,
                title: 'Test',
                created_at: '2024-01-01',
                is_active: 1
            };
            const fieldMap = {
                id: 'id',
                title: 'title',
                createdAt: 'created_at',
                isActive: 'is_active'
            };
            const result = DataConverters.rowToEntity(row, fieldMap);
            expect(result).toEqual({
                id: 1,
                title: 'Test',
                createdAt: '2024-01-01',
                isActive: 1
            });
        });
    });
    describe('entityToRow', () => {
        it('should map entity to database row', () => {
            const entity = {
                id: 1,
                title: 'Test',
                createdAt: '2024-01-01',
                isActive: true
            };
            const fieldMap = {
                id: 'id',
                title: 'title',
                createdAt: 'created_at',
                isActive: 'is_active'
            };
            const result = DataConverters.entityToRow(entity, fieldMap);
            expect(result).toEqual({
                id: 1,
                title: 'Test',
                created_at: '2024-01-01',
                is_active: true
            });
        });
    });
    describe('parseJsonSafe', () => {
        it('should parse valid JSON', () => {
            expect(DataConverters.parseJsonSafe('{"key": "value"}', {})).toEqual({ key: 'value' });
        });
        it('should return default on invalid JSON', () => {
            expect(DataConverters.parseJsonSafe('invalid', { default: true })).toEqual({ default: true });
        });
    });
    describe('tagsToCSV and csvToTags', () => {
        it('should convert tags to CSV and back', () => {
            const tags = ['tag1', 'tag2', 'tag3'];
            const csv = DataConverters.tagsToCSV(tags);
            expect(csv).toBe('tag1,tag2,tag3');
            const parsed = DataConverters.csvToTags(csv);
            expect(parsed).toEqual(tags);
        });
        it('should handle empty tags', () => {
            expect(DataConverters.tagsToCSV()).toBe('');
            expect(DataConverters.tagsToCSV([])).toBe('');
            expect(DataConverters.csvToTags()).toEqual([]);
            expect(DataConverters.csvToTags('')).toEqual([]);
        });
    });
    describe('booleanToInt and intToBoolean', () => {
        it('should convert boolean to int and back', () => {
            expect(DataConverters.booleanToInt(true)).toBe(1);
            expect(DataConverters.booleanToInt(false)).toBe(0);
            expect(DataConverters.booleanToInt()).toBe(0);
            expect(DataConverters.intToBoolean(1)).toBe(true);
            expect(DataConverters.intToBoolean(0)).toBe(false);
            expect(DataConverters.intToBoolean(null)).toBe(false);
            expect(DataConverters.intToBoolean(undefined)).toBe(false);
        });
    });
    describe('normalizePriority', () => {
        it('should normalize priority values', () => {
            expect(DataConverters.normalizePriority('HIGH')).toBe('high');
            expect(DataConverters.normalizePriority('Medium')).toBe('medium');
            expect(DataConverters.normalizePriority('low')).toBe('low');
            expect(DataConverters.normalizePriority('invalid')).toBe('medium');
            expect(DataConverters.normalizePriority()).toBe('medium');
        });
    });
    describe('createReference and parseReference', () => {
        it('should create and parse references', () => {
            const ref = DataConverters.createReference('issues', 123);
            expect(ref).toBe('issues-123');
            const parsed = DataConverters.parseReference(ref);
            expect(parsed).toEqual({ type: 'issues', id: '123' });
        });
        it('should handle invalid references', () => {
            expect(DataConverters.parseReference('invalid')).toBeNull();
            expect(DataConverters.parseReference('123-issues')).toBeNull();
        });
    });
});
describe('ResponseFormatters', () => {
    describe('success', () => {
        it('should format success response', () => {
            const result = ResponseFormatters.success({ id: 1 }, 'Created successfully');
            expect(result).toEqual({
                success: true,
                data: { id: 1 },
                message: 'Created successfully'
            });
        });
        it('should omit message if not provided', () => {
            const result = ResponseFormatters.success({ id: 1 });
            expect(result).toEqual({
                success: true,
                data: { id: 1 }
            });
        });
    });
    describe('error', () => {
        it('should format error response', () => {
            const result = ResponseFormatters.error('Something went wrong', 'ERR_001', { field: 'name' });
            expect(result).toEqual({
                success: false,
                error: {
                    message: 'Something went wrong',
                    code: 'ERR_001',
                    details: { field: 'name' }
                }
            });
        });
    });
    describe('list', () => {
        it('should format paginated list response', () => {
            const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
            const result = ResponseFormatters.list(items, 10, 1, 3);
            expect(result).toEqual({
                items,
                pagination: {
                    total: 10,
                    page: 1,
                    limit: 3,
                    pages: 4
                }
            });
        });
    });
    describe('summary', () => {
        it('should create summary without content', () => {
            const entity = {
                id: 1,
                title: 'Test',
                content: 'Long content here',
                tags: ['tag1']
            };
            const result = ResponseFormatters.summary(entity);
            expect(result).toEqual({
                id: 1,
                title: 'Test',
                tags: ['tag1']
            });
            expect(result).not.toHaveProperty('content');
        });
    });
});
describe('FieldMappings', () => {
    it('should have correct field mappings', () => {
        expect(FieldMappings.issue.createdAt).toBe('created_at');
        expect(FieldMappings.document.type).toBe('type');
        expect(FieldMappings.session.startTime).toBe('start_time');
    });
});
//# sourceMappingURL=transform-utils.test.js.map