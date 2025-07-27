/**
 * @ai-context Test helper utilities
 * @ai-pattern Common test setup and assertions
 * @ai-critical Simplifies test writing and maintenance
 */
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
/**
 * @ai-intent Setup test environment
 * @ai-pattern Common test setup
 */
export declare function setupTestEnvironment(): Promise<{
    testDir: string;
    cleanup: () => Promise<void>;
}>;
/**
 * @ai-intent Create test database
 * @ai-pattern In-memory database for tests
 */
export declare function createTestDatabase(): any;
/**
 * @ai-intent Assert Zod validation error
 * @ai-pattern Verify schema validation failures
 */
export declare function expectZodError(fn: () => any, expectedPaths?: string[], expectedMessages?: string[]): void;
/**
 * @ai-intent Assert MCP error
 * @ai-pattern Verify MCP protocol errors
 */
export declare function expectMcpError(fn: () => any | Promise<any>, expectedCode: ErrorCode, expectedMessage?: string | RegExp): void;
/**
 * @ai-intent Create temporary file
 * @ai-pattern Test file operations
 */
export declare function createTempFile(content: string, extension?: string): Promise<{
    path: string;
    cleanup: () => Promise<void>;
}>;
/**
 * @ai-intent Wait for condition
 * @ai-pattern Async test utilities
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
/**
 * @ai-intent Mock date/time
 * @ai-pattern Control time in tests
 */
export declare class TimeMock {
    private originalDate;
    private currentTime;
    constructor(initialTime?: Date | string | number);
    install(): void;
    uninstall(): void;
    advance(ms: number): void;
    setTime(time: Date | string | number): void;
    private static instance;
    private static getInstance;
    private static setInstance;
    private static clearInstance;
}
/**
 * @ai-intent Capture console output
 * @ai-pattern Test console logging
 */
export declare class ConsoleCapture {
    private logs;
    private originalMethods;
    start(methods?: string[]): void;
    stop(): void;
    getLogs(type?: string): Array<{
        type: string;
        args: any[];
    }>;
    clear(): void;
    expectLog(type: string, matcher: string | RegExp | ((args: any[]) => boolean)): void;
}
/**
 * @ai-intent Create test context
 * @ai-pattern Isolated test environment
 */
export declare function withTestContext<T>(setup: () => Promise<T> | T, test: (context: T) => Promise<void> | void, teardown?: (context: T) => Promise<void> | void): Promise<void>;
/**
 * @ai-intent Assert async function throws
 * @ai-pattern Better async error testing
 */
export declare function expectAsyncError(fn: () => Promise<any>, errorClass?: new (...args: any[]) => Error, errorMessage?: string | RegExp): Promise<void>;
