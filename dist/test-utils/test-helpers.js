/**
 * @ai-context Test helper utilities
 * @ai-pattern Common test setup and assertions
 * @ai-critical Simplifies test writing and maintenance
 */
import { z } from 'zod';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import path from 'path';
/**
 * @ai-intent Setup test environment
 * @ai-pattern Common test setup
 */
export async function setupTestEnvironment() {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error'; // Suppress logs in tests
    // Create test directories
    const testDir = path.join(process.cwd(), 'test-data');
    await fs.mkdir(testDir, { recursive: true });
    return {
        testDir,
        cleanup: async () => {
            // Clean up test directories
            await fs.rm(testDir, { recursive: true, force: true });
        }
    };
}
/**
 * @ai-intent Create test database
 * @ai-pattern In-memory database for tests
 */
export function createTestDatabase() {
    // Return mock database for testing
    return { memory: true };
}
/**
 * @ai-intent Assert Zod validation error
 * @ai-pattern Verify schema validation failures
 */
export function expectZodError(fn, expectedPaths, expectedMessages) {
    expect(fn).toThrow(z.ZodError);
    try {
        fn();
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            if (expectedPaths) {
                const paths = error.errors.map(e => e.path.join('.'));
                expectedPaths.forEach(path => {
                    expect(paths).toContain(path);
                });
            }
            if (expectedMessages) {
                const messages = error.errors.map(e => e.message);
                expectedMessages.forEach(msg => {
                    expect(messages.some(m => m.includes(msg))).toBe(true);
                });
            }
        }
    }
}
/**
 * @ai-intent Assert MCP error
 * @ai-pattern Verify MCP protocol errors
 */
export function expectMcpError(fn, expectedCode, expectedMessage) {
    const assertion = expect(fn);
    if (fn.constructor.name === 'AsyncFunction') {
        assertion.rejects.toThrow(McpError);
        assertion.rejects.toMatchObject({ code: expectedCode });
        if (expectedMessage) {
            if (typeof expectedMessage === 'string') {
                assertion.rejects.toMatchObject({ message: expectedMessage });
            }
            else {
                assertion.rejects.toThrow(expectedMessage);
            }
        }
    }
    else {
        assertion.toThrow(McpError);
        try {
            fn();
        }
        catch (error) {
            if (error instanceof McpError) {
                expect(error.code).toBe(expectedCode);
                if (expectedMessage) {
                    if (typeof expectedMessage === 'string') {
                        expect(error.message).toBe(expectedMessage);
                    }
                    else {
                        expect(error.message).toMatch(expectedMessage);
                    }
                }
            }
        }
    }
}
/**
 * @ai-intent Create temporary file
 * @ai-pattern Test file operations
 */
export async function createTempFile(content, extension = '.txt') {
    const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-'));
    const filePath = path.join(tempDir, `test${extension}`);
    await fs.writeFile(filePath, content, 'utf-8');
    return {
        path: filePath,
        cleanup: async () => {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    };
}
/**
 * @ai-intent Wait for condition
 * @ai-pattern Async test utilities
 */
export async function waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
}
/**
 * @ai-intent Mock date/time
 * @ai-pattern Control time in tests
 */
export class TimeMock {
    originalDate;
    currentTime;
    constructor(initialTime = new Date()) {
        this.originalDate = global.Date;
        this.currentTime = new Date(initialTime).getTime();
    }
    install() {
        global.Date = class extends this.originalDate {
            constructor(...args) {
                if (args.length === 0) {
                    super(TimeMock.getInstance().currentTime);
                }
                else {
                    super(...args);
                }
            }
            static now() {
                return TimeMock.getInstance().currentTime;
            }
        };
        TimeMock.setInstance(this);
    }
    uninstall() {
        global.Date = this.originalDate;
        TimeMock.clearInstance();
    }
    advance(ms) {
        this.currentTime += ms;
    }
    setTime(time) {
        this.currentTime = new Date(time).getTime();
    }
    static instance = null;
    static getInstance() {
        if (!this.instance) {
            throw new Error('TimeMock not installed');
        }
        return this.instance;
    }
    static setInstance(instance) {
        this.instance = instance;
    }
    static clearInstance() {
        this.instance = null;
    }
}
/**
 * @ai-intent Capture console output
 * @ai-pattern Test console logging
 */
export class ConsoleCapture {
    logs = [];
    originalMethods = {};
    start(methods = ['log', 'error', 'warn', 'info']) {
        methods.forEach(method => {
            this.originalMethods[method] = console[method];
            console[method] = (...args) => {
                this.logs.push({ type: method, args });
            };
        });
    }
    stop() {
        Object.entries(this.originalMethods).forEach(([method, original]) => {
            console[method] = original;
        });
    }
    getLogs(type) {
        return type ? this.logs.filter(log => log.type === type) : this.logs;
    }
    clear() {
        this.logs = [];
    }
    expectLog(type, matcher) {
        const logs = this.getLogs(type);
        const found = logs.some(log => {
            if (typeof matcher === 'function') {
                return matcher(log.args);
            }
            else if (matcher instanceof RegExp) {
                return log.args.some(arg => typeof arg === 'string' && matcher.test(arg));
            }
            else {
                return log.args.some(arg => typeof arg === 'string' && arg.includes(matcher));
            }
        });
        expect(found).toBe(true);
    }
}
/**
 * @ai-intent Create test context
 * @ai-pattern Isolated test environment
 */
export async function withTestContext(setup, test, teardown) {
    let context;
    try {
        context = await setup();
        await test(context);
    }
    finally {
        if (context !== undefined && teardown) {
            await teardown(context);
        }
    }
}
/**
 * @ai-intent Assert async function throws
 * @ai-pattern Better async error testing
 */
export async function expectAsyncError(fn, errorClass, errorMessage) {
    let thrown = false;
    let error;
    try {
        await fn();
    }
    catch (e) {
        thrown = true;
        error = e;
    }
    expect(thrown).toBe(true);
    if (errorClass) {
        expect(error).toBeInstanceOf(errorClass);
    }
    if (errorMessage) {
        if (typeof errorMessage === 'string') {
            expect(error.message).toBe(errorMessage);
        }
        else {
            expect(error.message).toMatch(errorMessage);
        }
    }
}
//# sourceMappingURL=test-helpers.js.map