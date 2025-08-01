import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { UpdateCurrentStateSchema, CurrentStateMetadataSchema } from '../schemas/current-state-schemas.js';
import { createLogger } from '../utils/logger.js';
import { parseMarkdown, generateMarkdown } from '../utils/markdown-parser.js';
import * as path from 'path';
import * as fs from 'fs/promises';
export class CurrentStateHandlers {
    dataDir;
    tagRepo;
    validateRelatedItems;
    logger = createLogger('CurrentStateHandlers');
    handlerName = 'CurrentStateHandlers';
    filePath;
    constructor(dataDir, tagRepo, validateRelatedItems) {
        this.dataDir = dataDir;
        this.tagRepo = tagRepo;
        this.validateRelatedItems = validateRelatedItems;
        this.filePath = path.join(dataDir, 'current_state.md');
    }
    async handleGetCurrentState() {
        this.logger.info('Getting current state');
        try {
            const rawContent = await fs.readFile(this.filePath, 'utf-8');
            const parsed = parseMarkdown(rawContent);
            if (parsed.metadata) {
                if (parsed.metadata.tags === null)
                    parsed.metadata.tags = [];
                if (parsed.metadata.related === null)
                    parsed.metadata.related = [];
            }
            const metadata = CurrentStateMetadataSchema.parse(parsed.metadata || {});
            const response = {
                content: parsed.content,
                metadata: metadata
            };
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(response)
                    }]
            };
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                const defaultMetadata = CurrentStateMetadataSchema.parse({});
                const response = {
                    content: '',
                    metadata: defaultMetadata
                };
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(response)
                        }]
                };
            }
            this.logger.error('Failed to read current state', error);
            throw new McpError(ErrorCode.InternalError, `Failed to read current state. ` +
                `Please ensure the file exists at ${this.filePath} and is readable. ` +
                `If this is a permission issue, please check file permissions. ` +
                `Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async handleUpdateCurrentState(args) {
        this.logger.info('Updating current state');
        const params = UpdateCurrentStateSchema.parse(args);
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            const metadata = {
                title: 'プロジェクト現在状態',
                type: 'current_state',
                priority: 'high',
                tags: params.tags || ['system', 'state'],
                updated_at: new Date().toISOString(),
                updated_by: params.updated_by || 'system'
            };
            if (params.related?.length) {
                if (this.validateRelatedItems) {
                    try {
                        const validatedRelated = await this.validateRelatedItems(params.related);
                        if (validatedRelated.length < params.related.length) {
                            const invalid = params.related.filter(item => !validatedRelated.includes(item));
                            throw new McpError(ErrorCode.InvalidRequest, `The following related items do not exist: ${invalid.join(', ')}. ` +
                                `Please create these items first or remove them from the related field. ` +
                                `Valid items: ${validatedRelated.join(', ')}`);
                        }
                        metadata.related = validatedRelated;
                    }
                    catch (error) {
                        if (error instanceof McpError) {
                            throw error;
                        }
                        throw new McpError(ErrorCode.InternalError, `Failed to validate related items. Please check the format (type-id) and try again. ` +
                            `Expected format: issues-123, docs-456, sessions-2025-01-01-12.00.00.000`);
                    }
                }
                else {
                    metadata.related = params.related;
                }
            }
            else {
                metadata.related = [];
            }
            const fullContent = generateMarkdown(metadata, params.content);
            await fs.writeFile(this.filePath, fullContent, 'utf-8');
            if (this.tagRepo && params.tags?.length) {
                try {
                    await this.tagRepo.ensureTagsExist(params.tags);
                    this.logger.info(`Registered ${params.tags.length} tags`);
                }
                catch (error) {
                    throw new McpError(ErrorCode.InternalError, `Failed to register tags: ${params.tags.join(', ')}. ` +
                        `Please check if the tag names are valid (alphanumeric, hyphens, underscores only) and try again.`);
                }
            }
            return {
                content: [{
                        type: 'text',
                        text: 'Current state updated successfully'
                    }]
            };
        }
        catch (error) {
            this.logger.error('Failed to update current state', error);
            if (error instanceof McpError) {
                throw error;
            }
            throw new McpError(ErrorCode.InternalError, `Failed to update current state. ` +
                `Please check: 1) The content is valid text, 2) Tags contain only alphanumeric characters, hyphens, or underscores, ` +
                `3) Related items follow the format 'type-id' (e.g., issues-123). ` +
                `Original error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
