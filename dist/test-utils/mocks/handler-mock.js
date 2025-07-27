/**
 * @ai-context Mock implementations for handlers
 * @ai-pattern Test doubles for handler testing
 * @ai-critical Isolates handler logic from dependencies
 */
import { BaseHandler } from '../../handlers/base-handler.js';
import { jest } from '@jest/globals';
import { createMockLogger } from './database-mock.js';
/**
 * @ai-intent Create mock base handler
 * @ai-pattern Stub implementation for handler testing
 */
export function createMockHandler(handlerName = 'MockHandler', database) {
    const handler = new (class extends BaseHandler {
        constructor() {
            super(handlerName, database);
        }
    })();
    // Replace logger with mock
    handler.logger = createMockLogger();
    // Create spies for all public methods
    const mockMethods = {
        createResponse: jest.spyOn(handler, 'createResponse'),
        createErrorResponse: jest.spyOn(handler, 'createErrorResponse'),
        wrapHandler: jest.spyOn(handler, 'wrapHandler'),
        formatDate: jest.spyOn(handler, 'formatDate'),
        formatDateTime: jest.spyOn(handler, 'formatDateTime'),
        parseOptionalArray: jest.spyOn(handler, 'parseOptionalArray'),
        formatList: jest.spyOn(handler, 'formatList'),
        formatJson: jest.spyOn(handler, 'formatJson'),
        ensureDatabase: jest.spyOn(handler, 'ensureDatabase'),
        formatError: jest.spyOn(handler, 'formatError'),
        isEmpty: jest.spyOn(handler, 'isEmpty'),
        truncate: jest.spyOn(handler, 'truncate')
    };
    return Object.assign(handler, { mockMethods });
}
/**
 * @ai-intent Create mock tool response
 * @ai-pattern Standard response structure for tests
 */
export function createMockToolResponse(text) {
    return {
        content: [{
                type: 'text',
                text
            }]
    };
}
/**
 * @ai-intent Create mock handler registration
 * @ai-pattern Test data for handler registry
 */
export function createMockHandlerRegistration(name, handler) {
    return {
        name,
        description: `Mock ${name} handler`,
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        },
        handler: jest.fn().mockResolvedValue(createMockToolResponse('Success'))
    };
}
/**
 * @ai-intent Mock handler factory
 * @ai-pattern Creates handlers with predefined behavior
 */
export class MockHandlerFactory {
    static createSuccessHandler(response = 'Success') {
        return jest.fn().mockResolvedValue(createMockToolResponse(response));
    }
    static createErrorHandler(error) {
        return jest.fn().mockRejectedValue(error);
    }
    static createDelayedHandler(response, delay) {
        return jest.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, delay));
            return createMockToolResponse(response);
        });
    }
    static createConditionalHandler(condition, successResponse, errorResponse) {
        return jest.fn().mockImplementation(async (args) => {
            if (condition(args)) {
                return createMockToolResponse(successResponse);
            }
            throw new Error(errorResponse);
        });
    }
}
/**
 * @ai-intent Assert handler was called correctly
 * @ai-pattern Test utilities for handler verification
 */
export function assertHandlerCalled(handler, expectedArgs, times = 1) {
    expect(handler).toHaveBeenCalledTimes(times);
    if (expectedArgs !== undefined) {
        expect(handler).toHaveBeenCalledWith(expectedArgs);
    }
}
export function assertHandlerResponse(response, expectedText) {
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe('text');
    expect(response.content[0].text).toBe(expectedText);
}
export function assertHandlerError(handler, errorClass, errorMessage) {
    expect(handler).toHaveBeenCalled();
    const error = handler.mock.results[0]?.value;
    expect(error).toBeInstanceOf(Promise);
    if (errorClass) {
        expect(handler).rejects.toThrow(errorClass);
    }
    if (errorMessage) {
        expect(handler).rejects.toThrow(errorMessage);
    }
}
//# sourceMappingURL=handler-mock.js.map