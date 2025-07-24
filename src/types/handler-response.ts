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
  success: boolean;      // @ai-logic: Discriminator field
  message?: string;      // @ai-logic: Optional human message
}

/**
 * @ai-intent Successful response with data
 * @ai-pattern Extends base with data payload
 * @ai-generic T: Type of data being returned
 * @ai-discriminator success: true
 */
export interface DataResponse<T> extends BaseResponse {
  success: true;        // @ai-discriminator: Literal true
  data: T;              // @ai-logic: Actual response payload
}

/**
 * @ai-intent Error response format
 * @ai-pattern Extends base with error details
 * @ai-discriminator success: false
 * @ai-usage Return on handler failures
 */
export interface ErrorResponse extends BaseResponse {
  success: false;       // @ai-discriminator: Literal false
  error: string;        // @ai-logic: Error description
  code?: string;        // @ai-pattern: Machine-readable code
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
export function successResponse<T>(data: T, message?: string): DataResponse<T> {
  return {
    success: true,      // @ai-critical: Literal true for discrimination
    data,
    message
  };
}

/**
 * @ai-intent Create error response
 * @ai-flow Set success=false, include error
 * @ai-return Properly typed ErrorResponse
 */
export function errorResponse(error: string, code?: string): ErrorResponse {
  return {
    success: false,     // @ai-critical: Literal false for discrimination
    error,
    code
  };
}