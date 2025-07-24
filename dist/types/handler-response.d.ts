/**
 * @ai-context Unified response types for internal handlers
 * @ai-pattern Discriminated unions for type-safe responses
 * @ai-critical Different from MCP responses - internal use only
 * @ai-duplicate Similar to handler-types.ts - consider consolidating
 * @ai-why Consistent internal API responses
 */
/**
 * @ai-intent Base response shape
 * @ai-pattern Common fields for all responses
 * @ai-logic Success flag for discrimination
 */
export interface BaseResponse {
    success: boolean;
    message?: string;
}
/**
 * @ai-intent Successful response with data
 * @ai-pattern Extends base with data payload
 * @ai-generic T: Type of data being returned
 * @ai-discriminator success: true
 */
export interface DataResponse<T> extends BaseResponse {
    success: true;
    data: T;
}
/**
 * @ai-intent Error response format
 * @ai-pattern Extends base with error details
 * @ai-discriminator success: false
 * @ai-usage Return on handler failures
 */
export interface ErrorResponse extends BaseResponse {
    success: false;
    error: string;
    code?: string;
}
/**
 * @ai-intent Union type for all responses
 * @ai-pattern Discriminated union on success field
 * @ai-usage Type guards: if (response.success) { ... }
 */
export type HandlerResponse<T> = DataResponse<T> | ErrorResponse;
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
export declare function successResponse<T>(data: T, message?: string): DataResponse<T>;
/**
 * @ai-intent Create error response
 * @ai-flow Set success=false, include error
 * @ai-return Properly typed ErrorResponse
 */
export declare function errorResponse(error: string, code?: string): ErrorResponse;
