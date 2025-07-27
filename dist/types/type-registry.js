/**
 * @ai-context Central type registry for all entity types in the system
 * @ai-pattern Registry pattern for dynamic type management
 * @ai-critical Single source of truth for type definitions
 * @ai-why Eliminates hardcoding of type strings throughout codebase
 */
/**
 * @ai-context Field configurations by base type
 * @ai-pattern Define fields for categories, not specific types
 * @ai-future Add new base types here when expanding the system
 */
const BASE_TYPE_FIELDS = {
    'tasks': new Set(['title', 'content', 'description', 'priority', 'status', 'tags', 'start_date', 'end_date', 'related_tasks']),
    'documents': new Set(['title', 'content', 'description', 'tags'])
};
const BASE_TYPE_CONFIGS = [
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
export class StaticTypeRegistry {
    types;
    constructor() {
        this.types = new Map();
        // @ai-critical: No hardcoded types - must be loaded from database
    }
    getAllTypes() {
        return Array.from(this.types.values());
    }
    getType(typeName) {
        return this.types.get(typeName) || null;
    }
    getTypesByBase(baseType) {
        return Array.from(this.types.values()).filter(t => t.baseType === baseType);
    }
    isValidType(typeName) {
        return this.types.has(typeName);
    }
    getFilePrefix(typeName) {
        const type = this.types.get(typeName);
        return type ? type.pluralForm : typeName;
    }
    getDirectoryName(typeName) {
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
    getAllBaseTypes() {
        return BASE_TYPE_CONFIGS.map(c => c.name);
    }
}
/**
 * @ai-context Dynamic type registry that reads from database
 * @ai-pattern Loads type definitions from sequences table
 * @ai-future Supports custom user-defined types
 */
export class DynamicTypeRegistry {
    db;
    types = new Map();
    loaded = false;
    constructor(db) {
        this.db = db;
    }
    async load() {
        if (this.loaded) {
            return;
        }
        // Load all types from database
        const rows = await this.db.allAsync('SELECT type, base_type FROM sequences');
        for (const row of rows) {
            // Get fields based on base type
            const baseType = String(row.base_type);
            const typeName = String(row.type);
            const fields = BASE_TYPE_FIELDS[baseType] || new Set(['title', 'content', 'tags', 'description']);
            this.types.set(typeName, {
                type: String(row.type),
                baseType: String(row.base_type),
                pluralForm: String(row.type), // Use type name as-is (already plural in DB)
                supportedFields: fields
            });
        }
        this.loaded = true;
    }
    getAllTypes() {
        return Array.from(this.types.values());
    }
    getType(typeName) {
        return this.types.get(typeName) || null;
    }
    getTypesByBase(baseType) {
        return Array.from(this.types.values()).filter(t => t.baseType === baseType);
    }
    isValidType(typeName) {
        return this.types.has(typeName);
    }
    getFilePrefix(typeName) {
        const type = this.types.get(typeName);
        return type ? type.pluralForm : typeName;
    }
    getDirectoryName(typeName) {
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
    getAllBaseTypes() {
        return BASE_TYPE_CONFIGS.map(c => c.name);
    }
}
// Export singleton instance for static usage
export const typeRegistry = new StaticTypeRegistry();
/**
 * @ai-context Helper to get all types for a base type
 * @ai-pattern Dynamic type discovery based on registry
 */
export function getTypesForBase(baseType) {
    return typeRegistry.getTypesByBase(baseType).map(t => t.type);
}
/**
 * @ai-context Helper to validate if a type belongs to a base type
 * @ai-pattern Type safety for dynamic type checking
 */
export function isTypeOfBase(typeName, baseType) {
    const type = typeRegistry.getType(typeName);
    return type ? type.baseType === baseType : false;
}
//# sourceMappingURL=type-registry.js.map