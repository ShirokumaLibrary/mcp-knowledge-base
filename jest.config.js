export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
        tsconfig: {
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true
        }
      }
    ]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@xenova/transformers)/)'
  ],
  testMatch: [
    '**/src/**/__tests__/**/*.test.ts',
    '**/src/**/?(*.)+(spec|test).ts',
    '**/tests/**/*.test.ts',
    '**/tests/integration/**/*.test.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tmp/',
    '/dist/',
    '/tests/e2e/'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/test-utils/**',
    '!src/**/fixtures/**',
    '!src/**/mocks/**',
    '!src/**/*-v2.ts',
    '!src/**/*-v2.js',
    '!src/**/handler-patterns.ts',
    '!src/**/*-mock.ts',
    '!src/**/test-*.ts',
    '!src/types/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary'],
  testTimeout: 60000,
  setupFiles: ['<rootDir>/jest.presetup.js'],  // Run BEFORE test environment is set up
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],  // Run AFTER test environment is set up
  maxWorkers: 1,  // 並列実行を無効化
  maxConcurrency: 1,  // 並列実行を無効化
  forceExit: true,  // Force Jest to exit after all tests have completed
  detectOpenHandles: false  // Disable open handle detection for performance
};