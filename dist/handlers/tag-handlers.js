import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { CreateTagSchema, DeleteTagSchema, SearchTagSchema, SearchAllByTagSchema } from '../schemas/tag-schemas.js';
import { createLogger } from '../utils/logger.js';
export class TagHandlers {
    db;
    logger = createLogger('TagHandlers');
    handlerName = 'TagHandlers';
    constructor(db) {
        this.db = db;
    }
    async handleGetTags() {
        try {
            const tags = await this.db.getTags();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: tags })
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to get tags', { error });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to retrieve tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleCreateTag(args) {
        try {
            const validatedArgs = CreateTagSchema.parse(args);
            const tag = await this.db.createTag(validatedArgs.name);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: tag, message: 'Tag created successfully' })
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to create tag', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleDeleteTag(args) {
        try {
            const validatedArgs = DeleteTagSchema.parse(args);
            const success = await this.db.deleteTag(validatedArgs.name);
            if (!success) {
                throw new McpError(ErrorCode.InvalidRequest, `Tag "${validatedArgs.name}" not found. Use 'get_tags' to see all available tags.`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ message: `Tag "${validatedArgs.name}" deleted successfully` })
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to delete tag', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to delete tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleSearchTags(args) {
        try {
            const validatedArgs = SearchTagSchema.parse(args);
            const tags = await this.db.searchTags(validatedArgs.pattern);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: tags })
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to search tags', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to search tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleSearchAllByTag(args) {
        try {
            const validatedArgs = SearchAllByTagSchema.parse(args);
            const results = await this.db.searchAllByTag(validatedArgs.tag);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ data: results })
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to search all by tag', { error, args });
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to search items by tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
