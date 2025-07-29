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
describe('MarkdownTransformers - Additional Coverage', () => {
    describe('formatPlan', () => {
        it('should format plan with all fields', () => {
            const plan = {
                id: 1,
                title: 'Project Plan',
                content: 'Plan details',
                priority: 'high',
                status: 'In Progress',
                start_date: '2024-01-01',
                end_date: '2024-12-31',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
                tags: ['project', 'roadmap'],
                description: 'Annual project plan',
                related_tasks: ['issues-1', 'issues-2'],
                related_documents: ['docs-1']
            };
            const result = MarkdownTransformers.formatPlan(plan);
            expect(result).toContain('# Project Plan');
            expect(result).toContain('**Priority:** high');
            expect(result).toContain('**Status:** In Progress');
            expect(result).toContain('**Start:** 2024-01-01');
            expect(result).toContain('**End:** 2024-12-31');
            expect(result).toContain('## Description');
            expect(result).toContain('Annual project plan');
            expect(result).toContain('## Related Tasks');
            expect(result).toContain('- issues-1');
            expect(result).toContain('- issues-2');
        });
        it('should handle plan without optional fields', () => {
            const plan = {
                id: 1,
                title: 'Simple Plan',
                content: 'Content',
                priority: 'medium',
                start_date: null,
                end_date: null,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
            };
            const result = MarkdownTransformers.formatPlan(plan);
            expect(result).toContain('**Status:** No status');
            expect(result).toContain('**Start:** Not set');
            expect(result).toContain('**End:** Not set');
            expect(result).not.toContain('## Description');
            expect(result).not.toContain('## Tags');
        });
    });
    describe('formatDocument', () => {
        it('should format document with all fields', () => {
            const doc = {
                id: 1,
                type: 'docs',
                title: 'API Documentation',
                content: 'Documentation content',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z',
                tags: ['api', 'reference'],
                description: 'API reference guide',
                related_tasks: ['issues-1'],
                related_documents: ['docs-2', 'docs-3']
            };
            const result = MarkdownTransformers.formatDocument(doc);
            expect(result).toContain('# API Documentation');
            expect(result).toContain('**Type:** docs');
            expect(result).toContain('## Description');
            expect(result).toContain('API reference guide');
            expect(result).toContain('## Related Documents');
            expect(result).toContain('- docs-2');
            expect(result).toContain('- docs-3');
        });
    });
    describe('formatSession with minimal fields', () => {
        it('should format session with only start time', () => {
            const session = {
                id: '2024-01-01-10.30.00.000',
                title: 'Quick Session',
                date: '2024-01-01',
                startTime: '10:30:00',
                content: 'Brief work',
                createdAt: '2024-01-01T10:30:00Z'
            };
            const result = MarkdownTransformers.formatSession(session);
            expect(result).toContain('**Started:** 10:30:00');
            expect(result).not.toContain('**Time:**');
        });
        it('should format session without content', () => {
            const session = {
                id: '2024-01-01-10.30.00.000',
                title: 'Empty Session',
                date: '2024-01-01',
                createdAt: '2024-01-01T10:30:00Z'
            };
            const result = MarkdownTransformers.formatSession(session);
            expect(result).not.toContain('## Details');
        });
    });
});
describe('DataConverters - Additional Coverage', () => {
    describe('rowToEntity with missing fields', () => {
        it('should handle missing fields in row', () => {
            const row = { id: 1 };
            const fieldMap = {
                id: 'id',
                name: 'name',
                email: 'email'
            };
            const result = DataConverters.rowToEntity(row, fieldMap);
            expect(result).toEqual({
                id: 1,
                name: undefined,
                email: undefined
            });
        });
    });
    describe('entityToRow with null values', () => {
        it('should preserve null values', () => {
            const entity = {
                id: 1,
                name: null,
                active: false
            };
            const fieldMap = {
                id: 'id',
                name: 'user_name',
                active: 'is_active'
            };
            const result = DataConverters.entityToRow(entity, fieldMap);
            expect(result).toEqual({
                id: 1,
                user_name: null,
                is_active: false
            });
        });
    });
    describe('parseJsonSafe edge cases', () => {
        it('should handle invalid JSON strings', () => {
            expect(DataConverters.parseJsonSafe('null', [])).toEqual(null);
            expect(DataConverters.parseJsonSafe('undefined', {})).toEqual({});
        });
        it('should handle empty string', () => {
            expect(DataConverters.parseJsonSafe('', { default: true })).toEqual({ default: true });
        });
    });
    describe('csvToTags with spaces', () => {
        it('should trim spaces from tags', () => {
            const result = DataConverters.csvToTags(' tag1 , tag2 , tag3 ');
            expect(result).toEqual(['tag1', 'tag2', 'tag3']);
        });
        it('should filter out empty tags', () => {
            const result = DataConverters.csvToTags('tag1,,tag2,,,tag3,');
            expect(result).toEqual(['tag1', 'tag2', 'tag3']);
        });
    });
    describe('normalizePriority edge cases', () => {
        it('should handle invalid input', () => {
            expect(DataConverters.normalizePriority('')).toBe('medium');
            expect(DataConverters.normalizePriority('invalid')).toBe('medium');
        });
    });
    describe('createReference with string id', () => {
        it('should handle string ids', () => {
            const ref = DataConverters.createReference('docs', 'abc-123');
            expect(ref).toBe('docs-abc-123');
        });
    });
    describe('parseReference edge cases', () => {
        it('should handle references with multiple hyphens', () => {
            const parsed = DataConverters.parseReference('docs-abc-123-xyz');
            expect(parsed).toEqual({ type: 'docs', id: 'abc-123-xyz' });
        });
        it('should handle empty string', () => {
            expect(DataConverters.parseReference('')).toBeNull();
        });
    });
});
describe('ResponseFormatters - Additional Coverage', () => {
    describe('error without optional fields', () => {
        it('should format error with message only', () => {
            const result = ResponseFormatters.error('Error occurred');
            expect(result).toEqual({
                success: false,
                error: {
                    message: 'Error occurred'
                }
            });
        });
    });
    describe('list with edge cases', () => {
        it('should handle empty list', () => {
            const result = ResponseFormatters.list([], 0, 1, 10);
            expect(result).toEqual({
                items: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    pages: 0
                }
            });
        });
        it('should calculate pages correctly', () => {
            const result = ResponseFormatters.list([1, 2, 3], 25, 2, 10);
            expect(result.pagination.pages).toBe(3);
        });
    });
    describe('summary with nested objects', () => {
        it('should preserve all non-content fields', () => {
            const entity = {
                id: 1,
                title: 'Test',
                content: 'Should be removed',
                metadata: { key: 'value' },
                nested: { deep: { value: true } }
            };
            const result = ResponseFormatters.summary(entity);
            expect(result).toEqual({
                id: 1,
                title: 'Test',
                metadata: { key: 'value' },
                nested: { deep: { value: true } }
            });
        });
    });
});
//# sourceMappingURL=transform-utils.test.js.map