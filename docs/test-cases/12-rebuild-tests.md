# 12. Database Rebuild Tests

This test suite verifies database rebuild functionality from markdown files.

## ⚠️ Important Note
**Database rebuild (`npm run rebuild-db`) will disconnect all active MCP connections**. After running the rebuild:
- The MCP server needs to be restarted
- All API connections will be lost
- You cannot perform MCP API tests immediately after rebuild
- SQLite database verification must be done via command line

## 12.1 Manual Database Verification

**Note**: This requires command line access, not MCP. These tests verify that the rebuild process correctly reconstructs the database from markdown files.

### Pre-rebuild verification
- [ ] Note current item counts and IDs
- [ ] Note all tags in the system
- [ ] Note session and summary data
- [ ] Create database backup

### Database Backup
Create a backup of the current database before rebuild:
```bash
# Navigate to data directory
cd .shirokuma/data

# Create backup with timestamp
cp search.db search.db.backup-$(date +%Y%m%d-%H%M%S)

# Verify backup was created
ls -la search.db*
```

### SQLite Database Verification (Pre-rebuild)
Execute these commands to inspect and export the database state:
```bash
# Open SQLite database
sqlite3 search.db

# Check items table
.headers on
.mode column
SELECT type, COUNT(*) as count FROM items GROUP BY type;
SELECT id, type, title, status FROM items WHERE type = 'issues' ORDER BY CAST(id AS INTEGER);

# Check sequences table
SELECT * FROM sequences ORDER BY type;

# Check tags table
SELECT COUNT(*) as total_tags FROM tags;
SELECT name FROM tags ORDER BY name LIMIT 10;

# Check statuses table
SELECT * FROM statuses ORDER BY id;

# Check sessions table
SELECT COUNT(*) as total_sessions FROM sessions;
SELECT id, title, created_at FROM sessions ORDER BY created_at DESC LIMIT 5;

# Check summaries table
SELECT date, title FROM summaries ORDER BY date;

# Export data for comparison
.output pre-rebuild-data.sql
.dump
.output stdout

# Exit SQLite
.quit
```

### Execute rebuild
- [ ] Execute `npm run rebuild-db` (if you have shell access)
- [ ] Monitor output for any errors or warnings

### SQLite Database Verification (Post-rebuild)
Execute the same SQLite commands as above to verify:
```bash
cd .shirokuma/data
sqlite3 search.db

# Verify items are restored
SELECT type, COUNT(*) as count FROM items GROUP BY type;

# Verify sequences maintain highest ID
SELECT * FROM sequences ORDER BY type;

# Verify all tags are re-registered
SELECT COUNT(*) as total_tags FROM tags;

# Verify statuses are restored with correct is_closed flags
SELECT * FROM statuses ORDER BY id;

# Verify custom types are preserved
SELECT * FROM sequences WHERE type NOT IN ('issues', 'plans', 'docs', 'knowledge');

# Check FTS5 search index
SELECT COUNT(*) FROM search_items;
SELECT COUNT(*) FROM search_sessions;
SELECT COUNT(*) FROM search_summaries;

# Export post-rebuild data
.output post-rebuild-data.sql
.dump
.output stdout

.quit
```

### Database Comparison
Compare the database before and after rebuild:
```bash
# Compare database structures and data
diff -u pre-rebuild-data.sql post-rebuild-data.sql > rebuild-diff.txt

# Check if there are any significant differences
if [ -s rebuild-diff.txt ]; then
    echo "Differences found between pre and post rebuild:"
    # Show only the first 50 lines of differences
    head -50 rebuild-diff.txt
else
    echo "No differences found - database rebuilt successfully!"
fi

# Alternative: Use SQLite to compare specific tables
sqlite3 search.db.backup-* "SELECT * FROM items ORDER BY type, id" > pre-items.txt
sqlite3 search.db "SELECT * FROM items ORDER BY type, id" > post-items.txt
diff -u pre-items.txt post-items.txt

# Compare sequences (important for ID generation)
sqlite3 search.db.backup-* "SELECT * FROM sequences ORDER BY type" > pre-sequences.txt
sqlite3 search.db "SELECT * FROM sequences ORDER BY type" > post-sequences.txt
diff -u pre-sequences.txt post-sequences.txt
```

### Post-rebuild verification via MCP (Optional - Requires User Action)

**⚠️ Important**: 
- Database rebuild terminates all MCP connections permanently
- MCP API tests are **not possible** without server restart
- SQLite3 command verification is sufficient for rebuild testing

**🔄 User Action Required**:
After completing the database comparison above, if all tests pass:
1. **Notify the user**: "Database rebuild test completed successfully. No problematic differences found. Please restart the MCP server to continue."
2. **Wait for user confirmation** before proceeding with any MCP API tests
3. **Do not attempt** any MCP API calls until the user confirms the server has been restarted
  
**Note to tester**: The rebuild test is considered complete after SQLite3 verification. The following MCP API tests are optional and require user intervention.

#### Verify all data is restored (Only after server restart by user)
- [ ] Get issues: `mcp__shirokuma-knowledge-base__get_items(type: "issues", includeClosedStatuses: true)`  
      Expected: All issues are restored with correct data

- [ ] Get plans: `mcp__shirokuma-knowledge-base__get_items(type: "plans")`  
      Expected: All plans are restored

- [ ] Get documents: `mcp__shirokuma-knowledge-base__get_items(type: "docs")`  
      Expected: All documents are restored

- [ ] Get knowledge: `mcp__shirokuma-knowledge-base__get_items(type: "knowledge")`  
      Expected: All knowledge entries are restored

#### Verify statuses
- [ ] Get statuses: `mcp__shirokuma-knowledge-base__get_statuses()`  
      Expected: Default statuses are restored with correct is_closed flags

- [ ] Verify custom statuses: Check if any custom status names in markdown files are noted in rebuild output

#### Verify sessions and summaries
- [ ] Get sessions: `mcp__shirokuma-knowledge-base__get_sessions()`  
      Expected: All sessions are correctly restored

- [ ] Get summaries: `mcp__shirokuma-knowledge-base__get_summaries(start_date: "2025-07-24", end_date: "2025-07-26")`  
      Expected: All summaries are correctly restored

#### Verify tags
- [ ] Get tags: `mcp__shirokuma-knowledge-base__get_tags()`  
      Expected: All tags from markdown files are registered (except deleted ones)

#### Verify data integrity
- [ ] Check a specific issue detail: `mcp__shirokuma-knowledge-base__get_item_detail(type: "issues", id: "4")`  
      Expected: All fields match pre-rebuild state

- [ ] Check status names: Verify issues show status names (not IDs)  
      Expected: Status field contains "Open", "Closed", etc.

### Sequence preservation (After MCP server restart)
- [ ] Create new item after rebuild:
```
mcp__shirokuma-knowledge-base__create_item(
  type: "issues",
  title: "Post-rebuild Test Issue",
  content: "Testing ID sequence after rebuild",
  priority: "low",
  status: "Open"
)
```
Expected: New issue gets ID "10" (continues from highest existing ID)

### Tag ID preservation (After MCP server restart)
- [ ] Create new tag: `mcp__shirokuma-knowledge-base__create_tag(name: "post-rebuild-tag")`  
      Expected: Success with continuous tag ID (no gaps from rebuild)

## 12.2 Rebuild Process Summary

### Standard Testing Process (Recommended)
1. **Pre-rebuild**: Record current state via MCP API
2. **Execute rebuild**: Run `npm run rebuild-db` (terminates MCP connections)
3. **SQLite verification**: Use sqlite3 commands to verify database state
4. **Test complete**: SQLite verification is sufficient for rebuild validation

### Extended Testing Process (Optional - Requires User Action)
If MCP API verification is needed after rebuild:
1. Complete standard testing process above
2. **Request user assistance**: "The database rebuild is complete and verified via SQLite. To perform additional MCP API tests, please restart the MCP server."
3. Wait for user to restart the server
4. Perform post-rebuild API tests

## Known Issues During Rebuild

- Database file permissions may change (becomes read-only)
- Custom type base_type may be incorrectly set during rebuild
- MCP connections are terminated permanently (cannot be restored without server restart)
- Some tags may be consolidated if duplicates existed
- The rebuild process is destructive to active connections

## Test Completion Criteria

The rebuild test is considered **successfully completed** when:
- ✅ Pre-rebuild state is documented
- ✅ Database backup is created with timestamp
- ✅ Rebuild executes without errors
- ✅ SQLite3 verification confirms data integrity
- ✅ Database comparison shows no problematic differences
- ✅ Sequences are preserved with correct max IDs
- ✅ Tags are re-registered from markdown files
- ✅ Statuses are restored with correct is_closed flags
- ✅ User is notified to restart the MCP server

MCP API verification is **not required** for test completion but can be performed if the user restarts the server.

## Expected Differences

The following differences in the database comparison are **normal and expected**:
- Timestamp fields (created_at, updated_at) may have minor formatting differences
- Row order within tables may change
- SQLite internal metadata (sqlite_sequence) may differ
- FTS5 index internal structures may be reorganized

**Problematic differences** that require investigation:
- Missing records in any table
- Changed ID values for existing records
- Modified content or field values
- Incorrect sequence current_value
- Missing or extra tags