/**
 * @ai-context Markdown formatter for session and summary persistence
 * @ai-pattern Custom markdown format with YAML frontmatter
 * @ai-critical Handles serialization/deserialization for file storage
 * @ai-assumption Sessions use complex format, summaries use simple format
 * @ai-why Human-readable format allows manual editing
 */
import { WorkSession, DailySummary } from '../types/session-types.js';
/**
 * @ai-context Formats work sessions and daily summaries to/from markdown
 * @ai-pattern Two-way conversion maintaining data integrity
 * @ai-critical Parsing must handle legacy and modern formats
 * @ai-lifecycle Sessions evolve: legacy -> frontmatter format
 * @ai-why Markdown provides version control friendly storage
 */
export declare class SessionMarkdownFormatter {
    /**
     * @ai-intent Generate modern markdown format with frontmatter
     * @ai-flow 1. Build YAML header -> 2. Add title -> 3. Add metadata -> 4. Add content
     * @ai-pattern YAML frontmatter + markdown body
     * @ai-critical Quotes prevent YAML parsing errors
     * @ai-assumption All string values quoted for safety
     * @ai-return Complete markdown file content
     */
    generateSessionMarkdown(session: WorkSession): string;
    /**
     * @ai-intent Generate legacy format without frontmatter
     * @ai-flow Simple markdown with inline metadata
     * @ai-pattern Used for minimal sessions
     * @ai-deprecated Prefer generateSessionMarkdown for new sessions
     * @ai-why Backward compatibility with older files
     */
    generateLegacySessionMarkdown(session: WorkSession): string;
    /**
     * @ai-intent Parse markdown back to WorkSession object
     * @ai-flow 1. Detect format -> 2. Route to parser -> 3. Return session
     * @ai-pattern Auto-detects frontmatter vs legacy format
     * @ai-critical Must handle both formats for compatibility
     * @ai-return Always returns valid session (no null)
     */
    parseSessionFromMarkdown(content: string, sessionId: string, date: string): WorkSession;
    /**
     * @ai-intent Parse modern format with YAML frontmatter
     * @ai-flow 1. Extract metadata -> 2. Parse body -> 3. Build session
     * @ai-complexity Complex parsing to extract clean content
     * @ai-critical Must skip redundant body metadata
     * @ai-assumption Frontmatter values follow exact format
     */
    private parseFrontMatterSession;
    /**
     * @ai-intent Parse legacy format without frontmatter
     * @ai-flow 1. Extract title -> 2. Find metadata -> 3. Get content
     * @ai-pattern Simple regex-based extraction
     * @ai-fallback Default values for missing fields
     * @ai-return Minimal session object
     */
    private parseLegacySession;
    /**
     * @ai-intent Generate markdown for daily summary
     * @ai-flow 1. YAML header -> 2. Title -> 3. Content
     * @ai-pattern Simpler than sessions - no redundant metadata
     * @ai-critical Date is primary key in frontmatter
     * @ai-return Complete markdown file content
     */
    generateDailySummaryMarkdown(summary: DailySummary): string;
    /**
     * @ai-intent Parse markdown back to DailySummary
     * @ai-flow 1. Extract frontmatter -> 2. Parse fields -> 3. Build summary
     * @ai-validation Returns null if no frontmatter
     * @ai-pattern Only supports frontmatter format
     * @ai-return Summary object or null
     */
    parseDailySummaryFromMarkdown(content: string, date: string): DailySummary | null;
}
