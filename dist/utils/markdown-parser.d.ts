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
import { Document } from '../types/domain-types.js';
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
export declare function parseMarkdown(fileContent: string): ParsedMarkdown;
/**
 * @ai-intent Generate markdown file with YAML frontmatter
 * @ai-flow 1. Build frontmatter lines -> 2. Format values -> 3. Combine with content
 * @ai-critical Must produce parseable output - used for all file writes
 * @ai-assumption Values are already validated and safe to serialize
 * @ai-why Symmetric with parseMarkdown for round-trip data preservation
 */
export declare function generateMarkdown(metadata: Record<string, any>, content: string): string;
/**
 * @ai-intent Parse document markdown file
 * @ai-pattern Specific parser for Document type with type field
 * @ai-validation Ensures type field exists
 */
export declare function parseDocumentMarkdown(fileContent: string, id: number, type: string): Document;
/**
 * @ai-intent Generate markdown for content
 * @ai-pattern Includes type field in metadata
 */
export declare function generateDocumentMarkdown(document: Document): string;
