/**
 * @ai-context Central type registry for all entity types in the system
 * @ai-pattern Registry pattern for dynamic type management
 * @ai-critical Single source of truth for type definitions
 * @ai-why Eliminates hardcoding of type strings throughout codebase
 */

import type { Database } from '../database/base.js';

export interface TypeDefinition {
  type: string;           // Unique type identifier (e.g., 'issues', 'plans')
  baseType: string;       // Base category (e.g., 'tasks', 'documents')
  pluralForm: string;     // File naming pattern (e.g., 'issues', 'docs')
  supportedFields: Set<string>; // Fields supported by this type
  directoryName?: string; // Optional custom directory name (defaults to baseType)
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
 * @ai-context Field configurations by base type
 * @ai-pattern Define fields for categories, not specific types
 * @ai-future Add new base types here when expanding the system
 */
const BASE_TYPE_FIELDS: Record<string, Set<string>> = {
  'tasks': new Set(['title', 'content', 'description', 'priority', 'status', 'tags', 'start_date', 'end_date', 'related_tasks']),
  'documents': new Set(['title', 'content', 'description', 'tags'])
};

/**
 * @ai-context Registry for base type configurations
 * @ai-pattern Defines behavior for entire categories of types
 * @ai-future Add new base types here when expanding the system
 */
export interface BaseTypeConfig {
  name: string;                // Base type name (e.g., 'tasks', 'documents')
  defaultDirectory: string;    // Default directory for this base type
  requiredFields: Set<string>; // Fields that all types in this category must have
  optionalFields: Set<string>; // Fields that types in this category may have
}

const BASE_TYPE_CONFIGS: BaseTypeConfig[] = [
  {
    name: 'tasks',
    defaultDirectory: 'tasks',
    requiredFields: new Set(['title', 'status', 'priority']),
    optionalFields: new Set(['content', 'description', 'tags', 'start_date', 'end_date', 'related_tasks'])
  },
  {
    name: 'documents',
    defaultDirectory: 'documents',
    requiredFields: new Set(['title', 'content']),
    optionalFields: new Set(['description', 'tags'])
  }
  // Future base types can be added here:
  // { name: 'notes', defaultDirectory: 'notes', ... }
  // { name: 'events', defaultDirectory: 'events', ... }
];

/**
 * @ai-context Static type registry (currently empty, all types from database)
 * @ai-pattern Singleton-like static registry
 * @ai-future Can be extended to preload types if needed
 */
export class StaticTypeRegistry implements TypeRegistry {
  private types: Map<string, TypeDefinition>;

  constructor() {
    this.types = new Map();
    // @ai-critical: No hardcoded types - must be loaded from database
  }

  getAllTypes(): TypeDefinition[] {
    return Array.from(this.types.values());
  }

  getType(typeName: string): TypeDefinition | null {
    return this.types.get(typeName) || null;
  }

  getTypesByBase(baseType: string): TypeDefinition[] {
    return Array.from(this.types.values()).filter(t => t.baseType === baseType);
  }

  isValidType(typeName: string): boolean {
    return this.types.has(typeName);
  }

  getFilePrefix(typeName: string): string {
    const type = this.types.get(typeName);
    return type ? type.pluralForm : typeName;
  }

  getDirectoryName(typeName: string): string {
    const type = this.types.get(typeName);
    if (!type) {
      return typeName;
    }

    // Use custom directory if specified
    if (type.directoryName) {
      return type.directoryName;
    }

    // Otherwise use base type's default directory
    const baseConfig = BASE_TYPE_CONFIGS.find(c => c.name === type.baseType);
    return baseConfig ? baseConfig.defaultDirectory : type.baseType;
  }

  getAllBaseTypes(): string[] {
    return BASE_TYPE_CONFIGS.map(c => c.name);
  }
}

/**
 * @ai-context Dynamic type registry that reads from database
 * @ai-pattern Loads type definitions from sequences table
 * @ai-future Supports custom user-defined types
 */
export class DynamicTypeRegistry implements TypeRegistry {
  private types: Map<string, TypeDefinition> = new Map();
  private loaded = false;

  constructor(private db: Database) {}

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    // Load all types from database
    const rows = await this.db.allAsync(
      'SELECT type, base_type FROM sequences'
    );

    for (const row of rows) {
      // Get fields based on base type
      const baseType = String(row.base_type);
      const typeName = String(row.type);
      const fields = BASE_TYPE_FIELDS[baseType as 'tasks' | 'documents'] || new Set(['title', 'content', 'tags', 'description']);

      this.types.set(typeName, {
        type: String(row.type),
        baseType: String(row.base_type),
        pluralForm: String(row.type), // Use type name as-is (already plural in DB)
        supportedFields: fields
      });
    }

    this.loaded = true;
  }

  getAllTypes(): TypeDefinition[] {
    return Array.from(this.types.values());
  }

  getType(typeName: string): TypeDefinition | null {
    return this.types.get(typeName) || null;
  }

  getTypesByBase(baseType: string): TypeDefinition[] {
    return Array.from(this.types.values()).filter(t => t.baseType === baseType);
  }

  isValidType(typeName: string): boolean {
    return this.types.has(typeName);
  }

  getFilePrefix(typeName: string): string {
    const type = this.types.get(typeName);
    return type ? type.pluralForm : typeName;
  }

  getDirectoryName(typeName: string): string {
    const type = this.types.get(typeName);
    if (!type) {
      return typeName;
    }

    // Use custom directory if specified
    if (type.directoryName) {
      return type.directoryName;
    }

    // Otherwise use base type's default directory
    const baseConfig = BASE_TYPE_CONFIGS.find(c => c.name === type.baseType);
    return baseConfig ? baseConfig.defaultDirectory : type.baseType;
  }

  getAllBaseTypes(): string[] {
    return BASE_TYPE_CONFIGS.map(c => c.name);
  }
}

// Export singleton instance for static usage
export const typeRegistry = new StaticTypeRegistry();

// Type definitions - no hardcoded values
export type TaskType = string;
export type DocumentType = string;
export type EntityType = string;


/**
 * @ai-context Helper to get all types for a base type
 * @ai-pattern Dynamic type discovery based on registry
 */
export function getTypesForBase(baseType: string): string[] {
  return typeRegistry.getTypesByBase(baseType).map(t => t.type);
}

/**
 * @ai-context Helper to validate if a type belongs to a base type
 * @ai-pattern Type safety for dynamic type checking
 */
export function isTypeOfBase(typeName: string, baseType: string): boolean {
  const type = typeRegistry.getType(typeName);
  return type ? type.baseType === baseType : false;
}