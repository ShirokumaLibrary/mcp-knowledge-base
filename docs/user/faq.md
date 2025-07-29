# Frequently Asked Questions (FAQ)

## General Questions

### Q: What is Shirokuma MCP Knowledge Base?

A: It's a knowledge management system that implements MCP (Model Context Protocol). You can manage issues, plans, documents, knowledge, work sessions, and more in an integrated manner.

### Q: What types of data can I manage?

A: You can manage the following types of data:
- **Issues**: Bug and issue tracking
- **Plans**: Project plans and tasks
- **Docs**: Technical documents and guides
- **Knowledge**: Knowledge base articles
- **Sessions**: Work session records
- **Dailies**: Daily summaries
- **Custom types**: Your own content types

### Q: Where is the data stored?

A: By default, data is stored in the `.shirokuma/data` directory. Data is saved in two formats:
- **Markdown files**: Persistent data storage
- **SQLite**: Index for fast searching

## Setup Questions

### Q: MCP client cannot connect

A: Please check the following:
1. Is the server built? Run `npm run build`
2. Is the path correct? Use absolute paths
3. Is Node.js version 18 or higher? Check with `node --version`

### Q: I want to change the data directory

A: Set the environment variable:
```bash
export MCP_DATABASE_PATH=/your/custom/path
```

## Usage Questions

### Q: Can it handle large amounts of data?

A: Yes, it's optimized for large-scale data with:
- Fast full-text search using SQLite FTS5
- Efficient import through batch processing
- Fast queries with indexing

### Q: Can I import existing Markdown files?

A: Yes, place properly formatted Markdown files in the appropriate directory and run `npm run rebuild-db` to import them.

### Q: What's the maximum number of tags?

A: There's no limit, but we recommend 10-20 tags per item for performance reasons.

## Troubleshooting

### Q: Getting "Database locked" error

A: Try the following:
1. Check if other processes are using the database
2. Rebuild the database with `npm run rebuild-db`
3. Check SQLite file permissions

### Q: Search results not showing

A: Please check:
1. Is the database up to date? Run `npm run rebuild-db`
2. Is the search query syntax correct?
3. Are the indexes created?

### Q: Markdown files not recognized

A: Check the file format:
- Filename: `{type}-{id}.md` (e.g., `issues-1.md`)
- Frontmatter: JSON format with required fields
- Encoding: UTF-8

## Performance

### Q: Slow performance

A: Try the following:
1. Optimize database: `npm run rebuild-db`
2. Delete unnecessary data
3. Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`

### Q: High memory usage

A: When handling large amounts of data, use batch processing and pagination.

## Security

### Q: Is my data secure?

A: We implement the following security measures:
- Input sanitization
- Path traversal attack prevention
- SQL injection protection
- Rate limiting

### Q: How should I backup?

A: Backup the entire `.shirokuma/data` directory. Since Markdown files are the source of truth, you can fully restore from these files.

## Other

### Q: What's the license?

A: MIT License. Commercial use is allowed.

### Q: Is there support?

A: We provide support through GitHub Issues. Community support is also active.

### Q: I want to contribute

A: Please see the [Contribution Guide](../developer/contributing.md). Pull Requests are welcome!