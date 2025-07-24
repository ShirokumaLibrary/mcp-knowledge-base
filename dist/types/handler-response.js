/**
 * @ai-context Unified response types for internal handlers
 * @ai-pattern Discriminated unions for type-safe responses
 * @ai-critical Different from MCP responses - internal use only
 * @ai-duplicate Similar to handler-types.ts - consider consolidating
 * @ai-why Consistent internal API responses
 */
/**
 * @ai-section Response Factory Functions
 * @ai-intent Helpers to create properly typed responses
 * @ai-pattern Factory pattern for consistency
 * @ai-why Ensures discriminator fields are set correctly
 */
/**
 * @ai-intent Create successful response
 * @ai-flow Set success=true, wrap data
 * @ai-return Properly typed DataResponse
 */
export function successResponse(data, message) {
    return {
        success: true, // @ai-critical: Literal true for discrimination
        data,
        message
    };
}
/**
 * @ai-intent Create error response
 * @ai-flow Set success=false, include error
 * @ai-return Properly typed ErrorResponse
 */
export function errorResponse(error, code) {
    return {
        success: false, // @ai-critical: Literal false for discrimination
        error,
        code
    };
}
//# sourceMappingURL=handler-response.js.map