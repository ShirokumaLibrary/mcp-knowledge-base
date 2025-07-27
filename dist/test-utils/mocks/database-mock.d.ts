/**
 * @ai-context Mock implementations for database interfaces
 * @ai-pattern Test doubles for isolated unit testing
 * @ai-critical Ensures tests don't depend on real database
 */
import { Logger } from 'winston';
/**
 * @ai-intent Create mock database with all repositories
 * @ai-pattern Factory function for test database
 */
export declare function createMockDatabase(): any;
/**
 * @ai-intent Create mock status repository
 * @ai-pattern Stub implementation for status operations
 */
export declare function createMockStatusRepository(): any;
/**
 * @ai-intent Create mock tag repository
 * @ai-pattern Stub implementation for tag operations
 */
export declare function createMockTagRepository(): any;
/**
 * @ai-intent Create mock repository with CRUD operations
 * @ai-pattern Generic mock for entity repositories
 */
export declare function createMockRepository<T extends {
    id: number;
}>(entityName: string, defaultItems?: T[]): {
    getAll: import("jest-mock").Mock<() => Promise<T[]>>;
    getById: import("jest-mock").Mock<(id: number) => Promise<T | null>>;
    create: import("jest-mock").Mock<(data: Omit<T, "id">) => Promise<T>>;
    update: import("jest-mock").Mock<(id: number, data: Partial<T>) => Promise<boolean>>;
    delete: import("jest-mock").Mock<(id: number) => Promise<boolean>>;
    search: import("jest-mock").Mock<() => Promise<T[]>>;
    count: import("jest-mock").Mock<() => Promise<number>>;
    exists: import("jest-mock").Mock<(id: number) => Promise<boolean>>;
};
/**
 * @ai-intent Create mock logger
 * @ai-pattern Test logger that doesn't output
 */
export declare function createMockLogger(): Logger;
/**
 * @ai-intent Create spy on existing object methods
 * @ai-pattern Wrapper for partial mocking
 */
export declare function spyOnMethods<T extends object>(obj: T, methods: (keyof T)[]): T;
/**
 * @ai-intent Reset all mock functions
 * @ai-pattern Clean state between tests
 */
export declare function resetAllMocks(mocks: any[]): void;
