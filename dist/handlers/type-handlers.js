/**
 * @ai-context MCP handlers for type management operations
 * @ai-pattern Handler pattern for dynamic type system
 */
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { TypeRepository } from '../database/type-repository.js';
import { CreateTypeSchema, GetTypesSchema, DeleteTypeSchema } from '../schemas/type-schemas.js';
export class TypeHandlers {
    db;
    typeRepo;
    constructor(db) {
        this.db = db;
        this.typeRepo = new TypeRepository(db);
    }
    /**
     * @ai-intent Initialize type repository
     */
    async init() {
        await this.typeRepo.init();
    }
    /**
     * @ai-intent Create a new custom type
     * @ai-validation Validates type definition and checks for conflicts
     */
    async handleCreateType(args) {
        try {
            const validatedArgs = CreateTypeSchema.parse(args);
            await this.typeRepo.createType(validatedArgs.name, validatedArgs.base_type);
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
    /**
     * @ai-intent Get all available types
     * @ai-return List of types grouped by base_type with descriptions
     */
    async handleGetTypes(args) {
        const validatedArgs = GetTypesSchema.parse(args);
        const types = await this.typeRepo.getAllTypes();
        // @ai-logic: Group types by base_type
        const typesByBase = {};
        for (const type of types) {
            if (!typesByBase[type.base_type]) {
                typesByBase[type.base_type] = [];
            }
            typesByBase[type.base_type].push(type);
        }
        // @ai-logic: Format response with base_type explanations
        let output = '## Available Types\n\n';
        // Tasks types
        if (typesByBase['tasks']) {
            output += '### Tasks (タスク管理)\n';
            output += 'ステータスと優先度を持つタスク型。プロジェクト管理やバグトラッキングに使用。\n\n';
            output += '| Type | Description |\n';
            output += '|------|-------------|\n';
            for (const type of typesByBase['tasks']) {
                const desc = type.type === 'issues' ? 'バグ・課題・タスク管理' :
                    type.type === 'plans' ? 'プロジェクト計画（開始・終了日付き）' :
                        'カスタムタスク型';
                output += `| ${type.type} | ${desc} |\n`;
            }
            output += '\n';
        }
        // Documents types
        if (typesByBase['documents']) {
            output += '### Documents (ドキュメント)\n';
            output += 'コンテンツが必須のドキュメント型。知識ベースや技術文書に使用。\n\n';
            output += '| Type | Description |\n';
            output += '|------|-------------|\n';
            for (const type of typesByBase['documents']) {
                const desc = type.type === 'docs' ? '技術ドキュメント' :
                    type.type === 'knowledge' ? 'ナレッジベース' :
                        'カスタムドキュメント型';
                output += `| ${type.type} | ${desc} |\n`;
            }
            output += '\n';
        }
        // Other base types
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
        // @ai-logic: Include full type definitions if requested
        if (validatedArgs.include_definitions) {
            output += '## Type Definitions (JSON)\n\n';
            output += '```json\n';
            const definitions = types.map(t => ({
                type: t.type,
                base_type: t.base_type,
                supported_fields: this.getFieldsForBaseType(t.base_type)
            }));
            output += JSON.stringify(definitions, null, 2);
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
    /**
     * @ai-intent Get supported fields for a base type
     */
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
    /**
     * @ai-intent Delete a custom type
     * @ai-validation Checks for existing documents before deletion
     */
    async handleDeleteType(args) {
        try {
            const validatedArgs = DeleteTypeSchema.parse(args);
            // Deletion check is now handled inside deleteType method
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
//# sourceMappingURL=type-handlers.js.map