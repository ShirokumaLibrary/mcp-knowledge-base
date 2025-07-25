/**
 * @ai-context Repository for managing dynamic content types
 * @ai-pattern Repository pattern for type definitions using sequences table
 * @ai-critical Manages type registration in database
 */
import { FileIssueDatabase } from './index.js';
export declare class TypeRepository {
    private fileDb;
    private db;
    private dataDirectory;
    private builtInTypes;
    constructor(fileDb: FileIssueDatabase);
    /**
     * @ai-intent Initialize types - no-op now as we use database
     */
    init(): Promise<void>;
    /**
     * @ai-intent Check if a type exists in sequences table
     */
    typeExists(name: string): Promise<boolean>;
    /**
     * @ai-intent Get all types from sequences table
     */
    getAllTypes(): Promise<Array<{
        type: string;
        base_type: string;
        is_custom: boolean;
    }>>;
    /**
     * @ai-intent Create a new custom type by adding to sequences table
     * @ai-validation Ensure type name is unique and only documents base type allowed
     */
    createType(name: string): Promise<void>;
    /**
     * @ai-intent Delete a custom type
     * @ai-validation Ensure type exists and has no items
     */
    deleteType(name: string): Promise<void>;
    /**
     * @ai-intent Check if a type has any documents
     */
    hasDocumentsOfType(typeName: string): Promise<boolean>;
    /**
     * @ai-intent Ensure directory exists, create if not
     */
    private ensureDirectoryExists;
}
