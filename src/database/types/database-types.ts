/**
 * @ai-context Database-specific type definitions
 * @ai-pattern Central location for all database-related types
 * @ai-critical Eliminates any types in database layer
 */

import { sqlite3 } from 'sqlite3';

/**
 * @ai-intent SQLite row result type
 * @ai-pattern Represents a row from database query
 */
export type DatabaseRow = Record<string, string | number | boolean | null | Buffer>;

/**
 * @ai-intent SQLite run result
 * @ai-pattern Result from INSERT/UPDATE/DELETE operations
 */
export interface DatabaseRunResult {
  lastID?: number;
  changes?: number;
}

/**
 * @ai-intent Query parameter types
 * @ai-pattern Valid types for SQL query parameters
 */
export type QueryParameter = string | number | boolean | null | Buffer | undefined;

/**
 * @ai-intent Query parameter array
 * @ai-pattern Array of parameters for prepared statements
 */
export type QueryParameters = QueryParameter[];

/**
 * @ai-intent Transaction function type
 * @ai-pattern Function that runs within a database transaction
 */
export type TransactionFunction<T> = () => Promise<T>;

/**
 * @ai-intent Entity mapping function
 * @ai-pattern Converts database rows to domain entities
 */
export type EntityMapper<T> = (row: DatabaseRow) => T;

/**
 * @ai-intent Row mapping function
 * @ai-pattern Converts domain entities to database rows
 */
export type RowMapper<T> = (entity: Partial<T>) => DatabaseRow;

/**
 * @ai-intent Search result item
 * @ai-pattern Common structure for search results
 */
export interface SearchResultItem {
  id: number;
  type: string;
  title: string;
  content?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * @ai-intent Tag with usage count
 * @ai-pattern Tag entity with relationship count
 */
export interface TagWithCount {
  id: number;
  name: string;
  count: number;
}

/**
 * @ai-intent Status row from database
 * @ai-pattern Raw status data from database
 */
export interface StatusRow {
  id: number;
  name: string;
  is_closed: number | boolean;
}

/**
 * @ai-intent Sequence row from database
 * @ai-pattern Type sequence information
 */
export interface SequenceRow {
  type: string;
  base_type: 'tasks' | 'documents';
  current_id: number;
}

/**
 * @ai-intent Task tag relationship row
 * @ai-pattern Junction table row for task-tag relationships
 */
export interface TaskTagRow {
  task_type: string;
  task_id: number;
  tag_id: number;
}

/**
 * @ai-intent Repository method signatures
 * @ai-pattern Common CRUD operation signatures
 */
export interface RepositoryMethods<T, CreateInput, UpdateInput> {
  getAll(): Promise<T[]>;
  getById(id: number | string): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: number | string, data: UpdateInput): Promise<T | null>;
  delete(id: number | string): Promise<boolean>;
  exists(id: number | string): Promise<boolean>;
}

/**
 * @ai-intent Search repository methods
 * @ai-pattern Common search operation signatures
 */
export interface SearchMethods<T> {
  search(query: string): Promise<T[]>;
  searchByTag(tag: string): Promise<T[]>;
  searchByType(type: string, query: string): Promise<T[]>;
}