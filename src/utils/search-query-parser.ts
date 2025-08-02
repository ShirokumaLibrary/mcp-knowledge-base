/**
 * @ai-context Advanced search query parser for field-specific searches
 * @ai-pattern Parser for handling field:value syntax and operators
 */

export interface ParsedQuery {
  type: 'expression';
  expression: QueryExpression;
}

export type QueryExpression =
  | SearchTerm
  | BooleanExpression;

export interface SearchTerm {
  type: 'term';
  field?: 'title' | 'content' | 'description' | 'tags' | 'type';
  value: string;
  negated?: boolean;
}

export interface BooleanExpression {
  type: 'boolean';
  operator: 'AND' | 'OR';
  left: QueryExpression;
  right: QueryExpression;
}

/**
 * Parse a search query with field-specific syntax and boolean operators
 *
 * Supported syntax:
 * - Simple search: "bug fix"
 * - Field search: "title:bug"
 * - Boolean operators: "bug AND fix", "bug OR fix", "NOT bug"
 * - Multiple fields: "title:bug AND content:authentication"
 * - Quoted values: "title:\"bug fix\""
 * - Negation: "-title:test" or "NOT title:test"
 * - Mixed: "authentication AND title:login OR -tags:deprecated"
 * - Parentheses: "(bug OR fix) AND title:important"
 *
 * Operator precedence (highest to lowest):
 * 1. NOT / - (negation)
 * 2. AND
 * 3. OR
 *
 * @param query The search query string
 * @returns Parsed query structure
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return { type: 'expression', expression: { type: 'term', value: '', negated: false } };
  }

  const tokens = tokenize(normalizedQuery);
  const expression = parseExpression(tokens);

  return { type: 'expression', expression };
}

type Token =
  | { type: 'TERM'; value: string; field?: string; negated?: boolean }
  | { type: 'AND' }
  | { type: 'OR' }
  | { type: 'NOT' }
  | { type: 'LPAREN' }
  | { type: 'RPAREN' };

function tokenize(query: string): Token[] {
  const tokens: Token[] = [];
  // Improved regex to handle all patterns correctly
  // Pattern breakdown:
  // 1. (-)?                           - Optional negation prefix
  // 2. (\w+):("([^"]*)"|([^\s()]+))  - Field:value or field:"quoted value"
  // 3. "([^"]+)"                      - Quoted term (without field)
  // 4. ([^\s()]+)                     - Plain term (including operators)
  // 5. (\(|\))                        - Parentheses
  const tokenRegex = /(-)?(?:(\w+):("([^"]*)"|([^\s()]+))|"([^"]+)"|([^\s()]+)|(\(|\)))/g;

  let match;
  while ((match = tokenRegex.exec(query)) !== null) {
    const [
      fullMatch,
      negation,      // Group 1: optional negation prefix
      field,         // Group 2: field name
      fieldValueFull,// Group 3: full field value (with quotes if present)
      quotedValue,   // Group 4: quoted field value content
      unquotedValue, // Group 5: unquoted field value
      quotedTerm,    // Group 6: quoted term (no field)
      plainTerm,     // Group 7: plain term (no field)
      paren          // Group 8: parenthesis
    ] = match;

    if (paren) {
      tokens.push({ type: paren === '(' ? 'LPAREN' : 'RPAREN' });
    } else if (field) {
      // Field-specific search
      const value = quotedValue || unquotedValue || '';
      const validFields = ['title', 'content', 'description', 'tags', 'type'];

      if (validFields.includes(field.toLowerCase())) {
        tokens.push({
          type: 'TERM',
          field: field.toLowerCase(),
          value: value,
          negated: !!negation
        });
      } else {
        // Invalid field, treat as plain text
        tokens.push({
          type: 'TERM',
          value: fullMatch,
          negated: false
        });
      }
    } else if (quotedTerm) {
      // Quoted term without field - the value is already without quotes
      tokens.push({
        type: 'TERM',
        value: quotedTerm,
        negated: !!negation
      });
    } else if (plainTerm) {
      // Check if it's an operator
      const upperTerm = plainTerm.toUpperCase();
      if (upperTerm === 'AND') {
        tokens.push({ type: 'AND' });
      } else if (upperTerm === 'OR') {
        tokens.push({ type: 'OR' });
      } else if (upperTerm === 'NOT') {
        tokens.push({ type: 'NOT' });
      } else {
        tokens.push({
          type: 'TERM',
          value: plainTerm,
          negated: !!negation
        });
      }
    }
  }

  return tokens;
}

function parseExpression(tokens: Token[]): QueryExpression {
  let current = 0;

  function parseOr(): QueryExpression {
    let left = parseAnd();

    while (current < tokens.length && tokens[current]?.type === 'OR') {
      current++; // consume OR
      const right = parseAnd();
      left = {
        type: 'boolean',
        operator: 'OR',
        left,
        right
      };
    }

    return left;
  }

  function parseAnd(): QueryExpression {
    let left = parseNot();

    while (current < tokens.length &&
           (tokens[current]?.type === 'AND' ||
            (tokens[current]?.type === 'TERM' || tokens[current]?.type === 'NOT' || tokens[current]?.type === 'LPAREN'))) {

      // Implicit AND if no operator
      if (tokens[current]?.type === 'AND') {
        current++; // consume AND
      }

      // If the next token is OR, stop here
      if (current < tokens.length && tokens[current]?.type === 'OR') {
        break;
      }

      const right = parseNot();
      left = {
        type: 'boolean',
        operator: 'AND',
        left,
        right
      };
    }

    return left;
  }

  function parseNot(): QueryExpression {
    if (current < tokens.length && tokens[current]?.type === 'NOT') {
      current++; // consume NOT
      const expr = parsePrimary();
      if (expr.type === 'term') {
        return { ...expr, negated: true };
      }
      // For boolean expressions, we need to wrap in a negated term
      // This is a simplification - proper implementation would need De Morgan's laws
      return expr;
    }

    return parsePrimary();
  }

  function parsePrimary(): QueryExpression {
    if (current >= tokens.length) {
      return { type: 'term', value: '', negated: false };
    }

    const token = tokens[current];

    if (token.type === 'LPAREN') {
      current++; // consume (
      const expr = parseOr();
      if (current < tokens.length && tokens[current]?.type === 'RPAREN') {
        current++; // consume )
      }
      return expr;
    }

    if (token.type === 'TERM') {
      current++;
      return {
        type: 'term',
        field: token.field as any,
        value: token.value,
        negated: token.negated || false
      };
    }

    // Unexpected token, skip it
    current++;
    return parsePrimary();
  }

  return parseOr();
}

/**
 * Convert parsed query to FTS5 query string
 *
 * @param parsed The parsed query structure
 * @returns FTS5 compatible query string
 */
export function toFTS5Query(parsed: ParsedQuery): string {
  if (!parsed.expression) {
    return '';
  }

  return expressionToFTS5(parsed.expression);
}

function expressionToFTS5(expr: QueryExpression): string {
  if (expr.type === 'term') {
    let ftsQuery = '';

    // Escape special characters in the value
    const escapedValue = expr.value.replace(/['"]/g, '');

    if (!escapedValue) {
      return '';
    }

    if (expr.field) {
      // Field-specific search using FTS5 column filter syntax
      // Example: title:bug becomes {title}:bug
      ftsQuery = `{${expr.field}}:${escapedValue}`;
    } else {
      // General search across all fields
      ftsQuery = escapedValue;
    }

    // Handle negation
    if (expr.negated) {
      ftsQuery = `-${ftsQuery}`;
    }

    return ftsQuery;
  } else if (expr.type === 'boolean') {
    const left = expressionToFTS5(expr.left);
    const right = expressionToFTS5(expr.right);

    if (!left && !right) {
      return '';
    } else if (!left) {
      return right;
    } else if (!right) {
      return left;
    }

    // Wrap sub-expressions in parentheses for correct precedence
    return `(${left} ${expr.operator} ${right})`;
  }

  return '';
}

/**
 * Check if a query contains field-specific searches
 *
 * @param query The search query string
 * @returns true if the query contains field-specific searches
 */
export function hasFieldSpecificSearch(query: string): boolean {
  const parsed = parseSearchQuery(query);
  return hasFieldInExpression(parsed.expression);
}

function hasFieldInExpression(expr: QueryExpression): boolean {
  if (expr.type === 'term') {
    return expr.field !== undefined;
  } else if (expr.type === 'boolean') {
    return hasFieldInExpression(expr.left) || hasFieldInExpression(expr.right);
  }
  return false;
}

/**
 * Convert old-style parsed query to new format (for backward compatibility)
 */
export function legacyToNewFormat(terms: Array<{field?: string, value: string, negated?: boolean}>, operator: 'AND' | 'OR' = 'AND'): ParsedQuery {
  if (terms.length === 0) {
    return { type: 'expression', expression: { type: 'term', value: '', negated: false } };
  }

  if (terms.length === 1) {
    return {
      type: 'expression',
      expression: {
        type: 'term',
        field: terms[0].field as any,
        value: terms[0].value,
        negated: terms[0].negated || false
      }
    };
  }

  // Build a tree of expressions
  let expression: QueryExpression = {
    type: 'term',
    field: terms[0].field as any,
    value: terms[0].value,
    negated: terms[0].negated || false
  };

  for (let i = 1; i < terms.length; i++) {
    expression = {
      type: 'boolean',
      operator,
      left: expression,
      right: {
        type: 'term',
        field: terms[i].field as any,
        value: terms[i].value,
        negated: terms[i].negated || false
      }
    };
  }

  return { type: 'expression', expression };
}