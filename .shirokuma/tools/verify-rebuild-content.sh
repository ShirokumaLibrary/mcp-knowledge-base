#!/bin/bash

# Content verification script for MCP Knowledge Base rebuild
# Usage: ./verify-rebuild-content.sh [old_db] [new_db]

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

echo "📋 Content Verification Report"
echo "================================"
echo ""

# Check if databases exist
if [ ! -f "$OLD_DB" ] || [ ! -f "$NEW_DB" ]; then
    echo -e "${RED}❌ Database files not found${NC}"
    exit 1
fi

# Compare each item's content
echo "🔍 Comparing item content..."
echo ""

# Get all items from both databases
sqlite3 "$OLD_DB" "SELECT type || '|' || id FROM items ORDER BY type, CAST(id AS INTEGER);" > /tmp/old_items.txt
sqlite3 "$NEW_DB" "SELECT type || '|' || id FROM items ORDER BY type, CAST(id AS INTEGER);" > /tmp/new_items.txt

# Track differences
DIFF_COUNT=0
MATCH_COUNT=0

# Compare each item
while IFS='|' read -r type id; do
    # Get content from both databases
    OLD_CONTENT=$(sqlite3 "$OLD_DB" "SELECT 
        title || '|' || 
        COALESCE(description, '') || '|' || 
        COALESCE(content, '') || '|' || 
        COALESCE(priority, '') || '|' || 
        COALESCE(tags, '[]') || '|' || 
        COALESCE(related, '[]') || '|' || 
        COALESCE(start_date, '') || '|' || 
        COALESCE(end_date, '')
        FROM items WHERE type='$type' AND id='$id';")
    
    NEW_CONTENT=$(sqlite3 "$NEW_DB" "SELECT 
        title || '|' || 
        COALESCE(description, '') || '|' || 
        COALESCE(content, '') || '|' || 
        COALESCE(priority, '') || '|' || 
        COALESCE(tags, '[]') || '|' || 
        COALESCE(related, '[]') || '|' || 
        COALESCE(start_date, '') || '|' || 
        COALESCE(end_date, '')
        FROM items WHERE type='$type' AND id='$id';")
    
    if [ "$OLD_CONTENT" = "$NEW_CONTENT" ]; then
        ((MATCH_COUNT++))
    else
        ((DIFF_COUNT++))
        echo -e "${YELLOW}⚠️  Content differs for $type-$id${NC}"
        
        # Parse and show differences
        IFS='|' read -r old_title old_desc old_content old_priority old_tags old_related old_start old_end <<< "$OLD_CONTENT"
        IFS='|' read -r new_title new_desc new_content new_priority new_tags new_related new_start new_end <<< "$NEW_CONTENT"
        
        [ "$old_title" != "$new_title" ] && echo "  Title changed"
        [ "$old_desc" != "$new_desc" ] && echo "  Description changed"
        [ "$old_content" != "$new_content" ] && echo "  Content changed (length: ${#old_content} → ${#new_content})"
        [ "$old_priority" != "$new_priority" ] && echo "  Priority changed: $old_priority → $new_priority"
        [ "$old_tags" != "$new_tags" ] && echo "  Tags changed"
        [ "$old_related" != "$new_related" ] && echo "  Related items changed"
        [ "$old_start" != "$new_start" ] && echo "  Start date changed: $old_start → $new_start"
        [ "$old_end" != "$new_end" ] && echo "  End date changed: $old_end → $new_end"
        echo ""
    fi
done < /tmp/new_items.txt

echo "📊 Summary:"
echo "  Matching items: $MATCH_COUNT"
echo "  Different items: $DIFF_COUNT"
echo ""

if [ $DIFF_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ All item content is identical${NC}"
else
    echo -e "${YELLOW}⚠️  Found $DIFF_COUNT items with differences${NC}"
fi

# Check tag associations
echo ""
echo "🏷️  Verifying tag associations..."
OLD_TAG_ASSOC=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM item_tags;")
NEW_TAG_ASSOC=$(sqlite3 "$NEW_DB" "SELECT COUNT(*) FROM item_tags;")
echo "  Tag associations - Old: $OLD_TAG_ASSOC, New: $NEW_TAG_ASSOC"

if [ "$OLD_TAG_ASSOC" -eq "$NEW_TAG_ASSOC" ]; then
    echo -e "  ${GREEN}✅ Tag associations preserved${NC}"
else
    echo -e "  ${YELLOW}⚠️  Tag association count differs${NC}"
fi

# Check related_items table
echo ""
echo "🔗 Verifying related_items table..."
OLD_REL_COUNT=$(sqlite3 "$OLD_DB" "SELECT COUNT(*) FROM related_items;")
NEW_REL_COUNT=$(sqlite3 "$NEW_DB" "SELECT COUNT(*) FROM related_items;")
echo "  Related items entries - Old: $OLD_REL_COUNT, New: $NEW_REL_COUNT"

if [ "$OLD_REL_COUNT" -eq "$NEW_REL_COUNT" ]; then
    echo -e "  ${GREEN}✅ Related items preserved${NC}"
else
    echo -e "  ${YELLOW}⚠️  Related items count differs${NC}"
fi

# Cleanup
rm -f /tmp/old_items.txt /tmp/new_items.txt