import { parseMarkdown, generateMarkdown, parseDocumentMarkdown, generateDocumentMarkdown } from '../markdown-parser.js';
describe('markdown-parser', () => {
    describe('parseMarkdown', () => {
        it('should parse basic markdown with frontmatter', () => {
            const content = `---
id: 123
title: Test Title
tags: tag1, tag2, tag3
priority: high
status_id: 1
created_at: 2025-01-24T10:00:00Z
updated_at: 2025-01-24T10:00:00Z
---

# Test Content

This is the body content.`;
            const result = parseMarkdown(content);
            expect(result.metadata).toEqual({
                id: 123,
                title: 'Test Title',
                tags: ['tag1', 'tag2', 'tag3'],
                priority: 'high',
                status_id: 1,
                created_at: '2025-01-24T10:00:00Z',
                updated_at: '2025-01-24T10:00:00Z'
            });
            expect(result.content).toBe('# Test Content\n\nThis is the body content.');
        });
        it('should handle content without frontmatter', () => {
            const content = 'Just plain content without any frontmatter';
            const result = parseMarkdown(content);
            expect(result.metadata).toEqual({});
            expect(result.content).toBe('Just plain content without any frontmatter');
        });
        it('should handle empty values in frontmatter', () => {
            const content = `---
id: 1
title: 
description: 
tags: 
---

Content here`;
            const result = parseMarkdown(content);
            expect(result.metadata).toEqual({
                id: 1,
                title: null,
                description: null,
                tags: null
            });
        });
        it('should parse boolean values', () => {
            const content = `---
enabled: true
disabled: false
---

Content`;
            const result = parseMarkdown(content);
            expect(result.metadata.enabled).toBe(true);
            expect(result.metadata.disabled).toBe(false);
        });
        it('should parse JSON array format for tags', () => {
            const content = `---
tags: ["tag with spaces", "another tag", "tag,with,comma"]
related: ["item1", "item2"]
---

Content`;
            const result = parseMarkdown(content);
            expect(result.metadata.tags).toEqual(['tag with spaces', 'another tag', 'tag,with,comma']);
            expect(result.metadata.related).toEqual(['item1', 'item2']);
        });
        it('should handle malformed JSON arrays gracefully', () => {
            const content = `---
tags: ["broken", "json"
related_tasks: [not valid json]
---

Content`;
            const result = parseMarkdown(content);
            // Falls back to comma-separated parsing
            expect(result.metadata.tags).toEqual(['["broken"', '"json"']);
            expect(result.metadata.related_tasks).toEqual(['[not valid json]']);
        });
        it('should parse comma-separated numeric arrays', () => {
            const content = `---
ids: 1, 2, 3, 4, 5
values: 10.5, 20.3, 30.1
mixed: 1, two, 3
---

Content`;
            const result = parseMarkdown(content);
            expect(result.metadata.ids).toEqual([1, 2, 3, 4, 5]);
            expect(result.metadata.values).toEqual([10.5, 20.3, 30.1]);
            expect(result.metadata.mixed).toEqual(['1', 'two', '3']); // Mixed stays as strings
        });
        it('should handle frontmatter without closing delimiter', () => {
            const content = `---
id: 1
title: Incomplete
This is content without closing delimiter`;
            const result = parseMarkdown(content);
            // The parser will still parse metadata until it runs out of lines
            expect(result.metadata).toEqual({
                id: 1,
                title: 'Incomplete'
            });
            expect(result.content).toBe('---\nid: 1\ntitle: Incomplete\nThis is content without closing delimiter');
        });
    });
    describe('generateMarkdown', () => {
        it('should generate markdown with frontmatter', () => {
            const metadata = {
                id: 123,
                title: 'Test Title',
                tags: ['tag1', 'tag2'],
                priority: 'high',
                created_at: '2025-01-24T10:00:00Z'
            };
            const content = '# Test Content\n\nThis is the body.';
            const result = generateMarkdown(metadata, content);
            expect(result).toBe(`---
id: 123
title: Test Title
tags: ["tag1","tag2"]
priority: high
created_at: 2025-01-24T10:00:00Z
---

# Test Content

This is the body.`);
        });
        it('should handle null and undefined values', () => {
            const metadata = {
                id: 1,
                title: 'Test',
                description: null,
                optional: undefined
            };
            const result = generateMarkdown(metadata, 'Content');
            expect(result).toContain('description: \n');
            expect(result).toContain('optional: \n');
        });
        it('should handle empty arrays', () => {
            const metadata = {
                id: 1,
                tags: [],
                related: []
            };
            const result = generateMarkdown(metadata, 'Content');
            expect(result).toContain('tags: []');
            expect(result).toContain('related: []');
        });
    });
    describe('parseDocumentMarkdown', () => {
        it('should parse document with all fields', () => {
            const content = `---
id: 42
type: docs
title: Documentation
description: Test description
tags: doc, test
created_at: 2025-01-24T10:00:00Z
updated_at: 2025-01-24T11:00:00Z
---

Document content here`;
            const result = parseDocumentMarkdown(content, 42, 'docs');
            expect(result).toEqual({
                id: 42,
                type: 'docs',
                title: 'Documentation',
                description: 'Test description',
                content: 'Document content here',
                tags: ['doc', 'test'],
                created_at: '2025-01-24T10:00:00Z',
                updated_at: '2025-01-24T11:00:00Z'
            });
        });
        it('should use passed type when metadata type is missing', () => {
            const content = `---
title: No Type
---

Content`;
            const result = parseDocumentMarkdown(content, 1, 'knowledge');
            expect(result.type).toBe('knowledge');
        });
        it('should provide defaults for missing fields', () => {
            const content = 'Just content, no frontmatter';
            const result = parseDocumentMarkdown(content, 1, 'docs');
            expect(result.id).toBe(1);
            expect(result.type).toBe('docs');
            expect(result.title).toBe('');
            expect(result.description).toBeUndefined();
            expect(result.tags).toEqual([]);
            expect(result.created_at).toBeDefined();
            expect(result.updated_at).toBeDefined();
        });
    });
    describe('generateDocumentMarkdown', () => {
        it('should generate markdown for document', () => {
            const document = {
                id: 123,
                type: 'docs',
                title: 'Test Document',
                description: 'A test document',
                content: 'Document body content',
                tags: ['doc', 'test'],
                created_at: '2025-01-24T10:00:00Z',
                updated_at: '2025-01-24T11:00:00Z'
            };
            const result = generateDocumentMarkdown(document);
            expect(result).toContain('id: 123');
            expect(result).toContain('type: docs');
            expect(result).toContain('title: Test Document');
            expect(result).toContain('description: A test document');
            expect(result).toContain('tags: ["doc","test"]');
            expect(result).toContain('Document body content');
        });
        it('should omit description when undefined', () => {
            const document = {
                id: 1,
                type: 'docs',
                title: 'No Description',
                content: 'Content',
                tags: [],
                created_at: '2025-01-24T10:00:00Z',
                updated_at: '2025-01-24T10:00:00Z'
            };
            const result = generateDocumentMarkdown(document);
            expect(result).not.toContain('description:');
        });
    });
    describe('edge cases', () => {
        it('should handle content with multiple --- lines', () => {
            const content = `---
id: 1
title: Test
---

Some content with --- in it
---
More content`;
            const result = parseMarkdown(content);
            expect(result.metadata.id).toBe(1);
            expect(result.content).toContain('---');
        });
        it('should handle special characters in values', () => {
            const content = `---
title: Title: with colon
description: "Quoted value"
special: Value with: many: colons:
---

Content`;
            const result = parseMarkdown(content);
            expect(result.metadata.title).toBe('Title: with colon');
            expect(result.metadata.description).toBe('"Quoted value"');
            expect(result.metadata.special).toBe('Value with: many: colons:');
        });
        it('should handle numeric strings that should stay as strings', () => {
            const content = `---
version: 1.0.0
code: 00123
---

Content`;
            const result = parseMarkdown(content);
            expect(result.metadata.version).toBe('1.0.0');
            // Numbers with leading zeros are converted to numbers
            expect(result.metadata.code).toBe(123);
        });
    });
});
//# sourceMappingURL=markdown-parser.test.js.map