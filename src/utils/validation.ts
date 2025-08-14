/**
 * Validation utilities for shirokuma-knowledge-base
 */

/**
 * Validates that a type string contains only lowercase letters, numbers, and underscores
 * @param type - The type string to validate
 * @returns true if valid, false otherwise
 */
export function isValidType(type: string): boolean {
  if (!type || type.length === 0) {
    return false;
  }

  // Must contain only lowercase letters (a-z), numbers (0-9), and underscores (_)
  const pattern = /^[a-z0-9_]+$/;
  return pattern.test(type);
}

/**
 * Normalizes a type string to valid format
 * @param type - The type string to normalize
 * @returns Normalized type string
 */
export function normalizeType(type: string): string {
  if (!type) {
    throw new Error('Type cannot be empty');
  }

  // Convert to lowercase and replace invalid characters with underscores
  let normalized = type.toLowerCase()
    .replace(/[^a-z0-9_]/g, '_');

  // First remove leading/trailing underscores
  normalized = normalized.replace(/^_+|_+$/g, '');

  // Then collapse multiple underscores only after trimming
  normalized = normalized.replace(/_+/g, '_');

  // If normalization results in empty string or only underscores
  if (normalized.length === 0 || /^_+$/.test(normalized)) {
    // Check if input contains any ASCII alphanumeric characters
    // If it only contains non-ASCII characters (like 日本語), return empty string
    // Otherwise throw error (for inputs like '###', '___', '🚀')
    if (/[a-z0-9]/i.test(type)) {
      // Had some valid ASCII characters, but they got removed - shouldn't happen
      throw new Error('Type contains no valid characters');
    } else if (/^[\u0001-\u007F]+$/.test(type)) { // eslint-disable-line no-control-regex
      // Only ASCII characters, but no valid ones (like '###', '___', spaces)
      throw new Error('Type contains no valid characters');
    } else if (/^[\u{1F000}-\u{1FAFF}]/u.test(type)) {
      // Emoji only - throw error
      throw new Error('Type contains no valid characters');
    } else {
      // Non-ASCII characters like 日本語 - return empty string
      return '';
    }
  }

  return normalized;
}

/**
 * Validates and normalizes a type string
 * @param type - The type string to process
 * @param autoNormalize - Whether to auto-normalize invalid types
 * @returns Validated/normalized type string
 * @throws Error if type is invalid and autoNormalize is false
 */
export function validateType(type: string, autoNormalize = false): string {
  // If autoNormalize is enabled, always normalize (even if valid)
  // to handle cases like multiple underscores
  if (autoNormalize) {
    return normalizeType(type);
  }

  if (isValidType(type)) {
    return type;
  }

  throw new Error(`Invalid type format: "${type}". Type must contain only lowercase letters (a-z), numbers (0-9), and underscores (_)`);
}