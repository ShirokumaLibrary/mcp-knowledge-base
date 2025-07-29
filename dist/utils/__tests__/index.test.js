import { sleep, retry, chunk, unique, deepClone, isPlainObject, debounce, createEnum, 
// Re-exports
createLogger, ensureInitialized, formatRelativeDate } from '../index.js';
// Mock the imported modules
jest.mock('../logger.js', () => ({
    createLogger: jest.fn(() => 'mocked logger')
}));
jest.mock('../decorators.js', () => ({
    ensureInitialized: jest.fn(() => 'mocked decorator')
}));
jest.mock('../date-utils.js', () => ({
    formatRelativeDate: jest.fn(() => 'mocked date formatter')
}));
describe('utils/index', () => {
    describe('re-exports', () => {
        it('should re-export createLogger from logger', () => {
            expect(createLogger).toBeDefined();
            expect(createLogger('test')).toBe('mocked logger');
        });
        it('should re-export ensureInitialized from decorators', () => {
            expect(ensureInitialized).toBeDefined();
            expect(ensureInitialized({}, 'method', {})).toBe('mocked decorator');
        });
        it('should re-export formatRelativeDate from date-utils', () => {
            expect(formatRelativeDate).toBeDefined();
            expect(formatRelativeDate(new Date())).toBe('mocked date formatter');
        });
    });
    describe('sleep', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });
        afterEach(() => {
            jest.useRealTimers();
        });
        it('should resolve after specified milliseconds', async () => {
            const promise = sleep(1000);
            // Should not resolve immediately
            jest.advanceTimersByTime(999);
            expect(jest.getTimerCount()).toBe(1);
            // Should resolve after 1000ms
            jest.advanceTimersByTime(1);
            await expect(promise).resolves.toBeUndefined();
        });
        it('should handle zero delay', async () => {
            const promise = sleep(0);
            jest.runAllTimers();
            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe('retry', () => {
        it('should return result on first successful attempt', async () => {
            const operation = jest.fn().mockResolvedValue('success');
            const result = await retry(operation);
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(1);
        });
        it('should retry on failure and eventually succeed', async () => {
            const operation = jest.fn()
                .mockRejectedValueOnce(new Error('fail 1'))
                .mockRejectedValueOnce(new Error('fail 2'))
                .mockResolvedValue('success');
            const result = await retry(operation);
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(3);
        });
        it('should throw last error after max attempts', async () => {
            const operation = jest.fn()
                .mockRejectedValue(new Error('persistent failure'));
            await expect(retry(operation, { maxAttempts: 2 }))
                .rejects.toThrow('persistent failure');
            expect(operation).toHaveBeenCalledTimes(2);
        });
        it('should respect custom options', async () => {
            jest.useFakeTimers();
            const operation = jest.fn()
                .mockRejectedValueOnce(new Error('fail'))
                .mockResolvedValue('success');
            const promise = retry(operation, {
                maxAttempts: 2,
                initialDelay: 100,
                backoffFactor: 3
            });
            // First attempt fails immediately
            await jest.advanceTimersByTimeAsync(0);
            expect(operation).toHaveBeenCalledTimes(1);
            // Wait for initial delay
            await jest.advanceTimersByTimeAsync(100);
            expect(operation).toHaveBeenCalledTimes(2);
            const result = await promise;
            expect(result).toBe('success');
            jest.useRealTimers();
        });
        it('should cap delay at maxDelay', async () => {
            const operation = jest.fn()
                .mockRejectedValueOnce(new Error('fail 1'))
                .mockRejectedValueOnce(new Error('fail 2'))
                .mockRejectedValueOnce(new Error('fail 3'))
                .mockResolvedValue('success');
            const result = await retry(operation, {
                maxAttempts: 4,
                initialDelay: 10,
                maxDelay: 30,
                backoffFactor: 10 // Would exceed maxDelay
            });
            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(4);
        });
    });
    describe('chunk', () => {
        it('should split array into chunks of specified size', () => {
            const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            expect(chunk(array, 3)).toEqual([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]);
            expect(chunk(array, 4)).toEqual([
                [1, 2, 3, 4],
                [5, 6, 7, 8],
                [9]
            ]);
        });
        it('should handle empty array', () => {
            expect(chunk([], 5)).toEqual([]);
        });
        it('should handle chunk size larger than array', () => {
            expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
        });
        it('should handle chunk size of 1', () => {
            expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
        });
    });
    describe('unique', () => {
        it('should remove duplicate values', () => {
            expect(unique([1, 2, 3, 2, 1, 4])).toEqual([1, 2, 3, 4]);
            expect(unique(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c']);
        });
        it('should preserve order of first occurrence', () => {
            expect(unique([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
        });
        it('should handle empty array', () => {
            expect(unique([])).toEqual([]);
        });
        it('should work with objects using reference equality', () => {
            const obj1 = { id: 1 };
            const obj2 = { id: 2 };
            const obj3 = { id: 1 }; // Different reference
            expect(unique([obj1, obj2, obj1, obj3])).toEqual([obj1, obj2, obj3]);
        });
    });
    describe('deepClone', () => {
        it('should create a deep copy of objects', () => {
            const original = {
                a: 1,
                b: { c: 2, d: [3, 4] },
                e: [{ f: 5 }]
            };
            const cloned = deepClone(original);
            expect(cloned).toEqual(original);
            expect(cloned).not.toBe(original);
            expect(cloned.b).not.toBe(original.b);
            expect(cloned.e[0]).not.toBe(original.e[0]);
        });
        it('should handle primitives', () => {
            expect(deepClone(42)).toBe(42);
            expect(deepClone('string')).toBe('string');
            expect(deepClone(true)).toBe(true);
            expect(deepClone(null)).toBe(null);
        });
        it('should lose functions and undefined values', () => {
            const original = {
                func: () => 'test',
                undef: undefined,
                valid: 'value'
            };
            const cloned = deepClone(original);
            expect(cloned).toEqual({ valid: 'value' });
            expect(cloned).not.toHaveProperty('func');
            expect(cloned).not.toHaveProperty('undef');
        });
        it('should handle dates as strings', () => {
            const date = new Date('2025-01-29T12:00:00Z');
            const cloned = deepClone({ date });
            expect(cloned.date).toBe(date.toISOString());
            expect(cloned.date).not.toBeInstanceOf(Date);
        });
    });
    describe('isPlainObject', () => {
        it('should return true for plain objects', () => {
            expect(isPlainObject({})).toBe(true);
            expect(isPlainObject({ a: 1 })).toBe(true);
            expect(isPlainObject(Object.create(null))).toBe(false); // No prototype
        });
        it('should return false for non-plain objects', () => {
            expect(isPlainObject(null)).toBe(false);
            expect(isPlainObject(undefined)).toBe(false);
            expect(isPlainObject(42)).toBe(false);
            expect(isPlainObject('string')).toBe(false);
            expect(isPlainObject(true)).toBe(false);
            expect(isPlainObject([])).toBe(false);
            expect(isPlainObject(new Date())).toBe(false);
            expect(isPlainObject(new Map())).toBe(false);
            expect(isPlainObject(() => { })).toBe(false);
        });
        it('should return false for class instances', () => {
            class TestClass {
            }
            expect(isPlainObject(new TestClass())).toBe(false);
        });
    });
    describe('debounce', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });
        afterEach(() => {
            jest.useRealTimers();
        });
        it('should delay function execution', () => {
            const func = jest.fn();
            const debounced = debounce(func, 100);
            debounced('arg1');
            expect(func).not.toHaveBeenCalled();
            jest.advanceTimersByTime(99);
            expect(func).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1);
            expect(func).toHaveBeenCalledWith('arg1');
            expect(func).toHaveBeenCalledTimes(1);
        });
        it('should cancel previous calls', () => {
            const func = jest.fn();
            const debounced = debounce(func, 100);
            debounced('call1');
            jest.advanceTimersByTime(50);
            debounced('call2');
            jest.advanceTimersByTime(50);
            debounced('call3');
            jest.advanceTimersByTime(100);
            expect(func).toHaveBeenCalledTimes(1);
            expect(func).toHaveBeenCalledWith('call3');
        });
        it('should handle multiple arguments', () => {
            const func = jest.fn();
            const debounced = debounce(func, 100);
            debounced('arg1', 'arg2', 'arg3');
            jest.runAllTimers();
            expect(func).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
        });
    });
    describe('createEnum', () => {
        it('should create enum object from array', () => {
            const colors = ['RED', 'GREEN', 'BLUE'];
            const ColorEnum = createEnum(colors);
            expect(ColorEnum).toEqual({
                RED: 'RED',
                GREEN: 'GREEN',
                BLUE: 'BLUE'
            });
            expect(ColorEnum.RED).toBe('RED');
            expect(ColorEnum.GREEN).toBe('GREEN');
            expect(ColorEnum.BLUE).toBe('BLUE');
        });
        it('should handle empty array', () => {
            expect(createEnum([])).toEqual({});
        });
        it('should work with type safety', () => {
            const statuses = ['PENDING', 'APPROVED', 'REJECTED'];
            const StatusEnum = createEnum(statuses);
            // TypeScript should recognize these as valid
            const status = 'PENDING';
            expect(StatusEnum[status]).toBe('PENDING');
        });
    });
});
//# sourceMappingURL=index.test.js.map