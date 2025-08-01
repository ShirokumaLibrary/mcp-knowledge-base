#!/bin/bash

# Database comparison script for MCP Knowledge Base
# Usage: ./compare-databases.sh [old_db] [new_db]

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." &> /dev/null && pwd )"

# Default paths relative to project root
OLD_DB="${1:-$PROJECT_ROOT/.shirokuma/data/search.db.backup}"
NEW_DB="${2:-$PROJECT_ROOT/.shirokuma/data/search.db}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📊 Database Comparison Report"
echo "================================"
echo "Old DB: $OLD_DB"
echo "New DB: $NEW_DB"
echo ""

# Check if databases exist
if [ ! -f "$OLD_DB" ]; then
    echo -e "${RED}❌ Old database not found: $OLD_DB${NC}"
    exit 1
fi

if [ ! -f "$NEW_DB" ]; then
    echo -e "${RED}❌ New database not found: $NEW_DB${NC}"
    exit 1
fi

# File sizes
echo "📁 File Sizes:"
echo -n "  Old: "
du -h "$OLD_DB" | cut -f1
echo -n "  New: "
du -h "$NEW_DB" | cut -f1
echo ""

# Schema comparison
echo "🔧 Schema Comparison:"
sqlite3 "$OLD_DB" ".schema" > /tmp/schema_old.sql
sqlite3 "$NEW_DB" ".schema" > /tmp/schema_new.sql
if diff -q /tmp/schema_old.sql /tmp/schema_new.sql > /dev/null; then
    echo -e "  ${GREEN}✅ Schemas are identical${NC}"
else
    echo -e "  ${RED}❌ Schema differences found:${NC}"
    diff /tmp/schema_old.sql /tmp/schema_new.sql
fi
echo ""

# Record counts
echo "📊 Record Counts:"
OLD_COUNT=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM items;")
NEW_COUNT=$(sqlite3 "$NEW_DB" "SELECT COUNT(*) FROM items;")
echo "  Total items - Old: $OLD_COUNT, New: $NEW_COUNT"
if [ "$OLD_COUNT" -eq "$NEW_COUNT" ]; then
    echo -e "  ${GREEN}✅ Same number of items${NC}"
elif [ "$OLD_COUNT" -gt "$NEW_COUNT" ]; then
    echo -e "  ${YELLOW}⚠️  $(($OLD_COUNT - $NEW_COUNT)) items removed${NC}"
else
    echo -e "  ${YELLOW}⚠️  $(($NEW_COUNT - $OLD_COUNT)) items added${NC}"
fi
echo ""

# Count by type
echo "📋 Items by Type:"
echo "  Old database:"
sqlite3 "$OLD_DB" "SELECT '    ' || type || ': ' || COUNT(*) FROM items GROUP BY type ORDER BY type;"
echo "  New database:"
sqlite3 "$NEW_DB" "SELECT '    ' || type || ': ' || COUNT(*) FROM items GROUP BY type ORDER BY type;"
echo ""

# Missing/Added items
echo "🔍 Item Differences:"
sqlite3 "$OLD_DB" "SELECT type || '-' || id FROM items ORDER BY type, CAST(id AS INTEGER);" > /tmp/items_old.txt
sqlite3 "$NEW_DB" "SELECT type || '-' || id FROM items ORDER BY type, CAST(id AS INTEGER);" > /tmp/items_new.txt

MISSING=$(comm -23 /tmp/items_old.txt /tmp/items_new.txt)
ADDED=$(comm -13 /tmp/items_old.txt /tmp/items_new.txt)

if [ -z "$MISSING" ]; then
    echo -e "  ${GREEN}✅ No items missing${NC}"
else
    echo -e "  ${YELLOW}⚠️  Missing items:${NC}"
    echo "$MISSING" | sed 's/^/    /'
fi

if [ -z "$ADDED" ]; then
    echo -e "  ${GREEN}✅ No new items${NC}"
else
    echo -e "  ${YELLOW}⚠️  Added items:${NC}"
    echo "$ADDED" | sed 's/^/    /'
fi
echo ""

# Sequences comparison
echo "🔢 Sequences:"
echo "  Old sequences:"
sqlite3 "$OLD_DB" "SELECT '    ' || type || ': ' || current_value || ' (base: ' || base_type || ')' FROM sequences ORDER BY type;"
echo "  New sequences:"
sqlite3 "$NEW_DB" "SELECT '    ' || type || ': ' || current_value || ' (base: ' || base_type || ')' FROM sequences ORDER BY type;"
echo ""

# Tags comparison
echo "🏷️  Tags:"
OLD_TAG_COUNT=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM tags;")
NEW_TAG_COUNT=$(sqlite3 "$NEW_DB" "SELECT COUNT(*) FROM tags;")
echo "  Count - Old: $OLD_TAG_COUNT, New: $NEW_TAG_COUNT"

sqlite3 "$OLD_DB" "SELECT name FROM tags ORDER BY name;" > /tmp/tags_old.txt
sqlite3 "$NEW_DB" "SELECT name FROM tags ORDER BY name;" > /tmp/tags_new.txt

MISSING_TAGS=$(comm -23 /tmp/tags_old.txt /tmp/tags_new.txt)
ADDED_TAGS=$(comm -13 /tmp/tags_old.txt /tmp/tags_new.txt)

if [ -n "$MISSING_TAGS" ]; then
    echo -e "  ${YELLOW}⚠️  Missing tags:${NC}"
    echo "$MISSING_TAGS" | sed 's/^/    /'
fi

if [ -n "$ADDED_TAGS" ]; then
    echo -e "  ${YELLOW}⚠️  Added tags:${NC}"
    echo "$ADDED_TAGS" | sed 's/^/    /'
fi
echo ""

# FTS index
echo "🔍 Search Index:"
OLD_FTS=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM items_fts;")
NEW_FTS=$(sqlite3 "$NEW_DB" "SELECT COUNT(*) FROM items_fts;")
echo "  FTS entries - Old: $OLD_FTS, New: $NEW_FTS"
if [ "$OLD_FTS" -eq "$OLD_COUNT" ] && [ "$NEW_FTS" -eq "$NEW_COUNT" ]; then
    echo -e "  ${GREEN}✅ FTS indexes match item counts${NC}"
else
    echo -e "  ${RED}❌ FTS index mismatch${NC}"
fi
echo ""

# Detailed content comparison
echo "📝 Content Comparison (sample):"
echo "  Comparing random items..."
# Get a sample item from each type
for TYPE in issues docs; do
    SAMPLE_ID=$(sqlite3 "$NEW_DB" "SELECT id FROM items WHERE type='$TYPE' LIMIT 1;")
    if [ -n "$SAMPLE_ID" ]; then
        echo ""
        echo "  Type: $TYPE, ID: $SAMPLE_ID"
        # Join with statuses table to get status name
        OLD_CONTENT=$(sqlite3 "$OLD_DB" "SELECT i.title, i.priority, s.name FROM items i LEFT JOIN statuses s ON i.status_id = s.id WHERE i.type='$TYPE' AND i.id='$SAMPLE_ID';")
        NEW_CONTENT=$(sqlite3 "$NEW_DB" "SELECT i.title, i.priority, s.name FROM items i LEFT JOIN statuses s ON i.status_id = s.id WHERE i.type='$TYPE' AND i.id='$SAMPLE_ID';")
        if [ "$OLD_CONTENT" = "$NEW_CONTENT" ]; then
            echo -e "  ${GREEN}✅ Content matches${NC}"
        else
            echo -e "  ${RED}❌ Content differs${NC}"
            echo "    Old: $OLD_CONTENT"
            echo "    New: $NEW_CONTENT"
        fi
    fi
done
echo ""

# Related items check
echo "🔗 Related Items Validation:"
OLD_RELATED=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM items WHERE related IS NOT NULL AND related != '[]';")
NEW_RELATED=$(sqlite3 "$NEW_DB" "SELECT COUNT(*) FROM items WHERE related IS NOT NULL AND related != '[]';")
echo "  Items with relations - Old: $OLD_RELATED, New: $NEW_RELATED"

# Check a specific item with relations
RELATED_ITEM=$(sqlite3 "$NEW_DB" "SELECT type || '-' || id FROM items WHERE related IS NOT NULL AND related != '[]' LIMIT 1;")
if [ -n "$RELATED_ITEM" ]; then
    echo "  Sample: $RELATED_ITEM"
    OLD_REL=$(sqlite3 "$OLD_DB" "SELECT related FROM items WHERE type || '-' || id = '$RELATED_ITEM';")
    NEW_REL=$(sqlite3 "$NEW_DB" "SELECT related FROM items WHERE type || '-' || id = '$RELATED_ITEM';")
    if [ "$OLD_REL" = "$NEW_REL" ]; then
        echo -e "  ${GREEN}✅ Relations preserved${NC}"
    else
        echo -e "  ${RED}❌ Relations changed${NC}"
        echo "    Old: $OLD_REL"
        echo "    New: $NEW_REL"
    fi
fi
echo ""

# Date fields check
echo "📅 Date Fields Check:"
sqlite3 "$NEW_DB" "SELECT type, COUNT(*) as count FROM items WHERE start_date IS NOT NULL OR end_date IS NOT NULL GROUP BY type;" | while read line; do
    echo "  $line"
done
echo ""

# Unicode content check
echo "🌍 Unicode Content Check:"
UNICODE_COUNT=$(sqlite3 "$NEW_DB" "SELECT COUNT(*) FROM items WHERE content LIKE '%こんにちは%' OR content LIKE '%🎯%' OR content LIKE '%мир%';")
echo "  Items with Unicode content: $UNICODE_COUNT"
echo ""

# Detailed Status Usage
echo "📊 Status Usage:"
echo "  Old database:"
sqlite3 "$OLD_DB" "SELECT s.name || ': ' || COUNT(*) FROM items i JOIN statuses s ON i.status_id = s.id GROUP BY s.name ORDER BY s.name;" | sed 's/^/    /'
echo "  New database:"
sqlite3 "$NEW_DB" "SELECT s.name || ': ' || COUNT(*) FROM items i JOIN statuses s ON i.status_id = s.id GROUP BY s.name ORDER BY s.name;" | sed 's/^/    /'
echo ""

# Priority Distribution
echo "⭐ Priority Distribution:"
echo "  Old database:"
sqlite3 "$OLD_DB" "SELECT priority || ': ' || COUNT(*) FROM items WHERE priority IS NOT NULL GROUP BY priority ORDER BY priority;" | sed 's/^/    /'
echo "  New database:"
sqlite3 "$NEW_DB" "SELECT priority || ': ' || COUNT(*) FROM items WHERE priority IS NOT NULL GROUP BY priority ORDER BY priority;" | sed 's/^/    /'
echo ""

# Summary
echo "📌 Summary:"
if [ "$OLD_COUNT" -eq "$NEW_COUNT" ] && [ -z "$MISSING" ] && [ -z "$ADDED" ]; then
    echo -e "  ${GREEN}✅ Databases are functionally identical${NC}"
else
    echo -e "  ${YELLOW}⚠️  Databases have differences (see above)${NC}"
fi

# Cleanup
rm -f /tmp/schema_old.sql /tmp/schema_new.sql /tmp/items_old.txt /tmp/items_new.txt /tmp/tags_old.txt /tmp/tags_new.txt