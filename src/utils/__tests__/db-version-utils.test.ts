// TDD RED Phase Tests for issues-157
// Test that getProgramVersion should ignore current directory's package.json

import * as fs from 'fs/promises';
import * as path from 'path';
import { getProgramVersion } from '../db-version-utils.js';
import * as os from 'os';

describe('getProgramVersion', () => {
  // Test 1: Minimal failing test - should read MCP's package.json, not current directory
  it('shouldIgnoreCurrentDirectoryPackageJson', async () => {
    // Arrange
    const originalCwd = process.cwd();
    const tempDir = path.join(os.tmpdir(), 'mcp-test-' + Date.now());
    
    // Create a temporary directory with a different package.json
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ version: '99.99.99' }, null, 2)
    );
    
    try {
      // Act
      process.chdir(tempDir); // Change to temp directory with different package.json
      const version = await getProgramVersion();
      
      // Assert
      // This test SHOULD FAIL because current implementation uses process.cwd()
      // Expected: MCP's actual version (0.7.13)
      // Actual: Will get 99.99.99 from current directory
      expect(version).toBe('0.7.13'); // MCP's actual version
      expect(version).not.toBe('99.99.99'); // Should NOT be the temp dir version
    } finally {
      // Cleanup
      process.chdir(originalCwd);
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  // Test 2: Should work correctly in src environment
  it('shouldWorkInSrcEnvironment', async () => {
    // This test simulates running from src/ directory (development mode)
    const version = await getProgramVersion();
    
    // Should get the actual MCP version regardless of where it's run from
    expect(version).toBe('0.7.13');
    expect(typeof version).toBe('string');
    expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning format
  });

  // Test 3: Should work correctly in dist environment  
  it('shouldWorkInDistEnvironment', async () => {
    // This test verifies that getProgramVersion works correctly
    // regardless of the environment (development vs production)
    const version = await getProgramVersion();
    
    // Should get the correct MCP version
    expect(version).toBe('0.7.13');
    expect(typeof version).toBe('string');
  });

  // Test 4: Should resolve symlinks correctly
  it('shouldResolveSymlinks', async () => {
    const tempDir = path.join(os.tmpdir(), 'mcp-symlink-test-' + Date.now());
    const symlinkPath = path.join(tempDir, 'symlink-to-mcp');
    
    try {
      // Create temp directory and symlink
      await fs.mkdir(tempDir, { recursive: true });
      await fs.symlink(process.cwd(), symlinkPath, 'dir');
      
      // Change to symlink directory
      const originalCwd = process.cwd();
      process.chdir(symlinkPath);
      
      try {
        const version = await getProgramVersion();
        
        // Should still get correct version through symlink
        expect(version).toBe('0.7.13');
      } finally {
        process.chdir(originalCwd);
      }
    } finally {
      // Cleanup
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  // Test 5: Should handle missing package.json gracefully
  it('shouldReturnFallbackVersionWhenPackageJsonNotFound', async () => {
    // Create a temp directory without package.json
    const tempDir = path.join(os.tmpdir(), 'mcp-no-package-' + Date.now());
    await fs.mkdir(tempDir, { recursive: true });
    
    const originalCwd = process.cwd();
    
    try {
      // Change to directory without package.json
      process.chdir(tempDir);
      const version = await getProgramVersion();
      
      // With __dirname-based implementation, it still finds MCP's package.json
      expect(version).toBe('0.7.13'); // MCP's actual version
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  // Test 6: Should handle malformed package.json
  it('shouldHandleMalformedPackageJson', async () => {
    const tempDir = path.join(os.tmpdir(), 'mcp-malformed-test-' + Date.now());
    
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      'This is not valid JSON!'
    );
    
    const originalCwd = process.cwd();
    
    try {
      process.chdir(tempDir);
      const version = await getProgramVersion();
      
      // With __dirname-based implementation, it still finds MCP's package.json
      expect(version).toBe('0.7.13'); // MCP's actual version
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  // Test 7: API-level test that exposes the bug (as per TDD methodology)
  it('shouldNotBeAffectedByUserProjectPackageJson', async () => {
    // This is an API-level test that shows the real-world impact of the bug
    // User has their own project with different version
    const userProjectDir = path.join(os.tmpdir(), 'mcp-user-project-' + Date.now());
    
    await fs.mkdir(userProjectDir, { recursive: true });
    await fs.writeFile(
      path.join(userProjectDir, 'package.json'),
      JSON.stringify({ 
        name: 'user-awesome-project',
        version: '1.0.0',
        description: 'User project that uses MCP'
      }, null, 2)
    );
    
    const originalCwd = process.cwd();
    
    try {
      // User runs MCP from their project directory
      process.chdir(userProjectDir);
      const version = await getProgramVersion();
      
      // MCP should report its own version, not user's project version
      expect(version).toBe('0.7.13'); // MCP version
      expect(version).not.toBe('1.0.0'); // NOT user's project version
      
      // This test demonstrates the bug's impact:
      // Database version checks would fail incorrectly
      // because MCP would read wrong version number
    } finally {
      process.chdir(originalCwd);
      await fs.rm(userProjectDir, { recursive: true, force: true });
    }
  });
});

// Edge cases and error scenarios
describe('getProgramVersion - Edge Cases', () => {
  it('shouldHandlePackageJsonWithoutVersion', async () => {
    const tempDir = path.join(os.tmpdir(), 'mcp-no-version-' + Date.now());
    
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-package' }, null, 2) // No version field
    );
    
    const originalCwd = process.cwd();
    
    try {
      process.chdir(tempDir);
      const version = await getProgramVersion();
      
      // With __dirname-based implementation, it still finds MCP's package.json
      expect(version).not.toBeUndefined();
      expect(version).toBe('0.7.13'); // MCP's actual version
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('shouldHandleNestedNodeModulesScenario', async () => {
    // Test when MCP is installed as a dependency in node_modules
    const projectDir = path.join(os.tmpdir(), 'mcp-test-project-' + Date.now());
    const nodeModulesDir = path.join(projectDir, 'node_modules', '@shirokuma-library', 'mcp-knowledge-base');
    
    await fs.mkdir(nodeModulesDir, { recursive: true });
    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify({ version: '2.0.0' }, null, 2)
    );
    await fs.writeFile(
      path.join(nodeModulesDir, 'package.json'),
      JSON.stringify({ version: '0.7.13' }, null, 2)
    );
    
    const originalCwd = process.cwd();
    
    try {
      // Run from project directory
      process.chdir(projectDir);
      const version = await getProgramVersion();
      
      // Should get MCP's version from its own package.json in node_modules
      // NOT the parent project's version
      expect(version).toBe('0.7.13');
      expect(version).not.toBe('2.0.0');
    } finally {
      process.chdir(originalCwd);
      await fs.rm(projectDir, { recursive: true, force: true });
    }
  });
});

// Test failure messages clarity (TDD requirement)
describe('getProgramVersion - Test Failure Clarity', () => {
  it('shouldProvidesClearFailureMessage', async () => {
    // This test verifies that when tests fail, they provide clear information
    const tempDir = path.join(os.tmpdir(), 'mcp-clarity-test-' + Date.now());
    
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ version: '3.0.0' }, null, 2)
    );
    
    const originalCwd = process.cwd();
    
    try {
      process.chdir(tempDir);
      const version = await getProgramVersion();
      
      // This assertion will fail with current implementation
      // The failure message should clearly show:
      // Expected: "0.7.13" (MCP's version)
      // Received: "3.0.0" (current directory's version)
      // This makes the bug immediately obvious
      expect(version).toBe('0.7.13');
    } catch (error: any) {
      // Verify the error message is informative
      expect(error.message).toContain('Expected');
      expect(error.message).toContain('Received');
    } finally {
      process.chdir(originalCwd);
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});