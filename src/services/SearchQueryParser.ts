export interface ParsedQuery {
  keywords: string[];
  filters: {
    type?: string[];
    status?: string[];
    is?: 'open' | 'closed';
    priority?: string[];
  };
  raw: string;
}

export class SearchQueryParser {
  /**
   * Parse structured query string into components
   * Examples:
   * - "status:Open type:issue" → filters
   * - "bug fix" → keywords
   * - "status:Open bug" → mixed
   */
  parse(query: string): ParsedQuery {
    const filters: ParsedQuery['filters'] = {};
    const keywords: string[] = [];
    
    // Pattern: extract key:value pairs
    const filterPattern = /(\w+):([^\s]+)/g;
    let remaining = query;
    const matches: Array<{ key: string; value: string; fullMatch: string }> = [];
    
    // Collect all matches first
    let match;
    while ((match = filterPattern.exec(query)) !== null) {
      const [fullMatch, key, value] = match;
      matches.push({ key, value, fullMatch });
    }
    
    // Process matches and remove from remaining string
    for (const { key, value, fullMatch } of matches) {
      switch(key) {
        case 'status':
          if (!filters.status) filters.status = [];
          filters.status.push(value);
          break;
        case 'type':
          if (!filters.type) filters.type = [];
          filters.type.push(value);
          break;
        case 'is':
          if (value === 'open' || value === 'closed') {
            filters.is = value;
          }
          break;
        case 'priority':
          if (!filters.priority) filters.priority = [];
          filters.priority.push(value.toUpperCase());
          break;
      }
      
      remaining = remaining.replace(fullMatch, ' ');
    }
    
    // Process remaining words as keywords
    const remainingWords = remaining.trim().split(/\s+/).filter(w => w.length > 0);
    keywords.push(...remainingWords);
    
    return { keywords, filters, raw: query };
  }
}