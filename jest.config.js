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
    '!src/**/*.test.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 60000,
  setupFiles: ['<rootDir>/jest.presetup.js'],  // Run BEFORE test environment is set up
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],  // Run AFTER test environment is set up
  maxWorkers: 1,  // 並列実行を無効化
  maxConcurrency: 1  // 並列実行を無効化
};