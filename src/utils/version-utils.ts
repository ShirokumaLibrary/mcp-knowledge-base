/**
 * @ai-context Version normalization utilities
 * @ai-pattern Normalize semantic versions for proper string comparison
 * @ai-critical 5-digit padding ensures correct ordering up to 99999
 */

/**
 * @ai-intent Normalize version string for database storage
 * @ai-flow "0.7.11" -> "00000.00007.00011"
 * @ai-validation Returns null for invalid input
 */
export function normalizeVersion(version: string | null | undefined): string | null {
  if (!version) return null;
  
  // Remove common prefixes
  const cleaned = version.trim().replace(/^v/i, '');
  
  // Split into parts
  const parts = cleaned.split('.');
  
  // Handle various formats
  const [major = '0', minor = '0', patch = '0'] = parts;
  
  // Pad each part to 5 digits
  const normalized = [
    major.padStart(5, '0'),
    minor.padStart(5, '0'),
    patch.padStart(5, '0')
  ].join('.');
  
  // Validate result
  if (normalized === '00000.00000.00000' && cleaned !== '0.0.0') {
    // Invalid version
    return null;
  }
  
  return normalized;
}

/**
 * @ai-intent Denormalize version string for display
 * @ai-flow "00000.00007.00011" -> "0.7.11"
 * @ai-validation Returns null for invalid input
 */
export function denormalizeVersion(normalized: string | null | undefined): string | null {
  if (!normalized) return null;
  
  try {
    const parts = normalized.split('.');
    if (parts.length !== 3) return normalized; // Return as-is if not normalized
    
    const denormalized = parts
      .map(part => {
        const num = parseInt(part, 10);
        if (isNaN(num)) return part; // Keep original if not a number
        return num.toString();
      })
      .join('.');
    
    return denormalized;
  } catch {
    // Return original if parsing fails
    return normalized;
  }
}

/**
 * @ai-intent Normalize version for comparison in search
 * @ai-pattern Handles comparison operators
 */
export function normalizeVersionForComparison(versionQuery: string): {
  operator: string;
  version: string | null;
} {
  // Extract operator
  const match = versionQuery.match(/^(>=|>|<=|<|=)?(.*)$/);
  const operator = match?.[1] || '=';
  const versionPart = match?.[2]?.trim() || versionQuery.trim();
  
  return {
    operator,
    version: normalizeVersion(versionPart)
  };
}