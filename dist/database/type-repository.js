import { promises as fs } from 'fs';
import path from 'path';
export class TypeRepository {
    fileDb;
    db;
    dataDirectory;
    constructor(fileDb) {
        this.fileDb = fileDb;
        this.dataDirectory = fileDb.dataDirectory;
    }
    async init() {
        this.db = this.fileDb.getDatabase();
    }
    async typeExists(name) {
        const row = await this.db.getAsync('SELECT type FROM sequences WHERE type = ?', [name]);
        return !!row;
    }
    async getAllTypes() {
        const rows = await this.db.allAsync('SELECT type, base_type, description FROM sequences WHERE type NOT IN (?, ?) ORDER BY type', ['sessions', 'dailies']);
        return rows.map(row => ({
            type: row.type,
            base_type: row.base_type,
            description: row.description || undefined
        }));
    }
    async getTypes() {
        const allTypes = await this.getAllTypes();
        const result = {
            tasks: allTypes.filter(t => t.base_type === 'tasks'),
            documents: allTypes.filter(t => t.base_type === 'documents')
        };
        return result;
    }
    async getBaseType(name) {
        const row = await this.db.getAsync('SELECT base_type FROM sequences WHERE type = ?', [name]);
        return row ? row.base_type : null;
    }
    async createType(name, baseType = 'documents', description) {
        const reservedTypes = ['sessions', 'dailies'];
        if (reservedTypes.includes(name)) {
            throw new Error(`Type "${name}" already exists`);
        }
        const existingType = await this.typeExists(name);
        if (existingType) {
            throw new Error(`Type "${name}" already exists`);
        }
        if (name.length === 0) {
            throw new Error('Type name must contain at least 1 character');
        }
        if (name.length > 50) {
            throw new Error('Type name must be 50 characters or less');
        }
        if (!/^[a-z][a-z0-9_]*$/.test(name)) {
            throw new Error('Type name must start with a letter and contain only lowercase letters, numbers, and underscores');
        }
        const validBaseTypes = ['tasks', 'documents'];
        if (!validBaseTypes.includes(baseType)) {
            throw new Error(`Invalid base type "${baseType}". Must be one of: ${validBaseTypes.join(', ')}`);
        }
        await this.db.runAsync('INSERT INTO sequences (type, current_value, base_type, description) VALUES (?, 0, ?, ?)', [name, baseType, description || null]);
        const typeDir = path.join(this.dataDirectory, name);
        await this.ensureDirectoryExists(typeDir);
        await this.addFieldDefinitionsForType(name, baseType);
    }
    async updateType(name, description) {
        const exists = await this.typeExists(name);
        if (!exists) {
            throw new Error(`Type "${name}" does not exist`);
        }
        await this.db.runAsync('UPDATE sequences SET description = ? WHERE type = ?', [description, name]);
    }
    async deleteType(name) {
        const exists = await this.typeExists(name);
        if (!exists) {
            throw new Error(`Type "${name}" does not exist`);
        }
        const hasDocuments = await this.hasDocumentsOfType(name);
        if (hasDocuments) {
            throw new Error(`Cannot delete type "${name}" because it has existing documents`);
        }
        await this.db.runAsync('DELETE FROM sequences WHERE type = ?', [name]);
        const typeDir = path.join(this.dataDirectory, name);
        try {
            await fs.rmdir(typeDir);
        }
        catch {
        }
    }
    async hasDocumentsOfType(typeName) {
        const typeDir = path.join(this.dataDirectory, typeName);
        try {
            const files = await fs.readdir(typeDir);
            return files.some(file => file.endsWith('.md'));
        }
        catch {
            return false;
        }
    }
    async ensureDirectoryExists(dir) {
        try {
            await fs.access(dir);
        }
        catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    async addFieldDefinitionsForType(typeName, baseType) {
        const commonFields = [
            { name: 'id', type: 'string', required: true, default: '', desc: 'Unique identifier' },
            { name: 'title', type: 'string', required: true, default: '', desc: 'Title of the item' },
            { name: 'description', type: 'string', required: false, default: '', desc: 'Brief description' },
            { name: 'version', type: 'string', required: false, default: '', desc: 'Version information' },
            { name: 'tags', type: 'tags', required: false, default: '[]', desc: 'Tags for categorization' },
            { name: 'created_at', type: 'date', required: true, default: '', desc: 'Creation timestamp' },
            { name: 'updated_at', type: 'date', required: true, default: '', desc: 'Last update timestamp' }
        ];
        const baseTypeFields = baseType === 'tasks' ? [
            { name: 'content', type: 'text', required: true, default: '', desc: 'Main content' },
            { name: 'priority', type: 'priority', required: false, default: 'medium', desc: 'Priority level' },
            { name: 'status', type: 'status', required: false, default: 'Open', desc: 'Current status' },
            { name: 'start_date', type: 'date', required: false, default: '', desc: 'Start date' },
            { name: 'end_date', type: 'date', required: false, default: '', desc: 'End date' },
            { name: 'related_tasks', type: 'related', required: false, default: '[]', desc: 'Related tasks' },
            { name: 'related_documents', type: 'related', required: false, default: '[]', desc: 'Related documents' }
        ] : [
            { name: 'content', type: 'text', required: true, default: '', desc: 'Document content' },
            { name: 'priority', type: 'priority', required: false, default: 'medium', desc: 'Document importance' },
            { name: 'status', type: 'status', required: false, default: 'Open', desc: 'Document status' },
            { name: 'related_documents', type: 'related', required: false, default: '[]', desc: 'Related documents' }
        ];
        const allFields = [...commonFields, ...baseTypeFields];
        for (const field of allFields) {
            await this.db.runAsync(`
        INSERT OR IGNORE INTO type_fields (type, field_name, field_type, required, default_value, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [typeName, field.name, field.type, field.required ? 1 : 0, field.default, field.desc]);
        }
    }
    async getFieldsForType(typeName) {
        const fields = await this.db.allAsync('SELECT field_name, field_type, required, default_value, description FROM type_fields WHERE type = ? ORDER BY field_name', [typeName]);
        return fields.map(f => ({
            ...f,
            required: f.required === 1
        }));
    }
}
