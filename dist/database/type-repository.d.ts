/**
 * @ai-context Repository for managing dynamic content types
 * @ai-pattern Repository pattern for type definitions using sequences table
 * @ai-critical Manages type registration in database
 */
import type { FileIssueDatabase } from './index.js';
export declare class TypeRepository {
    private fileDb;
    private db;
    private dataDirectory;
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
        description?: string;
    }>>;
    /**
     * @ai-intent Get types grouped by base type
     */
    getTypes(): Promise<{
        tasks: Array<any>;
        documents: Array<any>;
    }>;
    /**
     * @ai-intent Get base type for a specific type
     */
    getBaseType(name: string): Promise<string | null>;
    /**
     * @ai-intent Create a new additional type by adding to sequences table
     * @ai-validation Ensure type name is unique and base type is valid
     * @ai-critical Description helps users understand type purpose and usage
     */
    createType(name: string, baseType?: string, description?: string): Promise<void>;
    /**
     * @ai-intent Update type description
     * @ai-validation Only description can be updated, not name or base_type
     * @ai-critical Type name changes are prohibited to maintain data integrity
     */
    updateType(name: string, description: string): Promise<void>;
    /**
     * @ai-intent Delete an additional type
     * @ai-validation Ensure type exists and has no items
     */
    deleteType(name: string): Promise<void>;
    /**
     * @ai-intent Check if a type has any documents
     * @ai-filesystem Items stored in {dataDir}/{typeName}/ (not nested by base_type)
     * @ai-critical Must check correct directory structure for unified storage
     */
    hasDocumentsOfType(typeName: string): Promise<boolean>;
    /**
     * @ai-intent Ensure directory exists, create if not
     */
    private ensureDirectoryExists;
    /**
     * @ai-intent Add field definitions for a new type based on its base type
     */
    private addFieldDefinitionsForType;
    /**
     * @ai-intent Get field definitions for a type
     */
    getFieldsForType(typeName: string): Promise<Array<{
        field_name: string;
        field_type: string;
        required: boolean;
        default_value: string;
        description: string;
    }>>;
}
