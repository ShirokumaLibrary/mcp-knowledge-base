import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TypeRepository } from '../database/type-repository.js';
import { CreateTypeSchema, GetTypesSchema, DeleteTypeSchema, UpdateTypeSchema } from '../schemas/type-schemas.js';
import { createLogger } from '../utils/logger.js';
export class TypeHandlers {
    db;
    typeRepo;
    logger = createLogger('TypeHandlers');
    handlerName = 'TypeHandlers';
    constructor(db) {
        this.db = db;
        this.typeRepo = new TypeRepository(db);
    }
    async init() {
        await this.typeRepo.init();
    }
    async handleCreateType(args) {
        try {
            const validatedArgs = CreateTypeSchema.parse(args);
            await this.typeRepo.createType(validatedArgs.name, validatedArgs.base_type, validatedArgs.description);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Type "${validatedArgs.name}" created successfully with base_type "${validatedArgs.base_type}"`
                    }
                ]
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InvalidRequest, error.message);
            }
            throw error;
        }
    }
    async handleGetTypes(args) {
        const validatedArgs = GetTypesSchema.parse(args);
        const types = await this.typeRepo.getAllTypes();
        const typesByBase = {};
        for (const type of types) {
            if (!typesByBase[type.base_type]) {
                typesByBase[type.base_type] = [];
            }
            typesByBase[type.base_type].push(type);
        }
        let output = '## Available Types\n\n';
        if (typesByBase['tasks']) {
            output += '### Tasks (Task Management)\n';
            output += 'Task types with status and priority. Used for project management and bug tracking.\n\n';
            output += '| Type | Description |\n';
            output += '|------|-------------|\n';
            for (const type of typesByBase['tasks']) {
                const desc = type.description || 'Custom Task Type';
                output += `| ${type.type} | ${desc} |\n`;
            }
            output += '\n';
        }
        if (typesByBase['documents']) {
            output += '### Documents (Documents)\n';
            output += 'Document types with required content. Used for knowledge base and technical documentation.\n\n';
            output += '| Type | Description |\n';
            output += '|------|-------------|\n';
            for (const type of typesByBase['documents']) {
                const desc = type.description || 'Custom Document Type';
                output += `| ${type.type} | ${desc} |\n`;
            }
            output += '\n';
        }
        for (const [baseType, typeList] of Object.entries(typesByBase)) {
            if (baseType !== 'tasks' && baseType !== 'documents') {
                output += `### ${baseType}\n\n`;
                output += '| Type | Base Type |\n';
                output += '|------|-----------|\n';
                for (const type of typeList) {
                    output += `| ${type.type} | ${type.base_type} |\n`;
                }
                output += '\n';
            }
        }
        output += '### Special Types\n';
        output += 'These types have special ID formats and are always available:\n\n';
        output += '| Type | Description | ID Format |\n';
        output += '|------|-------------|----------|\n';
        output += '| sessions | Work session tracking. Content is optional - can be created at session start and updated later. | YYYY-MM-DD-HH.MM.SS.sss |\n';
        output += '| dailies | Daily summaries with required content. One entry per date. | YYYY-MM-DD |\n';
        output += '\n';
        if (validatedArgs.include_definitions) {
            output += '## Type Definitions (JSON)\n\n';
            output += '```json\n';
            const definitions = [
                ...types.map(t => ({
                    type: t.type,
                    base_type: t.base_type,
                    description: t.description,
                    supported_fields: this.getFieldsForBaseType(t.base_type)
                })),
                {
                    type: 'sessions',
                    base_type: 'sessions',
                    description: 'Work session tracking. Content is optional - can be created at session start and updated later. Uses timestamp-based IDs.',
                    supported_fields: ['title', 'content', 'description', 'tags', 'related_tasks', 'related_documents']
                },
                {
                    type: 'dailies',
                    base_type: 'documents',
                    description: 'Daily summaries with required content. One entry per date. Uses date as ID (YYYY-MM-DD).',
                    supported_fields: ['title', 'content', 'description', 'tags', 'related_tasks', 'related_documents']
                }
            ];
            output += JSON.stringify(definitions);
            output += '\n```\n';
        }
        return {
            content: [
                {
                    type: 'text',
                    text: output
                }
            ]
        };
    }
    getFieldsForBaseType(baseType) {
        switch (baseType) {
            case 'tasks':
                return ['title', 'content', 'description', 'priority', 'status', 'tags', 'start_date', 'end_date', 'related_tasks'];
            case 'documents':
                return ['title', 'content', 'description', 'tags'];
            default:
                return ['title', 'content', 'tags'];
        }
    }
    async handleUpdateType(args) {
        try {
            const validatedArgs = UpdateTypeSchema.parse(args);
            await this.typeRepo.updateType(validatedArgs.name, validatedArgs.description);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Type "${validatedArgs.name}" description updated successfully`
                    }
                ]
            };
        }
        catch (error) {
            this.logger.error('Failed to update type', { error, args });
            throw new McpError(ErrorCode.InternalError, `Failed to update type: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleDeleteType(args) {
        try {
            const validatedArgs = DeleteTypeSchema.parse(args);
            await this.typeRepo.deleteType(validatedArgs.name);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Type "${validatedArgs.name}" deleted successfully`
                    }
                ]
            };
        }
        catch (error) {
            if (error instanceof McpError) {
                throw error;
            }
            if (error instanceof Error) {
                throw new McpError(ErrorCode.InvalidRequest, error.message);
            }
            throw error;
        }
    }
}
