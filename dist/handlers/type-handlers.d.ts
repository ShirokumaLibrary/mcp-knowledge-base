/**
 * @ai-context MCP handlers for type management operations
 * @ai-pattern Handler pattern for dynamic type system
 */
import { FileIssueDatabase } from '../database.js';
import { ToolResponse } from '../types/mcp-types.js';
export declare class TypeHandlers {
    private db;
    private typeRepo;
    constructor(db: FileIssueDatabase);
    /**
     * @ai-intent Initialize type repository
     */
    init(): Promise<void>;
    /**
     * @ai-intent Create a new custom type
     * @ai-validation Validates type definition and checks for conflicts
     */
    handleCreateType(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Get all available types
     * @ai-return List of built-in and custom types
     */
    handleGetTypes(args: unknown): Promise<ToolResponse>;
    /**
     * @ai-intent Delete a custom type
     * @ai-validation Checks for existing documents before deletion
     */
    handleDeleteType(args: unknown): Promise<ToolResponse>;
}
