/**
 * @ai-context Repository for managing dynamic content types
 * @ai-pattern Repository pattern for type definitions using sequences table
 * @ai-critical Manages type registration in database
 */
import { promises as fs } from 'fs';
import path from 'path';
export class TypeRepository {
    fileDb;
    db;
    dataDirectory;
    constructor(fileDb) {
        this.fileDb = fileDb;
        // @ai-critical: Don't call getDatabase() in constructor as DB might not be initialized
        this.dataDirectory = fileDb.dataDirectory;
    }
    /**
     * @ai-intent Initialize types - no-op now as we use database
     */
    async init() {
        // @ai-critical: Get database connection after initialization
        this.db = this.fileDb.getDatabase();
    }
    /**
     * @ai-intent Check if a type exists in sequences table
     */
    async typeExists(name) {
        const row = await this.db.getAsync(`SELECT type FROM sequences WHERE type = ?`, [name]);
        return !!row;
    }
    /**
     * @ai-intent Get all types from sequences table
     */
    async getAllTypes() {
        const rows = await this.db.allAsync(`SELECT type, base_type FROM sequences ORDER BY type`);
        return rows;
    }
    /**
     * @ai-intent Create a new custom type by adding to sequences table
     * @ai-validation Ensure type name is unique and base type is valid
     */
    async createType(name, baseType = 'documents') {
        // @ai-validation: Check if type already exists
        const existingType = await this.typeExists(name);
        if (existingType) {
            throw new Error(`Type "${name}" already exists`);
        }
        // @ai-validation: Validate type name (alphanumeric and underscore only)
        if (!/^[a-z][a-z0-9_]*$/.test(name)) {
            throw new Error('Type name must start with a letter and contain only lowercase letters, numbers, and underscores');
        }
        // @ai-validation: Validate base type
        const validBaseTypes = ['tasks', 'documents'];
        if (!validBaseTypes.includes(baseType)) {
            throw new Error(`Invalid base type "${baseType}". Must be one of: ${validBaseTypes.join(', ')}`);
        }
        // @ai-logic: Create type with specified base type
        await this.db.runAsync(`INSERT INTO sequences (type, current_value, base_type) VALUES (?, 0, ?)`, [name, baseType]);
        // Create directory for the new type
        const typeDir = path.join(this.dataDirectory, baseType, name);
        await this.ensureDirectoryExists(typeDir);
    }
    /**
     * @ai-intent Delete a custom type
     * @ai-validation Ensure type exists and has no items
     */
    async deleteType(name) {
        // @ai-validation: Check if type exists
        const exists = await this.typeExists(name);
        if (!exists) {
            throw new Error(`Type "${name}" does not exist`);
        }
        // @ai-validation: Check if type has any documents
        const hasDocuments = await this.hasDocumentsOfType(name);
        if (hasDocuments) {
            throw new Error(`Cannot delete type "${name}" because it has existing documents`);
        }
        // Delete from sequences table
        await this.db.runAsync(`DELETE FROM sequences WHERE type = ?`, [name]);
        // Remove directory if it exists
        const typeDir = path.join(this.dataDirectory, 'documents', name);
        try {
            await fs.rmdir(typeDir);
        }
        catch {
            // Ignore if directory doesn't exist
        }
    }
    /**
     * @ai-intent Check if a type has any documents
     */
    async hasDocumentsOfType(typeName) {
        const typeDir = path.join(this.dataDirectory, 'documents', typeName);
        try {
            const files = await fs.readdir(typeDir);
            // Check for any markdown files
            return files.some(file => file.endsWith('.md'));
        }
        catch (error) {
            // Directory doesn't exist, which is fine
            return false;
        }
    }
    /**
     * @ai-intent Ensure directory exists, create if not
     */
    async ensureDirectoryExists(dir) {
        try {
            await fs.access(dir);
        }
        catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }
}
//# sourceMappingURL=type-repository.js.map