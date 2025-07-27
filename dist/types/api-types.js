/**
 * @ai-context API response types for MCP protocol
 * @ai-pattern Strict typing for all API interactions
 * @ai-critical These types ensure type safety at API boundaries
 * @ai-dependencies MCP SDK types
 * @ai-assumption All responses follow MCP protocol standards
 */
/**
 * @ai-intent Format helpers for API responses
 * @ai-pattern Consistent response formatting
 * @ai-usage Use these instead of manual formatting
 */
export const ResponseFormatters = {
    /**
     * @ai-intent Format data as MCP tool response
     * @ai-pattern Wraps data in proper structure
     */
    formatDataResponse(data, message) {
        const response = { data };
        if (message) {
            response.message = message;
        }
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(response, null, 2)
                }]
        };
    },
    /**
     * @ai-intent Format success message
     * @ai-pattern For operations without data
     */
    formatSuccessResponse(message) {
        return {
            content: [{
                    type: 'text',
                    text: message
                }]
        };
    },
    /**
     * @ai-intent Format markdown table
     * @ai-pattern For human-readable responses
     */
    formatMarkdownResponse(markdown) {
        return {
            content: [{
                    type: 'text',
                    text: markdown
                }]
        };
    },
    /**
     * @ai-intent Format error for MCP
     * @ai-pattern Consistent error formatting
     */
    formatErrorResponse(code, message, data) {
        return {
            error: {
                code,
                message,
                data
            }
        };
    }
};
/**
 * @ai-intent Type predicates for API types
 * @ai-pattern Runtime type checking
 * @ai-usage Validate API responses
 */
export const ApiTypeGuards = {
    isToolResponse(value) {
        return (typeof value === 'object' &&
            value !== null &&
            'content' in value &&
            Array.isArray(value.content));
    },
    isErrorResponse(value) {
        return (typeof value === 'object' &&
            value !== null &&
            'error' in value &&
            typeof value.error === 'object');
    },
    isDataResponse(value) {
        return (typeof value === 'object' &&
            value !== null &&
            'data' in value);
    }
};
//# sourceMappingURL=api-types.js.map