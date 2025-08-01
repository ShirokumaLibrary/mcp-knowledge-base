/**
 * @ai-context YAML frontmatter parser for markdown-based storage
 * @ai-pattern Simple state machine for parsing structured data
 * @ai-critical Core utility for all file-based operations - errors here affect entire system
 * @ai-why Custom parser avoids heavy YAML dependencies while handling our specific needs
 *
 * @ai-markdown-format
 * All content files follow this structure:
 * ```
 * ---
 * id: 123
 * title: Example Title
 * tags: tag1, tag2, tag3
 * priority: high
 * status_id: 1
 * created_at: 2025-01-24T10:00:00Z
 * updated_at: 2025-01-24T10:00:00Z
 * ---
 *
 * Content goes here (markdown for docs/knowledge,
 * plain text for issues/plans)
 * ```
 *
 * @ai-type-conversion-rules
 * - Empty values -> null
 * - 'tags', 'related_issues' -> always arrays (split by comma)
 * - Fields ending with '_id' or named 'id' -> numbers
 * - 'true'/'false' strings -> booleans
 * - Everything else -> strings
 *
 * @ai-robustness
 * - Never throws errors - returns empty metadata if malformed
 * - Handles missing frontmatter gracefully
 * - Preserves content even if metadata parsing fails
 */

import type { Document } from '../types/domain-types.js';

export interface ParsedMarkdown {
  // @ai-any-deliberate: YAML frontmatter can contain any valid YAML structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  content: string;
}

/**
 * @ai-intent Extract YAML frontmatter and content from markdown files
 * @ai-flow 1. Split lines -> 2. Detect frontmatter -> 3. Parse key-value -> 4. Extract content
 * @ai-edge-case Handles missing frontmatter, empty values, various data types
 * @ai-assumption Simple YAML subset: no nested objects, no multi-line values
 * @ai-return Always returns object with metadata and content, never throws
 */
export function parseMarkdown(fileContent: string): ParsedMarkdown {
  const lines = fileContent.split('\n');
  const metadata: Record<string, any> = {};
  let contentStartIndex = -1;

  // @ai-logic: State machine starts by checking for frontmatter delimiter
  if (lines[0] === '---') {
    let currentKey: string | null = null;
    let currentArray: string[] = [];

    // @ai-flow: Line-by-line parsing until closing delimiter
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // @ai-logic: Second '---' marks end of frontmatter
      if (line === '---') {
        // Save any pending array
        if (currentKey && currentArray.length > 0) {
          metadata[currentKey] = currentArray;
        }
        contentStartIndex = i + 1;
        break;
      }

      // Check for YAML array item (starts with - )
      const arrayMatch = line.match(/^\s*-\s+(.+)$/);
      if (arrayMatch && currentKey) {
        currentArray.push(arrayMatch[1].trim());
        continue;
      }

      // @ai-logic: Simple regex for 'key: value' pattern
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        // Save any pending array from previous key
        if (currentKey && currentArray.length > 0) {
          metadata[currentKey] = currentArray;
          currentArray = [];
        }

        const [, key, value] = match;
        currentKey = key;

        // @ai-logic: Type inference based on key names and value patterns
        if (value.trim() === '') {
          // Check if next line starts an array
          if (i + 1 < lines.length && lines[i + 1].match(/^\s*-\s+/)) {
            // This is the start of a YAML array
            currentArray = [];
            continue;
          } else {
            metadata[key] = null;  // @ai-edge-case: Empty values become null
            currentKey = null;
          }
        } else if (key === 'tags' || key === 'related_tasks' || key === 'related_documents' || key === 'related') {
          // @ai-why: These fields are always arrays for consistent API
          // @ai-logic: Check if value is JSON array format
          if (value.trim().startsWith('[') && value.trim().endsWith(']')) {
            try {
              metadata[key] = JSON.parse(value);
            } catch {
              // If JSON parse fails, fall back to comma-separated
              const items = value.split(',').map(v => v.trim()).filter(v => v);
              metadata[key] = items;
            }
          } else {
            const items = value.split(',').map(v => v.trim()).filter(v => v);
            metadata[key] = items;
          }
          currentKey = null;
        } else if (value.includes(',')) {
          // Simple array parsing for comma-separated values
          const items = value.split(',').map(v => v.trim()).filter(v => v);
          // Check if all items are numbers
          if (items.length > 0 && items.every(item => !isNaN(Number(item)))) {
            metadata[key] = items.map(item => Number(item));
          } else {
            metadata[key] = items;
          }
          currentKey = null;
        } else if (value === 'true' || value === 'false') {
          metadata[key] = value === 'true';
          currentKey = null;
        } else if (!isNaN(Number(value))) {
          metadata[key] = Number(value);
          currentKey = null;
        } else {
          metadata[key] = value.trim();
          currentKey = null;
        }
      }
    }
  }

  // Extract content (everything after front matter)
  const content = contentStartIndex >= 0
    ? lines.slice(contentStartIndex).join('\n').trim()
    : fileContent.trim();

  return { metadata, content };
}

/**
 * @ai-intent Generate markdown file with YAML frontmatter
 * @ai-flow 1. Build frontmatter lines -> 2. Format values -> 3. Combine with content
 * @ai-critical Must produce parseable output - used for all file writes
 * @ai-assumption Values are already validated and safe to serialize
 * @ai-why Symmetric with parseMarkdown for round-trip data preservation
 */
export function generateMarkdown(metadata: Record<string, any>, content: string): string {
  const lines: string[] = ['---'];

  // @ai-logic: Iterate metadata preserving insertion order
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      lines.push(`${key}: `);  // @ai-edge-case: Preserve null as empty value
    } else if (Array.isArray(value)) {
      // @ai-logic: Arrays as JSON to preserve items with commas/spaces
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('---', '', content);  // @ai-logic: Empty line separates frontmatter from content

  return lines.join('\n');
}

/**
 * @ai-intent Parse document markdown file
 * @ai-pattern Specific parser for Document type with type field
 * @ai-validation Ensures type field exists
 */
export function parseDocumentMarkdown(fileContent: string, id: number, type: string): Document {
  const { metadata, content } = parseMarkdown(fileContent);

  return {
    id,
    type: metadata.type || type, // Use passed type parameter
    title: metadata.title || '',
    description: metadata.description || undefined,
    content,
    tags: metadata.tags || [],
    created_at: metadata.created_at || new Date().toISOString(),
    updated_at: metadata.updated_at || new Date().toISOString()
  };
}

/**
 * @ai-intent Generate markdown for content
 * @ai-pattern Includes type field in metadata
 */
export function generateDocumentMarkdown(document: Document): string {
  const metadata: Record<string, any> = {
    id: document.id,
    type: document.type,
    title: document.title,
    tags: document.tags,
    created_at: document.created_at,
    updated_at: document.updated_at
  };

  if (document.description) {
    metadata.description = document.description;
  }

  return generateMarkdown(metadata, document.content);
}