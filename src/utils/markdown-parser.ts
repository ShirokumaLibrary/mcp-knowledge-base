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

import { Content } from '../types/domain-types.js';

export interface ParsedMarkdown {
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
  let inFrontMatter = false;
  
  // @ai-logic: State machine starts by checking for frontmatter delimiter
  if (lines[0] === '---') {
    inFrontMatter = true;
    
    // @ai-flow: Line-by-line parsing until closing delimiter
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // @ai-logic: Second '---' marks end of frontmatter
      if (line === '---') {
        contentStartIndex = i + 1;
        break;
      }
      
      // @ai-logic: Simple regex for 'key: value' pattern
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        
        // @ai-logic: Type inference based on key names and value patterns
        if (value.trim() === '') {
          metadata[key] = null;  // @ai-edge-case: Empty values become null
        } else if (key === 'tags' || key === 'related_issues') {
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
            if (key === 'related_issues' && items.length > 0) {
              metadata[key] = items.map(item => Number(item));  // @ai-logic: Issue IDs are numbers
            } else {
              metadata[key] = items;
            }
          }
        } else if (value.includes(',')) {
          // Simple array parsing for comma-separated values
          const items = value.split(',').map(v => v.trim()).filter(v => v);
          // Check if all items are numbers
          if (items.length > 0 && items.every(item => !isNaN(Number(item)))) {
            metadata[key] = items.map(item => Number(item));
          } else {
            metadata[key] = items;
          }
        } else if (value === 'true' || value === 'false') {
          metadata[key] = value === 'true';
        } else if (!isNaN(Number(value))) {
          metadata[key] = Number(value);
        } else {
          metadata[key] = value.trim();
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
 * @ai-intent Parse content markdown file
 * @ai-pattern Specific parser for Content type with type field
 * @ai-validation Ensures type field exists
 */
export function parseContentMarkdown(fileContent: string, id: number): Content {
  const { metadata, content } = parseMarkdown(fileContent);
  
  return {
    id,
    type: metadata.type || 'doc', // Default to 'doc' if not specified
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
export function generateContentMarkdown(content: Content): string {
  const metadata: Record<string, any> = {
    id: content.id,
    type: content.type,
    title: content.title,
    tags: content.tags,
    created_at: content.created_at,
    updated_at: content.updated_at
  };

  if (content.description) {
    metadata.description = content.description;
  }

  return generateMarkdown(metadata, content.content);
}