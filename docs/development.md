# Development Guide

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- TypeScript 5.7+

### Installation
```bash
git clone <repository-url>
cd mcp
npm install
```

## Development Commands

### Development Mode
```bash
npm run dev
```

### Building
```bash
npm run build
```

### Testing
```bash
npm test                    # Run all tests
npm test -- --coverage      # Run with coverage report
npm test -- --watch         # Watch mode for development
```

### Production
```bash
npm run build
npm start
```

## Environment Variables

- `MCP_DATABASE_PATH` - Database directory path
- `MCP_SQLITE_PATH` - SQLite database file path
- `MCP_LOG_LEVEL` - Logging level (error, warn, info, debug)
- `MCP_LOGGING_ENABLED` - Enable/disable logging (true/false)

## Project Structure

```
src/
├── __tests__/           # Test files
├── database/            # Database layer
│   ├── facades/         # Feature-specific facades
│   └── repositories/    # Data repositories
├── handlers/            # Request handlers
├── schemas/             # Zod validation schemas
├── types/               # TypeScript definitions
├── utils/               # Utility functions
└── server.ts            # Entry point
```

## Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Jest for testing
- No comments unless absolutely necessary
- English only for all code and documentation

## Contributing

1. Create feature branch
2. Write tests first (TDD)
3. Implement feature
4. Ensure all tests pass
5. Run lint and build
6. Submit PR

## Debugging

### Logging
Configure logging with environment variables:
```bash
MCP_LOGGING_ENABLED=true MCP_LOG_LEVEL=debug npm run dev
```

### Common Issues

1. **EventEmitter memory leak warnings**
   - Already fixed with proper listener limits
   - Check `jest.setup.ts` and `logger.ts`

2. **Type errors**
   - Run `npm run build` to check TypeScript compilation
   - Ensure strict mode compliance

3. **Test failures**
   - Check file permissions
   - Ensure clean test environment
   - Run individual test files for debugging