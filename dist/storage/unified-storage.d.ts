/**
 * @ai-context Unified storage layer for all markdown-based entities
 * @ai-pattern Strategy pattern for different storage configurations
 * @ai-critical Central file I/O handling with consistent error handling
 * @ai-why Eliminates duplicate file handling logic across repositories
 */
export interface StorageConfig {
    baseDir: string;
    filePrefix: string;
    useDateSubdir: boolean;
    dateExtractor?: (id: string) => string;
}
export interface StorageItem {
    id: string;
    metadata: Record<string, unknown>;
    content: string;
}
/**
 * @ai-context Unified storage for markdown files
 * @ai-pattern Facade pattern hiding file system complexity
 * @ai-critical All file I/O goes through this layer
 */
export declare class UnifiedStorage {
    private dataDir;
    private logger;
    constructor(dataDir: string);
    /**
     * @ai-intent Build file path based on storage configuration
     * @ai-flow 1. Extract date if needed -> 2. Build directory path -> 3. Append filename
     */
    private getFilePath;
    /**
     * @ai-intent Ensure directory exists before writing
     * @ai-side-effects Creates directories if they don't exist
     */
    private ensureDirectory;
    /**
     * @ai-intent Save item to markdown file
     * @ai-flow 1. Generate markdown -> 2. Ensure directory -> 3. Write file
     * @ai-side-effects Creates directories and writes file
     */
    save(config: StorageConfig, item: StorageItem): Promise<void>;
    /**
     * @ai-intent Load item from markdown file
     * @ai-flow 1. Build path -> 2. Read file -> 3. Parse markdown
     * @ai-return null if file doesn't exist
     */
    load(config: StorageConfig, id: string): Promise<StorageItem | null>;
    /**
     * @ai-intent Delete item file
     * @ai-side-effects Removes file from filesystem
     */
    delete(config: StorageConfig, id: string): Promise<boolean>;
    /**
     * @ai-intent Check if item exists
     */
    exists(config: StorageConfig, id: string): Promise<boolean>;
    /**
     * @ai-intent List all items in a directory
     * @ai-flow 1. Read directory -> 2. Filter by prefix -> 3. Extract IDs
     */
    list(config: StorageConfig, dateDir?: string): Promise<string[]>;
    /**
     * @ai-intent List all date directories
     * @ai-return Array of date directory names (YYYY-MM-DD format)
     */
    listDateDirs(config: StorageConfig): Promise<string[]>;
    /**
     * @ai-intent Search for items containing text
     * @ai-flow 1. List all items -> 2. Load each -> 3. Check content
     * @ai-performance O(n) where n is total item count
     */
    search(config: StorageConfig, predicate: (item: StorageItem) => boolean): Promise<StorageItem[]>;
    /**
     * @ai-intent Move item to new location (for migrations)
     * @ai-flow 1. Load from old location -> 2. Save to new location -> 3. Delete old
     */
    move(oldConfig: StorageConfig, newConfig: StorageConfig, id: string): Promise<boolean>;
}
export declare const STORAGE_CONFIGS: {
    readonly issues: {
        readonly baseDir: "issues";
        readonly filePrefix: "issues-";
        readonly useDateSubdir: false;
    };
    readonly plans: {
        readonly baseDir: "plans";
        readonly filePrefix: "plans-";
        readonly useDateSubdir: false;
    };
    readonly docs: {
        readonly baseDir: "docs";
        readonly filePrefix: "docs-";
        readonly useDateSubdir: false;
    };
    readonly knowledge: {
        readonly baseDir: "knowledge";
        readonly filePrefix: "knowledge-";
        readonly useDateSubdir: false;
    };
    readonly sessions: {
        readonly baseDir: "sessions";
        readonly filePrefix: "sessions-";
        readonly useDateSubdir: true;
        readonly dateExtractor: (id: string) => string;
    };
    readonly dailies: {
        readonly baseDir: "sessions/dailies";
        readonly filePrefix: "dailies-";
        readonly useDateSubdir: false;
    };
};
