/**
 * @ai-context File system utility functions
 * @ai-pattern Common file operations
 * @ai-critical Handles file system errors gracefully
 * @ai-why Centralizes file operations
 */
/**
 * @ai-intent Ensure directory exists
 * @ai-flow Create directory recursively if needed
 * @ai-pattern Idempotent directory creation
 */
export declare function ensureDirectoryExists(dirPath: string): Promise<void>;
/**
 * @ai-intent Check if path exists
 * @ai-pattern Safe existence check
 */
export declare function pathExists(filePath: string): Promise<boolean>;
/**
 * @ai-intent Read file safely
 * @ai-pattern Returns null on not found
 */
export declare function readFileSafe(filePath: string): Promise<string | null>;
/**
 * @ai-intent Write file with directory creation
 * @ai-pattern Ensures parent directory exists
 */
export declare function writeFileSafe(filePath: string, content: string): Promise<void>;
/**
 * @ai-intent Delete file safely
 * @ai-pattern Ignores if not exists
 */
export declare function deleteFileSafe(filePath: string): Promise<boolean>;
