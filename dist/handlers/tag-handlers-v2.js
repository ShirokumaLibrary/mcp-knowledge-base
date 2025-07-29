import { BaseHandler } from './base-handler.js';
import { CreateTagSchema, DeleteTagSchema, SearchTagSchema } from '../schemas/tag-schemas.js';
import { z } from 'zod';
const EmptySchema = z.object({});
export class TagHandlersV2 extends BaseHandler {
    constructor(database) {
        super('TagHandlers', database);
    }
    async initialize() {
    }
    handleGetTags = this.wrapHandler('get tags', EmptySchema, async () => {
        this.ensureDatabase();
        const tags = await this.database.getTags();
        if (tags.length === 0) {
            return this.createResponse('## Tags\n\nNo tags found. Tags are automatically created when you use them.');
        }
        const sortedTags = tags.sort((a, b) => a.name.localeCompare(b.name));
        const markdown = [
            '## Available Tags',
            '',
            ...sortedTags.map((tag) => `- ${tag.name} (used ${tag.count} times)`)
        ].join('\n');
        return this.createResponse(markdown);
    });
    handleCreateTag = this.wrapHandler('create tag', CreateTagSchema, async (args) => {
        this.ensureDatabase();
        const tag = await this.database.createTag(args.name);
        return this.createResponse(`## Tag Created\n\nTag "${tag.name}" has been created successfully.`);
    });
    handleDeleteTag = this.wrapHandler('delete tag', DeleteTagSchema, async (args) => {
        this.ensureDatabase();
        const deleted = await this.database.deleteTag(args.name);
        if (!deleted) {
            return this.createErrorResponse(`Tag "${args.name}" not found`);
        }
        return this.createResponse(`## Tag Deleted\n\nTag "${args.name}" has been deleted. All references to this tag have been removed.`);
    });
    handleSearchTags = this.wrapHandler('search tags', SearchTagSchema, async (args) => {
        this.ensureDatabase();
        const tags = await this.database.searchTags(args.pattern);
        if (tags.length === 0) {
            return this.createResponse(`## Search Results\n\nNo tags found matching "${args.pattern}".`);
        }
        const markdown = [
            `## Tags Matching "${args.pattern}"`,
            '',
            ...tags.map((tag) => `- ${tag.name} (used ${tag.count} times)`)
        ].join('\n');
        return this.createResponse(markdown);
    });
}
