/**
 * @ai-context MCP handlers for tag management operations
 * @ai-pattern Handler class for tag CRUD and search
 * @ai-critical Tags are shared across all content types
 * @ai-dependencies Database for tag persistence
 * @ai-assumption Tag names are unique (case-insensitive)
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { CreateTagSchema, DeleteTagSchema, SearchTagSchema, SearchAllByTagSchema } from '../schemas/tag-schemas.js';
/**
 * @ai-context Handles MCP tool calls for tag operations
 * @ai-pattern CRUD handlers plus search functionality
 * @ai-critical Tags enable cross-content categorization
 * @ai-lifecycle Tags auto-created when used, manually managed
 * @ai-why Flexible categorization across all content types
 */
export class TagHandlers {
    db;
    /**
     * @ai-intent Initialize with database dependency
     * @ai-pattern Dependency injection
     * @ai-assumption Database handles all tag operations
     */
    constructor(db) {
        this.db = db;
    }
    /**
     * @ai-intent Handle get_tags MCP tool call
     * @ai-flow 1. Fetch all tags -> 2. Return as JSON
     * @ai-pattern Simple list operation, no arguments
     * @ai-return Array of tags with usage counts
     * @ai-performance May include usage statistics
     */
    async handleGetTags() {
        const tags = await this.db.getTags(); // @ai-logic: Includes usage counts
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ data: tags }, null, 2),
                },
            ],
        };
    }
    /**
     * @ai-intent Handle create_tag MCP tool call
     * @ai-flow 1. Validate name -> 2. Create tag -> 3. Handle errors -> 4. Return
     * @ai-validation Name required and non-empty
     * @ai-error-handling Catches duplicate tag errors
     * @ai-side-effects Inserts into tags table
     * @ai-pattern Auto-creation usually preferred over manual
     */
    async handleCreateTag(args) {
        const validatedArgs = CreateTagSchema.parse(args);
        try {
            const tag = await this.db.createTag(validatedArgs.name);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Tag created: ${tag}`, // @ai-logic: Returns tag name
                    },
                ],
            };
        }
        catch (error) {
            // @ai-error-handling: Convert DB errors to MCP format
            throw new McpError(ErrorCode.InvalidRequest, error instanceof Error ? error.message : 'Failed to create tag');
        }
    }
    /**
     * @ai-intent Handle delete_tag MCP tool call
     * @ai-flow 1. Validate name -> 2. Delete tag -> 3. Check success -> 4. Return
     * @ai-validation Name required (not ID)
     * @ai-critical Removes tag from all associated items
     * @ai-bug Parameter is name not ID - inconsistent with other deletes
     * @ai-return Success message or error
     */
    async handleDeleteTag(args) {
        const validatedArgs = DeleteTagSchema.parse(args);
        const success = await this.db.deleteTag(validatedArgs.name); // @ai-bug: Uses name not ID
        if (!success) {
            throw new McpError(ErrorCode.InvalidRequest, `Tag "${validatedArgs.name}" not found`);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Tag "${validatedArgs.name}" deleted`,
                },
            ],
        };
    }
    /**
     * @ai-intent Handle search_tags MCP tool call
     * @ai-flow 1. Validate pattern -> 2. Search tags -> 3. Return matches
     * @ai-validation Pattern required for substring match
     * @ai-pattern Case-insensitive LIKE search with % wildcards
     * @ai-return Array of matching tags with usage counts
     */
    async handleSearchTags(args) {
        const validatedArgs = SearchTagSchema.parse(args);
        const tags = await this.db.searchTags(validatedArgs.pattern); // @ai-pattern: SQL LIKE %pattern%
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ data: tags }, null, 2),
                },
            ],
        };
    }
    /**
     * @ai-intent Handle cross-type tag search
     * @ai-flow 1. Validate tag -> 2. Search all types -> 3. Return categorized
     * @ai-validation Exact tag name required
     * @ai-pattern Searches issues, plans, docs, knowledge, sessions
     * @ai-bug Missing await on searchAllByTag call
     * @ai-return Object with arrays for each content type
     */
    async handleSearchAllByTag(args) {
        const validatedArgs = SearchAllByTagSchema.parse(args);
        const results = await this.db.searchAllByTag(validatedArgs.tag); // @ai-fix: Added missing await
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ data: results }, null, 2), // @ai-pattern: Categorized by type
                },
            ],
        };
    }
}
//# sourceMappingURL=tag-handlers.js.map