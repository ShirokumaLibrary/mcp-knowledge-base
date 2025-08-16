import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe.skip('Config CLI Integration', () => {
  const testDir = path.join(__dirname, '../../.test-config');
  const originalEnv = process.env;

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
    process.env = { ...originalEnv };
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
    process.env = originalEnv;
  });

  describe('config init', () => {
    it('should create configuration files', async () => {
      // Act
      execSync('shirokuma-kb config init', { cwd: process.cwd() });

      // Assert
      const envExample = await fs.readFile('.env.example', 'utf-8');
      expect(envExample).toContain('SHIROKUMA_DATABASE_URL');
      expect(envExample).toContain('SHIROKUMA_DATA_DIR');
      
      const devEnv = await fs.readFile('.shirokuma/config/development.env', 'utf-8');
      expect(devEnv).toContain('NODE_ENV=development');
      
      const prodEnv = await fs.readFile('.shirokuma/config/production.env', 'utf-8');
      expect(prodEnv).toContain('NODE_ENV=production');
    });
  });

  describe('config show', () => {
    it('should display current configuration', () => {
      // Act
      const output = execSync('shirokuma-kb config show', { encoding: 'utf-8' });

      // Assert
      expect(output).toContain('SHIROKUMA_DATABASE_URL');
      expect(output).toContain('NODE_ENV');
    });

    it('should export as JSON when format is specified', () => {
      // Act
      const output = execSync('shirokuma-kb config show --format json', { encoding: 'utf-8' });
      const parsed = JSON.parse(output);

      // Assert
      expect(parsed).toHaveProperty('SHIROKUMA_DATABASE_URL');
      expect(parsed).toHaveProperty('_metadata');
    });
  });

  describe('config export', () => {
    it('should export configuration to file', async () => {
      // Arrange
      const exportFile = path.join(testDir, 'exported.env');

      // Act
      execSync(`shirokuma-kb config export --output ${exportFile}`, { encoding: 'utf-8' });

      // Assert
      const content = await fs.readFile(exportFile, 'utf-8');
      expect(content).toContain('SHIROKUMA_DATABASE_URL');
      expect(content).toContain('# Environment configuration exported');
    });
  });

  describe('config validate', () => {
    it('should validate configuration successfully', () => {
      // Arrange
      process.env.SHIROKUMA_DATABASE_URL = 'file:test.db';

      // Act
      const output = execSync('shirokuma-kb config validate', { encoding: 'utf-8' });

      // Assert
      expect(output).toContain('Configuration is valid');
    });

    it('should detect invalid enum values', () => {
      // Arrange
      process.env.NODE_ENV = 'invalid';

      // Act & Assert
      expect(() => {
        execSync('shirokuma-kb config validate', { encoding: 'utf-8' });
      }).toThrow();
    });
  });

  describe('config import', () => {
    it('should import configuration from file', async () => {
      // Arrange
      const importFile = path.join(testDir, 'import.env');
      const envContent = `SHIROKUMA_DATABASE_URL=file:imported.db
NODE_ENV=test
SHIROKUMA_DATA_DIR=/imported/data
`;
      await fs.writeFile(importFile, envContent, 'utf-8');

      // Act
      execSync(`shirokuma-kb config import ${importFile}`, { encoding: 'utf-8' });

      // Assert
      const savedEnv = await fs.readFile('.env', 'utf-8');
      expect(savedEnv).toContain('SHIROKUMA_DATABASE_URL=file:imported.db');
      expect(savedEnv).toContain('NODE_ENV=test');
    });
  });
});