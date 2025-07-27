/**
 * @ai-context Mock implementations for handlers
 * @ai-pattern Test doubles for handler testing
 * @ai-critical Isolates handler logic from dependencies
 */
import { BaseHandler, ToolResponse } from '../../handlers/base-handler.js';
/**
 * @ai-intent Create mock base handler
 * @ai-pattern Stub implementation for handler testing
 */
export declare function createMockHandler(handlerName?: string, database?: any): BaseHandler & {
    mockMethods: Record<string, any>;
};
/**
 * @ai-intent Create mock tool response
 * @ai-pattern Standard response structure for tests
 */
export declare function createMockToolResponse(text: string): ToolResponse;
/**
 * @ai-intent Create mock handler registration
 * @ai-pattern Test data for handler registry
 */
export declare function createMockHandlerRegistration(name: string, handler: any): {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {};
        required: never[];
    };
    handler: import("jest-mock").Mock<() => Promise<ToolResponse>>;
};
/**
 * @ai-intent Mock handler factory
 * @ai-pattern Creates handlers with predefined behavior
 */
export declare class MockHandlerFactory {
    static createSuccessHandler(response?: string): any;
    static createErrorHandler(error: Error): any;
    static createDelayedHandler(response: string, delay: number): any;
    static createConditionalHandler(condition: (args: any) => boolean, successResponse: string, errorResponse: string): any;
}
/**
 * @ai-intent Assert handler was called correctly
 * @ai-pattern Test utilities for handler verification
 */
export declare function assertHandlerCalled(handler: any, expectedArgs?: any, times?: number): void;
export declare function assertHandlerResponse(response: ToolResponse, expectedText: string): void;
export declare function assertHandlerError(handler: any, errorClass?: new (...args: any[]) => Error, errorMessage?: string | RegExp): void;
