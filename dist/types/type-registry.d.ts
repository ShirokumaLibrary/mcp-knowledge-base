/**
 * @ai-context Central type registry for all entity types in the system
 * @ai-pattern Registry pattern for dynamic type management
 * @ai-critical Single source of truth for type definitions
 * @ai-why Eliminates hardcoding of type strings throughout codebase
 */
import { Database } from '../database/base.js';
export interface TypeDefinition {
    type: string;
    baseType: string;
    pluralForm: string;
    supportedFields: Set<string>;
    directoryName?: string;
}
export interface TypeRegistry {
    getAllTypes(): TypeDefinition[];
    getType(typeName: string): TypeDefinition | null;
    getTypesByBase(baseType: string): TypeDefinition[];
    isValidType(typeName: string): boolean;
    getFilePrefix(typeName: string): string;
    getDirectoryName(typeName: string): string;
    getAllBaseTypes(): string[];
}
/**
 * @ai-context Registry for base type configurations
 * @ai-pattern Defines behavior for entire categories of types
 * @ai-future Add new base types here when expanding the system
 */
export interface BaseTypeConfig {
    name: string;
    defaultDirectory: string;
    requiredFields: Set<string>;
    optionalFields: Set<string>;
}
/**
 * @ai-context Static type registry (currently empty, all types from database)
 * @ai-pattern Singleton-like static registry
 * @ai-future Can be extended to preload types if needed
 */
export declare class StaticTypeRegistry implements TypeRegistry {
    private types;
    constructor();
    getAllTypes(): TypeDefinition[];
    getType(typeName: string): TypeDefinition | null;
    getTypesByBase(baseType: string): TypeDefinition[];
    isValidType(typeName: string): boolean;
    getFilePrefix(typeName: string): string;
    getDirectoryName(typeName: string): string;
    getAllBaseTypes(): string[];
}
/**
 * @ai-context Dynamic type registry that reads from database
 * @ai-pattern Loads type definitions from sequences table
 * @ai-future Supports custom user-defined types
 */
export declare class DynamicTypeRegistry implements TypeRegistry {
    private db;
    private types;
    private loaded;
    constructor(db: Database);
    load(): Promise<void>;
    getAllTypes(): TypeDefinition[];
    getType(typeName: string): TypeDefinition | null;
    getTypesByBase(baseType: string): TypeDefinition[];
    isValidType(typeName: string): boolean;
    getFilePrefix(typeName: string): string;
    getDirectoryName(typeName: string): string;
    getAllBaseTypes(): string[];
}
export declare const typeRegistry: StaticTypeRegistry;
export type TaskType = string;
export type DocumentType = string;
export type EntityType = string;
/**
 * @ai-context Helper to get all types for a base type
 * @ai-pattern Dynamic type discovery based on registry
 */
export declare function getTypesForBase(baseType: string): string[];
/**
 * @ai-context Helper to validate if a type belongs to a base type
 * @ai-pattern Type safety for dynamic type checking
 */
export declare function isTypeOfBase(typeName: string, baseType: string): boolean;
