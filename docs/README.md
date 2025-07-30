# Shirokuma MCP Knowledge Base - Developer Documentation

This directory contains comprehensive documentation for developers working on the Shirokuma MCP Knowledge Base project.

## 📚 Documentation Index

### Core Development Documentation
- [Architecture](architecture.md) - System design and implementation details
- [Development Guide](development.md) - Development setup and guidelines
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project
- [Testing Guide](testing-guide.md) - Testing strategies and practices
- [E2E Testing Guide](e2e-testing-guide.md) - End-to-end testing with Playwright

### Technical References
- [API Documentation](api-documentation.md) - Internal API documentation
- [Database Schema](database-schema.md) - SQLite and file storage structure
- [Performance Guide](performance-optimization.md) - Performance tuning and optimization
- [Security Guide](security-guide.md) - Security best practices

### Guides and Examples
- [Examples](examples.md) - Code examples and usage patterns
- [Upgrade Guide](UPGRADE.md) - Migration instructions between versions
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
- [FAQ](FAQ.md) - Frequently asked questions

### User Documentation
User-facing documentation is located in:
- [User Documentation](user/) - English user documentation
- [日本語ドキュメント](ja/) - Japanese documentation

## 🔧 Development Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ShirokumaLibrary/mcp-knowledge-base.git
   cd mcp-knowledge-base
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm test              # Unit tests
   npm run test:e2e      # E2E tests
   npm run test:coverage # Coverage report
   ```

4. **Build the project**
   ```bash
   npm run build         # Production build
   npm run build:dev     # Development build
   ```

5. **Development mode**
   ```bash
   npm run dev           # Run with tsx
   npm run inspect       # Debug with MCP Inspector
   ```

## 📂 Documentation Structure

```
docs/
├── README.md                 # This file (developer index)
├── architecture.md          # System architecture
├── development.md           # Development guide
├── testing-guide.md         # Testing strategies
├── examples.md              # Usage examples
├── CONTRIBUTING.md          # Contribution guidelines
├── user/                    # User documentation
│   ├── api-reference.md     # MCP tools API
│   ├── usage-guide.md       # Getting started
│   └── configuration.md     # Configuration
└── ja/                      # Japanese translations
    ├── README.md
    ├── user-guide.md
    └── configuration.md
```

## 🤝 Contributing to Documentation

When contributing to documentation:

1. Follow the existing structure and formatting
2. Keep language clear and concise
3. Include code examples where appropriate
4. Update both English and Japanese versions if possible
5. Test all code examples before submitting

## 📝 Documentation Standards

- Use Markdown for all documentation
- Include a table of contents for long documents
- Use code blocks with appropriate language highlighting
- Keep line length under 120 characters
- Use semantic commit messages for documentation changes
- Follow the project's TypeScript and coding conventions

## 🧪 Test Coverage Status

- **Overall Coverage**: 79.3%
- **Functions Coverage**: 80.33% ✅
- **Total Tests**: 952 (all passing)
- **Test Suites**: 50

See [Testing Guide](testing-guide.md) for detailed testing documentation.

## 🔗 External Resources

- [MCP SDK Documentation](https://modelcontextprotocol.io)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)

## 📄 License

All documentation is licensed under the same MIT License as the project.