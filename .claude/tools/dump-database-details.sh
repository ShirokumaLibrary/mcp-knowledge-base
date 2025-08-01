#!/bin/bash

# Detailed database dump script for MCP Knowledge Base
# Usage: ./dump-database-details.sh [database]

DB="${1:-.shirokuma/data/search.db}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." &> /dev/null && pwd )"

# If relative path, make it absolute
if [[ ! "$DB" = /* ]]; then
    DB="$PROJECT_ROOT/$DB"
fi

echo "📊 Detailed Database Dump: $DB"
echo "================================"
echo ""

# Check if database exists
if [ ! -f "$DB" ]; then
    echo "❌ Database not found: $DB"
    exit 1
fi

# Items with content preview
echo "📝 Items with Content Preview:"
echo ""
sqlite3 "$DB" << 'EOF'
.mode column
.headers on
.width 10 15 50 10 10
SELECT 
    i.type || '-' || i.id as item_id,
    substr(i.title, 1, 50) as title_preview,
    i.priority,
    s.name as status,
    CASE 
        WHEN length(i.tags) > 0 THEN substr(i.tags, 1, 20) || '...'
        ELSE ''
    END as tags_preview
FROM items i
LEFT JOIN statuses s ON i.status_id = s.id
ORDER BY i.type, CAST(i.id AS INTEGER)
LIMIT 20;
EOF
echo ""

# Detailed related items
echo "🔗 Items with Relations:"
echo ""
sqlite3 "$DB" << 'EOF'
.mode column
.headers on
.width 15 60
SELECT 
    type || '-' || id as item_id,
    related
FROM items
WHERE related IS NOT NULL AND related != '[]'
ORDER BY type, CAST(id AS INTEGER);
EOF
echo ""

# Full content of a few items
echo "📄 Full Content Examples:"
echo ""
for TYPE in issues docs knowledge; do
    echo "=== $TYPE ==="
    sqlite3 "$DB" << EOF
.mode list
.separator "\n---\n"
SELECT 
    'ID: ' || id || char(10) ||
    'Title: ' || title || char(10) ||
    'Tags: ' || COALESCE(tags, 'none') || char(10) ||
    'Content (first 200 chars): ' || char(10) || 
    substr(content, 1, 200) || '...'
FROM items
WHERE type = '$TYPE'
LIMIT 1;
EOF
    echo ""
done

# Tags frequency
echo "🏷️  Tag Usage Frequency:"
echo ""
sqlite3 "$DB" << 'EOF'
SELECT 
    t.name as tag_name,
    COUNT(DISTINCT it.item_id) as usage_count
FROM tags t
LEFT JOIN item_tags it ON t.id = it.tag_id
GROUP BY t.name
ORDER BY usage_count DESC, t.name
LIMIT 20;
EOF
echo ""

# Date analysis
echo "📅 Date Fields Analysis:"
echo ""
sqlite3 "$DB" << 'EOF'
.mode column
.headers on
SELECT 
    type,
    COUNT(*) as total,
    COUNT(start_date) as with_start_date,
    COUNT(end_date) as with_end_date,
    MIN(start_date) as earliest_start,
    MAX(end_date) as latest_end
FROM items
GROUP BY type
HAVING COUNT(start_date) > 0 OR COUNT(end_date) > 0;
EOF
echo ""

# Unicode content analysis
echo "🌍 Unicode Content Analysis:"
echo ""
echo "Items with emoji:"
sqlite3 "$DB" "SELECT COUNT(*) FROM items WHERE content GLOB '*[😀-🙏]*' OR title GLOB '*[😀-🙏]*';"
echo ""
echo "Items with Japanese:"
sqlite3 "$DB" "SELECT COUNT(*) FROM items WHERE content GLOB '*[ぁ-ゟァ-ヿ]*' OR title GLOB '*[ぁ-ゟァ-ヿ]*';"
echo ""
echo "Sample Unicode content:"
sqlite3 "$DB" << 'EOF'
.mode list
SELECT 
    type || '-' || id || ': ' || 
    substr(title, 1, 50)
FROM items
WHERE content LIKE '%🎯%' 
   OR content LIKE '%こんにちは%'
   OR title LIKE '%🌍%'
LIMIT 5;
EOF
echo ""

# Metadata analysis
echo "📊 Metadata Statistics:"
echo ""
sqlite3 "$DB" << 'EOF'
.mode column
.headers on
SELECT 
    COUNT(*) as total_items,
    COUNT(DISTINCT type) as types,
    COUNT(DISTINCT status_id) as status_count,
    COUNT(DISTINCT priority) as priorities,
    AVG(LENGTH(content)) as avg_content_length,
    MAX(LENGTH(content)) as max_content_length
FROM items;
EOF
echo ""

# Check for potential issues
echo "⚠️  Potential Issues:"
echo ""
echo "Items without content:"
sqlite3 "$DB" "SELECT COUNT(*) FROM items WHERE content IS NULL OR content = '';"
echo ""
echo "Items without tags:"
sqlite3 "$DB" "SELECT COUNT(*) FROM items WHERE tags IS NULL OR tags = '[]';"
echo ""
echo "Orphaned tags (not used by any item):"
sqlite3 "$DB" << 'EOF'
SELECT t.name
FROM tags t
LEFT JOIN item_tags it ON t.id = it.tag_id
WHERE it.tag_id IS NULL;
EOF