import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test settings
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/index.ts',
        'src/types/**',
        'dist/**',
        'node_modules/**'
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 90,
        lines: 80
      }
    },
    
    // Test file patterns
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts'
    ],
    
    // Files to exclude from tests
    exclude: [
      'node_modules/**',
      'dist/**',
      '.shirokuma/**',
      'prisma/**'
    ],
    
    // Watch mode settings
    watchExclude: [
      'node_modules/**',
      'dist/**',
      '.shirokuma/**'
    ],
    
    // Timeout for each test
    testTimeout: 10000,
    
    // Mock and stub configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Prevent memory issues in limited environments
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        maxForks: 1
      }
    },
    maxWorkers: 1,
    minWorkers: 1
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@utils': resolve(__dirname, './src/utils'),
      '@services': resolve(__dirname, './src/services'),
      '@mcp': resolve(__dirname, './src/mcp')
    }
  }
});