export function parseSearchQuery(query) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
        return { type: 'expression', expression: { type: 'term', value: '', negated: false } };
    }
    const tokens = tokenize(normalizedQuery);
    const expression = parseExpression(tokens);
    return { type: 'expression', expression };
}
function tokenize(query) {
    const tokens = [];
    const tokenRegex = /(-)?(?:(\w+):("([^"]*)"|([^\s()]+))|"([^"]+)"|([^\s()]+)|(\(|\)))/g;
    let match;
    while ((match = tokenRegex.exec(query)) !== null) {
        const [fullMatch, negation, field, fieldValueFull, quotedValue, unquotedValue, quotedTerm, plainTerm, paren] = match;
        if (paren) {
            tokens.push({ type: paren === '(' ? 'LPAREN' : 'RPAREN' });
        }
        else if (field) {
            const value = quotedValue || unquotedValue || '';
            const validFields = ['title', 'content', 'description', 'tags', 'type'];
            if (validFields.includes(field.toLowerCase())) {
                tokens.push({
                    type: 'TERM',
                    field: field.toLowerCase(),
                    value: value,
                    negated: !!negation
                });
            }
            else {
                tokens.push({
                    type: 'TERM',
                    value: fullMatch,
                    negated: false
                });
            }
        }
        else if (quotedTerm) {
            tokens.push({
                type: 'TERM',
                value: quotedTerm,
                negated: !!negation
            });
        }
        else if (plainTerm) {
            const upperTerm = plainTerm.toUpperCase();
            if (upperTerm === 'AND') {
                tokens.push({ type: 'AND' });
            }
            else if (upperTerm === 'OR') {
                tokens.push({ type: 'OR' });
            }
            else if (upperTerm === 'NOT') {
                tokens.push({ type: 'NOT' });
            }
            else {
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
function parseExpression(tokens) {
    let current = 0;
    function parseOr() {
        let left = parseAnd();
        while (current < tokens.length && tokens[current]?.type === 'OR') {
            current++;
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
    function parseAnd() {
        let left = parseNot();
        while (current < tokens.length &&
            (tokens[current]?.type === 'AND' ||
                (tokens[current]?.type === 'TERM' || tokens[current]?.type === 'NOT' || tokens[current]?.type === 'LPAREN'))) {
            if (tokens[current]?.type === 'AND') {
                current++;
            }
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
    function parseNot() {
        if (current < tokens.length && tokens[current]?.type === 'NOT') {
            current++;
            const expr = parsePrimary();
            if (expr.type === 'term') {
                return { ...expr, negated: true };
            }
            return expr;
        }
        return parsePrimary();
    }
    function parsePrimary() {
        if (current >= tokens.length) {
            return { type: 'term', value: '', negated: false };
        }
        const token = tokens[current];
        if (token.type === 'LPAREN') {
            current++;
            const expr = parseOr();
            if (current < tokens.length && tokens[current]?.type === 'RPAREN') {
                current++;
            }
            return expr;
        }
        if (token.type === 'TERM') {
            current++;
            return {
                type: 'term',
                field: token.field,
                value: token.value,
                negated: token.negated || false
            };
        }
        current++;
        return parsePrimary();
    }
    return parseOr();
}
export function toFTS5Query(parsed) {
    if (!parsed.expression) {
        return '';
    }
    return expressionToFTS5(parsed.expression);
}
function expressionToFTS5(expr) {
    if (expr.type === 'term') {
        let ftsQuery = '';
        const escapedValue = expr.value.replace(/['"]/g, '');
        if (!escapedValue) {
            return '';
        }
        if (expr.field) {
            ftsQuery = `{${expr.field}}:${escapedValue}`;
        }
        else {
            ftsQuery = escapedValue;
        }
        if (expr.negated) {
            ftsQuery = `-${ftsQuery}`;
        }
        return ftsQuery;
    }
    else if (expr.type === 'boolean') {
        const left = expressionToFTS5(expr.left);
        const right = expressionToFTS5(expr.right);
        if (!left && !right) {
            return '';
        }
        else if (!left) {
            return right;
        }
        else if (!right) {
            return left;
        }
        return `(${left} ${expr.operator} ${right})`;
    }
    return '';
}
export function hasFieldSpecificSearch(query) {
    const parsed = parseSearchQuery(query);
    return hasFieldInExpression(parsed.expression);
}
function hasFieldInExpression(expr) {
    if (expr.type === 'term') {
        return expr.field !== undefined;
    }
    else if (expr.type === 'boolean') {
        return hasFieldInExpression(expr.left) || hasFieldInExpression(expr.right);
    }
    return false;
}
export function legacyToNewFormat(terms, operator = 'AND') {
    if (terms.length === 0) {
        return { type: 'expression', expression: { type: 'term', value: '', negated: false } };
    }
    if (terms.length === 1) {
        return {
            type: 'expression',
            expression: {
                type: 'term',
                field: terms[0].field,
                value: terms[0].value,
                negated: terms[0].negated || false
            }
        };
    }
    let expression = {
        type: 'term',
        field: terms[0].field,
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
                field: terms[i].field,
                value: terms[i].value,
                negated: terms[i].negated || false
            }
        };
    }
    return { type: 'expression', expression };
}
