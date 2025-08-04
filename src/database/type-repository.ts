/**
 * @ai-context Repository for managing dynamic content types
 * @ai-pattern Repository pattern for type definitions using sequences table
 * @ai-critical Manages type registration in database
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Database } from './base.js';
import type { FileIssueDatabase } from './index.js';

export class TypeRepository {
  private db!: Database;
  private dataDirectory: string;

  constructor(private fileDb: FileIssueDatabase) {
    // @ai-critical: Don't call getDatabase() in constructor as DB might not be initialized
    this.dataDirectory = fileDb.dataDirectory;
  }

  /**
   * @ai-intent Initialize types - no-op now as we use database
   */
  async init(): Promise<void> {
    // @ai-critical: Get database connection after initialization
    this.db = this.fileDb.getDatabase();
  }

  /**
   * @ai-intent Check if a type exists in sequences table
   */
  async typeExists(name: string): Promise<boolean> {
    const row = await this.db.getAsync(
      'SELECT type FROM sequences WHERE type = ?',
      [name]
    ) as { type: string } | undefined;
    return !!row;
  }

  /**
   * @ai-intent Get all types from sequences table
   */
  async getAllTypes(): Promise<Array<{ type: string; base_type: string; description?: string }>> {
    const rows = await this.db.allAsync(
      'SELECT type, base_type, description FROM sequences WHERE type NOT IN (?, ?) ORDER BY type',
      ['sessions', 'dailies']
    ) as Array<{ type: string; base_type: string; description: string | null }>;

    return rows.map(row => ({
      type: row.type,
      base_type: row.base_type,
      description: row.description || undefined
    }));
  }

  /**
   * @ai-intent Get types grouped by base type
   */
  async getTypes(): Promise<{ tasks: Array<any>, documents: Array<any> }> {
    const allTypes = await this.getAllTypes();
    const result = {
      tasks: allTypes.filter(t => t.base_type === 'tasks'),
      documents: allTypes.filter(t => t.base_type === 'documents')
    };
    return result;
  }

  /**
   * @ai-intent Get base type for a specific type
   */
  async getBaseType(name: string): Promise<string | null> {
    const row = await this.db.getAsync(
      'SELECT base_type FROM sequences WHERE type = ?',
      [name]
    ) as { base_type: string } | undefined;

    return row ? row.base_type : null;
  }

  /**
   * @ai-intent Create a new additional type by adding to sequences table
   * @ai-validation Ensure type name is unique and base type is valid
   * @ai-critical Description helps users understand type purpose and usage
   */
  async createType(name: string, baseType: string = 'documents', description?: string): Promise<void> {
    // @ai-validation: Check if type already exists
    // @ai-validation: Prevent creating reserved types
    const reservedTypes = ['sessions', 'dailies'];
    if (reservedTypes.includes(name)) {
      throw new Error(`Type "${name}" already exists`);
    }

    const existingType = await this.typeExists(name);
    if (existingType) {
      throw new Error(`Type "${name}" already exists`);
    }

    // @ai-validation: Validate type name length
    if (name.length === 0) {
      throw new Error('Type name must contain at least 1 character');
    }
    if (name.length > 50) {
      throw new Error('Type name must be 50 characters or less');
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

    // @ai-logic: Create type with specified base type and description
    await this.db.runAsync(
      'INSERT INTO sequences (type, current_value, base_type, description) VALUES (?, 0, ?, ?)',
      [name, baseType, description || null]
    );

    // Create directory for the new type (only at root level, not nested by base type)
    const typeDir = path.join(this.dataDirectory, name);
    await this.ensureDirectoryExists(typeDir);

    // Add field definitions for the new type
    await this.addFieldDefinitionsForType(name, baseType);
  }

  /**
   * @ai-intent Update type description
   * @ai-validation Only description can be updated, not name or base_type
   * @ai-critical Type name changes are prohibited to maintain data integrity
   */
  async updateType(name: string, description: string): Promise<void> {
    // @ai-validation: Check if type exists
    const exists = await this.typeExists(name);
    if (!exists) {
      throw new Error(`Type "${name}" does not exist`);
    }

    // Update description in sequences table
    await this.db.runAsync(
      'UPDATE sequences SET description = ? WHERE type = ?',
      [description, name]
    );
  }

  /**
   * @ai-intent Delete an additional type
   * @ai-validation Ensure type exists and has no items
   */
  async deleteType(name: string): Promise<void> {
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
    await this.db.runAsync(
      'DELETE FROM sequences WHERE type = ?',
      [name]
    );

    // Remove directory if it exists
    // @ai-note: Items stored directly by type, not nested under base_type
    const typeDir = path.join(this.dataDirectory, name);
    try {
      await fs.rmdir(typeDir);
    } catch {
      // Ignore if directory doesn't exist or not empty
    }
  }

  /**
   * @ai-intent Check if a type has any documents
   * @ai-filesystem Items stored in {dataDir}/{typeName}/ (not nested by base_type)
   * @ai-critical Must check correct directory structure for unified storage
   */
  async hasDocumentsOfType(typeName: string): Promise<boolean> {
    // @ai-note: In unified structure, items are stored directly by type
    // Path is .shirokuma/data/{typeName}/, NOT .shirokuma/data/{baseType}/{typeName}/
    const typeDir = path.join(this.dataDirectory, typeName);

    try {
      const files = await fs.readdir(typeDir);
      // Check for any markdown files
      return files.some(file => file.endsWith('.md'));
    } catch {
      // Directory doesn't exist, which is fine
      return false;
    }
  }

  /**
   * @ai-intent Ensure directory exists, create if not
   */
  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * @ai-intent Add field definitions for a new type based on its base type
   */
  private async addFieldDefinitionsForType(typeName: string, baseType: string): Promise<void> {
    // Common fields for all types
    const commonFields = [
      { name: 'id', type: 'string', required: true, default: '', desc: 'Unique identifier' },
      { name: 'title', type: 'string', required: true, default: '', desc: 'Title of the item' },
      { name: 'description', type: 'string', required: false, default: '', desc: 'Brief description' },
      { name: 'version', type: 'string', required: false, default: '', desc: 'Version information' },
      { name: 'tags', type: 'tags', required: false, default: '[]', desc: 'Tags for categorization' },
      { name: 'created_at', type: 'date', required: true, default: '', desc: 'Creation timestamp' },
      { name: 'updated_at', type: 'date', required: true, default: '', desc: 'Last update timestamp' }
    ];

    // Base type specific fields
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

    // Insert all fields
    const allFields = [...commonFields, ...baseTypeFields];
    for (const field of allFields) {
      await this.db.runAsync(`
        INSERT OR IGNORE INTO type_fields (type, field_name, field_type, required, default_value, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [typeName, field.name, field.type, field.required ? 1 : 0, field.default, field.desc]);
    }
  }

  /**
   * @ai-intent Get field definitions for a type
   */
  async getFieldsForType(typeName: string): Promise<Array<{
    field_name: string;
    field_type: string;
    required: boolean;
    default_value: string;
    description: string;
  }>> {
    const fields = await this.db.allAsync(
      'SELECT field_name, field_type, required, default_value, description FROM type_fields WHERE type = ? ORDER BY field_name',
      [typeName]
    ) as Array<{
      field_name: string;
      field_type: string;
      required: number;
      default_value: string;
      description: string;
    }>;

    return fields.map(f => ({
      ...f,
      required: f.required === 1
    }));
  }
}