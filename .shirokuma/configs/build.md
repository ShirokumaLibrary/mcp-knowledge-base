# SHIROKUMA Knowledge Base - Build Configuration

## Development Environment

### npm Scripts

```json
{
  "dev": "NODE_ENV=development tsx src/server.ts",
  "build": "tsc --build --clean && tsc --build --force tsconfig.prod.json",
  "start": "node dist/server.js",
  "test": "jest",
  "test:unit": "jest --testMatch='<rootDir>/src/**/*.test.ts'",
  "test:coverage": "jest --coverage",
  "test:integration": "jest tests/integration --runInBand",
  "test:e2e": "tsx tests/e2e/custom-runner.ts",
  "lint": "eslint src/",
  "lint:errors": "eslint src/ --quiet",
  "inspect": "npx @modelcontextprotocol/inspector node dist/server.js",
  "rebuild-db": "tsx src/rebuild-db.ts"
}
```

### Build Commands Reference

For use in agent configurations:
- **Build**: `npm run build` (includes TypeScript type checking)
- **Lint Check**: `npm run lint:errors` (shows only errors)
- **Type Check**: Included in build process
- **Test**: `npm test`
- **Coverage**: `npm run test:coverage`

## TypeScript Configuration

### Compiler Options

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "noImplicitAny": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "removeComments": true
  }
}
```

### TypeScript Standards
- **Version**: TypeScript 5.x
- **Target**: ES2022
- **Module System**: ESNext (ESM)
- **Strict Mode**: Enabled
- **Type Checking**: All strict flags enabled

## Quality Standards

### ESLint Configuration
- **40+ strict rules** including:
  - `no-explicit-any`: error
  - `filename-case`: kebab-case enforced
  - `explicit-function-return-type`: required
  - `no-console`: error (use logger instead)
  - `no-unused-vars`: error
  - `no-implicit-globals`: error

### Code Quality Metrics
- **Review Threshold**: 85/100
- **Test Coverage Target**: 80%
- **Max Complexity**: 10 (cyclomatic complexity)
- **Max Line Length**: 120 characters
- **Max File Length**: 500 lines

## Build Process

### Build Pipeline

```typescript
// Build configuration
export const buildConfig = {
  // Clean previous build
  clean: ['dist/**/*'],
  
  // TypeScript compilation
  compile: {
    src: 'src/**/*.ts',
    dest: 'dist',
    options: tsConfig.compilerOptions
  },
  
  // Copy static files
  copy: [
    { from: 'src/**/*.json', to: 'dist' },
    { from: 'README.md', to: 'dist' }
  ]
};
```

### Build Steps
1. **Clean**: Remove previous build artifacts
2. **Type Check**: Validate TypeScript types
3. **Compile**: Transpile TypeScript to JavaScript
4. **Generate**: Create declaration files (.d.ts)
5. **Copy**: Move static assets to dist

### Output Structure
```
dist/
├── application/          # Application layer
│   ├── handlers/        # Compiled handlers
│   └── services/        # Compiled services
├── config/              # Configuration files
├── database/            # Database layer
├── types/               # Type definitions
├── utils/               # Utilities
├── server.js            # Main entry point
├── cli.js              # CLI entry point
└── *.d.ts              # TypeScript declarations
```

## Development Workflow

### Git Hooks

```json
// .husky/pre-commit
{
  "scripts": {
    "pre-commit": "npm run lint:errors && npm run typecheck"
  }
}
```

### Pre-commit Checks
1. Run ESLint error check
2. Run TypeScript type checking
3. Ensure no console statements
4. Validate file naming conventions

### CI/CD Pipeline (Planned)
1. **Lint**: Check code quality
2. **Type Check**: Validate types
3. **Test**: Run unit tests
4. **Coverage**: Check test coverage
5. **Build**: Create production build
6. **Integration Test**: Run integration tests

## Performance Optimization

### Build Optimization
- **Incremental Compilation**: Enabled via tsBuildInfoFile
- **Source Maps**: Generated for debugging
- **Tree Shaking**: Via ESM modules
- **Minification**: Production builds only

### Bundle Analysis
- **Total Size**: ~72 compiled files
- **Entry Points**: server.js, cli.js
- **Dependencies**: Bundled separately
- **Code Splitting**: Not applicable (server-side)

## Debugging Configuration

### Source Maps
- **Development**: Inline source maps
- **Production**: External source map files
- **Debugging**: Full TypeScript debugging support

### VSCode Launch Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "skipFiles": ["<node_internals>/**"],
  "program": "${workspaceFolder}/src/server.ts",
  "preLaunchTask": "tsc: build",
  "outFiles": ["${workspaceFolder}/dist/**/*.js"],
  "sourceMaps": true
}
```

## Module Resolution

### Path Aliases (Future)
```json
{
  "paths": {
    "@/*": ["src/*"],
    "@handlers/*": ["src/handlers/*"],
    "@database/*": ["src/database/*"],
    "@types/*": ["src/types/*"],
    "@utils/*": ["src/utils/*"]
  }
}
```

### Import Conventions
- Use relative imports for local modules
- Use package imports for node_modules
- Prefer named exports over default exports
- Group imports by category (external, internal, types)