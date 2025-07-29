/**
 * @ai-context String utility functions for sanitizing user input
 * @ai-pattern Common text processing utilities
 */

/**
 * @ai-intent Remove zero-width and invisible Unicode characters
 * @ai-why These characters can cause display issues and confusion
 */
export function removeInvisibleCharacters(str: string): string {
  // List of invisible characters to remove
  const invisibleChars = [
    '\u200B', // Zero-width space
    '\u200C', // Zero-width non-joiner
    '\u200D', // Zero-width joiner
    '\u200E', // Left-to-right mark
    '\u200F', // Right-to-left mark
    '\u202A', // Left-to-right embedding
    '\u202B', // Right-to-left embedding
    '\u202C', // Pop directional formatting
    '\u202D', // Left-to-right override
    '\u202E', // Right-to-left override
    '\u2060', // Word joiner
    '\u2061', // Function application
    '\u2062', // Invisible times
    '\u2063', // Invisible separator
    '\u2064', // Invisible plus
    '\u206A', // Inhibit symmetric swapping
    '\u206B', // Activate symmetric swapping
    '\u206C', // Inhibit Arabic form shaping
    '\u206D', // Activate Arabic form shaping
    '\u206E', // National digit shapes
    '\u206F', // Nominal digit shapes
    '\uFEFF', // Zero-width no-break space (BOM)
    '\uFFF9', // Interlinear annotation anchor
    '\uFFFA', // Interlinear annotation separator
    '\uFFFB'  // Interlinear annotation terminator
  ];

  // Create a regex pattern to match all invisible characters
  const pattern = new RegExp(`[${invisibleChars.join('')}]`, 'g');

  return str.replace(pattern, '');
}

/**
 * @ai-intent Clean and validate a string for use in the system
 * @ai-flow 1. Remove invisible chars -> 2. Trim whitespace
 */
export function cleanString(str: string): string {
  return removeInvisibleCharacters(str).trim();
}