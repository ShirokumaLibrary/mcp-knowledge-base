/**
 * @ai-context MCP handlers for type management operations
 * @ai-pattern Handler pattern for dynamic type system
 */
import type { FileIssueDatabase } from '../database.js';
import type { ToolResponse } from '../types/mcp-types.js';
export declare class TypeHandlers {
    private db;
    private typeRepo;
    private logger;
    readonly handlerName = "TypeHandlers";
    constructor(db: FileIssueDatabase);
    /**
     * @ai-intent Initialize type repository
     */
    init(): Promise<void>;
    /**
     * @ai-intent Create a new additional type
     * @ai-validation Validates type definition and checks for conflicts
     */
    handleCreateType(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Get all available types
     * @ai-return List of types grouped by base_type with descriptions
     */
    handleGetTypes(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Get supported fields for a base type
     */
    private getFieldsForBaseType;
    /**
     * @ai-intent Update type description
     * @ai-validation Only description can be updated
     * @ai-critical Type name changes are prohibited
     */
    handleUpdateType(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Delete an additional type
     * @ai-validation Checks for existing documents before deletion
     */
    handleDeleteType(args: unknown): Promise<ToolResponse>;
}
