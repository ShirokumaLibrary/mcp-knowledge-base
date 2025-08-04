# Shirokuma MCP Knowledge Base - Documentation

> Last Updated: 2025-08-03 (v0.7.8)

Comprehensive documentation for users and developers of the Shirokuma MCP Knowledge Base.

## 📚 Documentation Structure

### 👥 User Documentation

**English:**
- [API Reference](user/api-reference.md) - Complete MCP tools reference
- [Quick Start Guide](user/quickstart.md) - Get started in 5 minutes
- [Usage Guide](user/usage.md) - Practical examples and patterns
- [Installation Guide](user/installation.md) - Detailed setup instructions
- [FAQ](user/faq.md) - Frequently asked questions

**日本語 (Japanese):**
- [README](ja/README.md) - プロジェクト概要
- [API リファレンス](ja/user/api-reference.md) - MCP ツール完全ガイド
- [クイックスタート](ja/user/quickstart.md) - 5分で始める
- [インストールガイド](ja/user/installation.md) - 詳細なセットアップ手順
- [使い方ガイド](ja/user/usage.md) - 実用的な例とパターン
- [FAQ](ja/user/faq.md) - よくある質問

### 🛠️ Developer Documentation

**Architecture & Design:**
- [Architecture Overview](developer/architecture.md) - System design and structure
- [Database Design](developer/database-design.md) - SQLite schema and storage
- [Type System](developer/type-system.md) - Dynamic type system implementation
- [API Architecture](developer/api-architecture.md) - MCP API design patterns

**Development:**
- [Development Setup](developer/setup.md) - Environment setup guide
- [Testing Guide](developer/testing-guide.md) - Unit and integration testing
- [E2E Testing](developer/e2e-testing.md) - End-to-end testing with Playwright
- [Contributing](developer/contributing.md) - Contribution guidelines
- [Debugging Guide](developer/debugging.md) - Debugging tips and tools

**Advanced Topics:**
- [Performance](developer/performance.md) - Optimization strategies
- [Security](developer/security.md) - Security best practices
- [Migration Guide](developer/migration.md) - Version migration instructions
- [Versioning](developer/versioning.md) - Version management strategy

### 📁 Additional Resources

**Examples:**
- [Type Usage Examples](examples/type-usage-examples.md) - Custom type patterns
- [Field-Specific Search](field-specific-search.md) - Advanced search techniques

**Maintenance:**
- [Test Environment](TEST_ENVIRONMENT.md) - Test setup and configuration
- [Upgrade Guide](UPGRADE.md) - Version upgrade instructions
- [API Documentation](API.md) - Internal API reference

**Internal Documentation:**
- [Internal Docs](internal/) - Team-specific documentation
- [Release Notes](releases/) - Version history and migration guides

## 🚀 Quick Links

### For New Users
1. Start with [Quick Start Guide](user/quickstart.md)
2. Review [API Reference](user/api-reference.md)
3. Explore [Usage Examples](user/usage.md)

### For Developers
1. Set up with [Development Setup](developer/setup.md)
2. Understand [Architecture](developer/architecture.md)
3. Follow [Testing Guide](developer/testing-guide.md)

### For Contributors
1. Read [Contributing Guidelines](developer/contributing.md)
2. Check [Type System](developer/type-system.md)
3. Review [API Architecture](developer/api-architecture.md)

## 🔍 Finding Documentation

### By Topic

**Getting Started:**
- Installation → [user/installation.md](user/installation.md)
- First steps → [user/quickstart.md](user/quickstart.md)
- Examples → [user/usage.md](user/usage.md)

**API & Features:**
- MCP Tools → [user/api-reference.md](user/api-reference.md)
- Code Search → [user/usage.md#code-search](user/usage.md#code-search)
- Custom Types → [developer/type-system.md](developer/type-system.md)

**Development:**
- Architecture → [developer/architecture.md](developer/architecture.md)
- Testing → [developer/testing-guide.md](developer/testing-guide.md)
- Contributing → [developer/contributing.md](developer/contributing.md)

**Troubleshooting:**
- Common issues → [user/faq.md](user/faq.md)
- Debugging → [developer/debugging.md](developer/debugging.md)
- Upgrades → [UPGRADE.md](UPGRADE.md)

## 📝 Documentation Standards

### Writing Guidelines

1. **Structure**
   - Start with "Last Updated" timestamp
   - Include clear headings and subheadings
   - Add code examples for all features
   - Use tables for complex comparisons

2. **Code Examples**
   - Use realistic, practical examples
   - Include error handling where appropriate
   - Show both simple and advanced usage
   - Test all examples before committing

3. **Language**
   - Keep explanations concise and clear
   - Define technical terms on first use
   - Use active voice
   - Maintain consistent terminology

4. **Formatting**
   - Use proper Markdown syntax
   - Highlight important notes with `> Note:`
   - Use emoji sparingly for section headers
   - Keep line length under 120 characters

## 📊 Project Status

### Current Version
- **Latest Release**: v0.7.8
- **npm Package**: [@shirokuma-library/mcp-knowledge-base](https://www.npmjs.com/package/@shirokuma-library/mcp-knowledge-base)

### Test Coverage
- **Overall**: ~80%
- **Critical paths**: 100%
- **Test suites**: 50+
- **Total tests**: 950+

See [Testing Guide](developer/testing-guide.md) for details.

## 🔗 Resources

### External Links
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification
- [GitHub Repository](https://github.com/ShirokumaLibrary/mcp-knowledge-base) - Source code
- [npm Package](https://www.npmjs.com/package/@shirokuma-library/mcp-knowledge-base) - Latest releases
- [Issue Tracker](https://github.com/ShirokumaLibrary/mcp-knowledge-base/issues) - Bug reports

### Technologies Used
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [SQLite](https://www.sqlite.org/) - Embedded database
- [Jest](https://jestjs.io/) - Testing framework
- [Playwright](https://playwright.dev/) - E2E testing

---

**License**: MIT | **Contact**: shirokuma@gadget.to