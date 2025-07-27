#!/usr/bin/env node
/**
 * @ai-context E2E test runner script
 * @ai-pattern Orchestrates E2E test execution
 * @ai-critical Main entry point for E2E tests
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

interface TestSuite {
  name: string;
  file: string;
  timeout?: number;
}

const testSuites: TestSuite[] = [
  {
    name: 'CRUD Operations',
    file: 'crud-operations.e2e.test.ts',
    timeout: 120000
  },
  {
    name: 'Search Functionality',
    file: 'search-functionality.e2e.test.ts',
    timeout: 120000
  },
  {
    name: 'Performance',
    file: 'performance.e2e.test.ts',
    timeout: 180000
  },
  {
    name: 'Security',
    file: 'security.e2e.test.ts',
    timeout: 120000
  },
  {
    name: 'Workflows',
    file: 'workflow.e2e.test.ts',
    timeout: 180000
  }
];

async function runE2ETests() {
  console.log('🚀 Starting E2E Test Suite\n');
  console.log('=' .repeat(60));
  
  // Ensure build is up to date
  console.log('📦 Building project...');
  await runCommand('npm', ['run', 'build']);
  
  // Create test results directory
  const resultsDir = path.join(process.cwd(), 'test-results', 'e2e');
  await fs.mkdir(resultsDir, { recursive: true });
  
  const results: Array<{
    suite: string;
    passed: boolean;
    duration: number;
    error?: string;
  }> = [];
  
  // Run each test suite
  for (const suite of testSuites) {
    console.log(`\n📋 Running ${suite.name} tests...`);
    console.log('-' .repeat(40));
    
    const startTime = Date.now();
    
    try {
      await runCommand('npx', [
        'jest',
        '--config',
        'jest.e2e.config.js',
        `tests/e2e/${suite.file}`,
        '--forceExit',
        '--detectOpenHandles'
      ]);
      
      const duration = Date.now() - startTime;
      results.push({
        suite: suite.name,
        passed: true,
        duration
      });
      
      console.log(`✅ ${suite.name} tests passed (${(duration / 1000).toFixed(2)}s)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        suite: suite.name,
        passed: false,
        duration,
        error: String(error)
      });
      
      console.log(`❌ ${suite.name} tests failed (${(duration / 1000).toFixed(2)}s)`);
    }
  }
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 E2E Test Summary\n');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`Total Test Suites: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('\nDetailed Results:');
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const time = (result.duration / 1000).toFixed(2);
    console.log(`  ${status} ${result.suite} (${time}s)`);
    
    if (!result.passed && result.error) {
      console.log(`     Error: ${result.error.substring(0, 100)}...`);
    }
  });
  
  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      duration: totalDuration
    },
    results,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
  
  const reportPath = path.join(resultsDir, `e2e-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Test report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  if (failedTests > 0) {
    console.log('\n❌ E2E tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All E2E tests passed!');
    process.exit(0);
  }
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runE2ETests().catch(error => {
    console.error('E2E test runner failed:', error);
    process.exit(1);
  });
}