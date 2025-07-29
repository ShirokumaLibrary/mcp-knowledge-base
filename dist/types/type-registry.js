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
];
export class StaticTypeRegistry {
    types;
    constructor() {
        this.types = new Map();
        this.initializeDefaultTypes();
    }
    initializeDefaultTypes() {
        this.types.set('issues', {
            type: 'issues',
            baseType: 'tasks',
            pluralForm: 'issues',
            supportedFields: BASE_TYPE_FIELDS['tasks']
        });
        this.types.set('plans', {
            type: 'plans',
            baseType: 'tasks',
            pluralForm: 'plans',
            supportedFields: BASE_TYPE_FIELDS['tasks']
        });
        this.types.set('docs', {
            type: 'docs',
            baseType: 'documents',
            pluralForm: 'docs',
            supportedFields: BASE_TYPE_FIELDS['documents']
        });
        this.types.set('knowledge', {
            type: 'knowledge',
            baseType: 'documents',
            pluralForm: 'knowledge',
            supportedFields: BASE_TYPE_FIELDS['documents']
        });
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
        if (type.directoryName) {
            return type.directoryName;
        }
        const baseConfig = BASE_TYPE_CONFIGS.find(c => c.name === type.baseType);
        return baseConfig ? baseConfig.defaultDirectory : type.baseType;
    }
    getAllBaseTypes() {
        return BASE_TYPE_CONFIGS.map(c => c.name);
    }
}
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
        const rows = await this.db.allAsync('SELECT type, base_type FROM sequences');
        for (const row of rows) {
            const baseType = String(row.base_type);
            const typeName = String(row.type);
            const fields = BASE_TYPE_FIELDS[baseType] || new Set(['title', 'content', 'tags', 'description']);
            this.types.set(typeName, {
                type: String(row.type),
                baseType: String(row.base_type),
                pluralForm: String(row.type),
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
        if (type.directoryName) {
            return type.directoryName;
        }
        const baseConfig = BASE_TYPE_CONFIGS.find(c => c.name === type.baseType);
        return baseConfig ? baseConfig.defaultDirectory : type.baseType;
    }
    getAllBaseTypes() {
        return BASE_TYPE_CONFIGS.map(c => c.name);
    }
}
export const typeRegistry = new StaticTypeRegistry();
export function getTypesForBase(baseType) {
    return typeRegistry.getTypesByBase(baseType).map(t => t.type);
}
export function isTypeOfBase(typeName, baseType) {
    const type = typeRegistry.getType(typeName);
    return type ? type.baseType === baseType : false;
}
export function isTaskType(typeName) {
    return isTypeOfBase(typeName, 'tasks');
}
export function isDocumentType(typeName) {
    return isTypeOfBase(typeName, 'documents');
}
