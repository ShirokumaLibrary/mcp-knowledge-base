/**
 * Base MCP type definitions
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP Handler Context
 */
export interface McpHandlerContext {
  request: CallToolRequest;
  params: unknown; // Raw parameters from MCP
}

/**
 * Base handler params interface
 */
export interface BaseHandlerParams {
  [key: string]: unknown;
}

/**
 * Priority levels
 */
export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort by options
 */
export type SortBy = 'created' | 'updated' | 'priority';

/**
 * Search strategy
 */
export type SearchStrategy = 'keywords' | 'concepts' | 'embedding' | 'hybrid';