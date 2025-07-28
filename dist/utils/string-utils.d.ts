/**
 * @ai-context String utility functions for sanitizing user input
 * @ai-pattern Common text processing utilities
 */
/**
 * @ai-intent Remove zero-width and invisible Unicode characters
 * @ai-why These characters can cause display issues and confusion
 */
export declare function removeInvisibleCharacters(str: string): string;
/**
 * @ai-intent Clean and validate a string for use in the system
 * @ai-flow 1. Remove invisible chars -> 2. Trim whitespace
 */
export declare function cleanString(str: string): string;
