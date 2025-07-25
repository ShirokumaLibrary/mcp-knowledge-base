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
            await this.typeRepo.createType(validatedArgs.name);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Type "${validatedArgs.name}" created successfully`
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
     * @ai-return List of built-in and custom types
     */
    async handleGetTypes(args) {
        const validatedArgs = GetTypesSchema.parse(args);
        let types = await this.typeRepo.getAllTypes();
        // @ai-logic: Filter based on include_built_in flag
        if (!validatedArgs.include_built_in) {
            types = types.filter(t => t.is_custom);
        }
        // @ai-logic: Format as markdown table
        let output = '## Available Types\n\n';
        output += '| Type | Base Type | Custom |\n';
        output += '|------|-----------|--------|\n';
        for (const type of types) {
            const isCustom = type.is_custom ? 'Yes' : 'No';
            output += `| ${type.type} | ${type.base_type} | ${isCustom} |\n`;
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