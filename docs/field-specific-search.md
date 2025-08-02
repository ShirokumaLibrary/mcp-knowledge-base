# Advanced Search with Field-Specific and Boolean Operators

## Overview

The advanced search feature provides powerful search capabilities including field-specific searches, boolean operators (AND/OR/NOT), and parentheses for grouping. This allows for precise and complex queries to find exactly what you need.

## Basic Syntax

### Field-Specific Searches

Field-specific searches use the format: `field:value`

#### Supported Fields

- `title:` - Search only in item titles
- `content:` - Search only in item content
- `description:` - Search only in item descriptions
- `tags:` - Search only in item tags
- `type:` - Search only for specific item types

#### Examples

```bash
# Search for items with "authentication" in the title
search_items({ query: "title:authentication" })

# Search for items with "bug" in the content
search_items({ query: "content:bug" })

# Search for items with "security" tag
search_items({ query: "tags:security" })

# Search for only documentation items
search_items({ query: "type:docs" })
```

### Boolean Operators

#### AND Operator

- Explicit: `term1 AND term2`
- Implicit: `term1 term2` (space acts as AND)

```bash
# Both queries are equivalent
search_items({ query: "bug AND fix" })
search_items({ query: "bug fix" })

# Field-specific with AND
search_items({ query: "title:bug AND content:fix" })
```

#### OR Operator

Use `OR` to match either term:

```bash
# Find items with either "bug" OR "error"
search_items({ query: "bug OR error" })

# Field-specific with OR
search_items({ query: "title:bug OR title:error" })
```

#### NOT Operator / Negation

Use `NOT` or `-` prefix to exclude terms:

```bash
# Exclude items with "deprecated"
search_items({ query: "NOT deprecated" })
search_items({ query: "-deprecated" })

# Field-specific negation
search_items({ query: "-tags:deprecated" })
search_items({ query: "NOT tags:deprecated" })
```

### Operator Precedence

Operators are evaluated in this order (highest to lowest):
1. NOT / - (negation)
2. AND
3. OR

```bash
# This is evaluated as (bug AND fix) OR error
search_items({ query: "bug AND fix OR error" })

# This is evaluated as bug AND (fix OR error)
search_items({ query: "bug AND (fix OR error)" })
```

### Parentheses for Grouping

Use parentheses to control evaluation order:

```bash
# Find items with (bug OR error) AND critical
search_items({ query: "(bug OR error) AND critical" })

# Complex grouped query
search_items({ query: "(title:bug OR content:error) AND -tags:resolved" })
```

## Advanced Examples

### Mixed Field and Boolean Searches

```bash
# Find items with "security" anywhere AND "guide" in tags
search_items({ query: "security AND tags:guide" })

# Find items with "API" in title OR "authentication" in content
search_items({ query: "title:API OR content:authentication" })

# Complex query: bugs or errors in title, not resolved, high priority
search_items({ query: "(title:bug OR title:error) AND -tags:resolved AND tags:high-priority" })
```

### Quoted Values

Use quotes for multi-word values:

```bash
# Search for exact phrase "login system" in tags
search_items({ query: 'tags:"login system"' })

# Search for "bug fix" in title
search_items({ query: 'title:"bug fix"' })

# Combine quoted values with operators
search_items({ query: 'title:"bug fix" OR title:"error handling"' })
```

### Real-World Examples

```bash
# Find all open bugs in authentication module
search_items({ query: "type:issues AND tags:bug AND tags:authentication AND -tags:closed" })

# Find documentation about API or webhooks
search_items({ query: "type:docs AND (content:API OR content:webhook)" })

# Find high priority items that aren't assigned
search_items({ query: "tags:high-priority AND -tags:assigned" })

# Find items mentioning security in title or content, excluding tests
search_items({ query: "(title:security OR content:security) AND -type:test" })
```

## Implementation Details

- Uses FTS5 (Full-Text Search) for efficient searching
- Field-specific searches use FTS5 column filter syntax: `{field}:value`
- Boolean operators are converted to FTS5 query syntax
- The query parser builds an expression tree respecting operator precedence
- Backward compatibility is maintained for simple queries
- Invalid field names are treated as regular search terms

## Operators as Search Terms

To search for the literal words "AND", "OR", or "NOT", enclose them in quotes:

```bash
# Search for the word "AND" literally
search_items({ query: '"AND"' })

# Search for items about boolean logic
search_items({ query: '"AND" "OR" "NOT" boolean logic' })
```

## Case Sensitivity

- Operators (AND, OR, NOT) are case-insensitive
- Search terms are case-insensitive by default
- Field names must be lowercase

```bash
# All of these are equivalent
search_items({ query: "bug AND fix" })
search_items({ query: "bug and fix" })
search_items({ query: "bug And fix" })
```

## Future Enhancements

- Date range searches (e.g., `created:2025-01-01..2025-12-31`)
- Fuzzy search support
- Regular expression support
- Wildcard patterns beyond prefix matching