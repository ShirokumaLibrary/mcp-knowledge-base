import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../../../src/services/config-manager.js';
import fs from 'fs/promises';
import path from 'path';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment for each test
    process.env = { ...originalEnv };
    configManager = new ConfigManager();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should return current configuration with all environment variables', () => {
      // Arrange
      process.env.SHIROKUMA_DATABASE_URL = 'file:test.db';
      process.env.SHIROKUMA_DATA_DIR = '/test/data';
      process.env.NODE_ENV = 'test';

      // Act
      const config = configManager.getConfig();

      // Assert
      expect(config).toEqual({
        SHIROKUMA_DATABASE_URL: 'file:test.db',
        SHIROKUMA_DATA_DIR: '/test/data',
        SHIROKUMA_EXPORT_DIR: expect.any(String),
        NODE_ENV: 'test',
        ANTHROPIC_API_KEY: undefined
      });
    });

    it('should use default values when environment variables are not set', () => {
      // Arrange
      delete process.env.SHIROKUMA_DATABASE_URL;
      delete process.env.SHIROKUMA_DATA_DIR;

      // Act
      const config = configManager.getConfig();

      // Assert
      expect(config.SHIROKUMA_DATABASE_URL).toContain('/.shirokuma/data/shirokuma.db');
      expect(config.SHIROKUMA_DATA_DIR).toContain('/.shirokuma/data');
    });
  });

  describe('exportConfig', () => {
    it('should export configuration as .env format', () => {
      // Arrange
      process.env.SHIROKUMA_DATABASE_URL = 'file:test.db';
      process.env.NODE_ENV = 'test';

      // Act
      const exported = configManager.exportConfig('env');

      // Assert
      expect(exported).toContain('SHIROKUMA_DATABASE_URL=file:test.db');
      expect(exported).toContain('NODE_ENV=test');
      expect(exported).toContain('# Environment configuration exported');
    });

    it('should export configuration as JSON format', () => {
      // Arrange
      process.env.SHIROKUMA_DATABASE_URL = 'file:test.db';
      process.env.NODE_ENV = 'test';

      // Act
      const exported = configManager.exportConfig('json');
      const parsed = JSON.parse(exported);

      // Assert
      expect(parsed).toHaveProperty('SHIROKUMA_DATABASE_URL', 'file:test.db');
      expect(parsed).toHaveProperty('NODE_ENV', 'test');
      expect(parsed).toHaveProperty('_metadata');
    });

    it('should mask sensitive fields during export', () => {
      // Arrange
      process.env.ANTHROPIC_API_KEY = 'sk-ant-secret-key';

      // Act
      const exported = configManager.exportConfig('env');

      // Assert
      expect(exported).not.toContain('sk-ant-secret-key');
      expect(exported).toContain('ANTHROPIC_API_KEY=***REDACTED***');
    });
  });

  describe('importConfig', () => {
    it('should import configuration from .env format', () => {
      // Arrange
      const envContent = `
SHIROKUMA_DATABASE_URL=file:imported.db
NODE_ENV=production
SHIROKUMA_DATA_DIR=/imported/data
`;

      // Act
      configManager.importConfig(envContent, 'env');
      const config = configManager.getConfig();

      // Assert
      expect(config.SHIROKUMA_DATABASE_URL).toBe('file:imported.db');
      expect(config.NODE_ENV).toBe('production');
      expect(config.SHIROKUMA_DATA_DIR).toBe('/imported/data');
    });

    it('should import configuration from JSON format', () => {
      // Arrange
      const jsonContent = JSON.stringify({
        SHIROKUMA_DATABASE_URL: 'file:imported.db',
        NODE_ENV: 'production',
        SHIROKUMA_DATA_DIR: '/imported/data'
      });

      // Act
      configManager.importConfig(jsonContent, 'json');
      const config = configManager.getConfig();

      // Assert
      expect(config.SHIROKUMA_DATABASE_URL).toBe('file:imported.db');
      expect(config.NODE_ENV).toBe('production');
      expect(config.SHIROKUMA_DATA_DIR).toBe('/imported/data');
    });
  });

  describe('validateConfig', () => {
    it('should validate required fields', () => {
      // Arrange
      delete process.env.SHIROKUMA_DATABASE_URL;

      // Act
      const result = configManager.validateConfig();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SHIROKUMA_DATABASE_URL is required');
    });

    it('should validate enum values', () => {
      // Arrange
      process.env.NODE_ENV = 'invalid';

      // Act
      const result = configManager.validateConfig();

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('NODE_ENV must be one of: development, production, test');
    });

    it('should pass validation with valid config', () => {
      // Arrange
      process.env.SHIROKUMA_DATABASE_URL = 'file:test.db';
      process.env.NODE_ENV = 'test';

      // Act
      const result = configManager.validateConfig();

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('switchEnvironment', () => {
    it('should switch to development environment', async () => {
      // Arrange
      vi.spyOn(fs, 'readFile').mockResolvedValue('SHIROKUMA_DATABASE_URL=file:dev.db\nNODE_ENV=development');

      // Act
      await configManager.switchEnvironment('development');
      const config = configManager.getConfig();

      // Assert
      expect(config.SHIROKUMA_DATABASE_URL).toBe('file:dev.db');
      expect(config.NODE_ENV).toBe('development');
    });

    it('should switch to production environment', async () => {
      // Arrange
      vi.spyOn(fs, 'readFile').mockResolvedValue('SHIROKUMA_DATABASE_URL=file:prod.db\nNODE_ENV=production');

      // Act
      await configManager.switchEnvironment('production');
      const config = configManager.getConfig();

      // Assert
      expect(config.SHIROKUMA_DATABASE_URL).toBe('file:prod.db');
      expect(config.NODE_ENV).toBe('production');
    });

    it('should throw error if environment file does not exist', async () => {
      // Arrange
      vi.spyOn(fs, 'readFile').mockRejectedValue(new Error('File not found'));

      // Act & Assert
      await expect(configManager.switchEnvironment('test')).rejects.toThrow();
    });
  });

  describe('getSchema', () => {
    it('should return configuration schema with descriptions', () => {
      // Act
      const schema = configManager.getSchema();

      // Assert
      expect(schema).toHaveProperty('SHIROKUMA_DATABASE_URL');
      expect(schema.SHIROKUMA_DATABASE_URL).toHaveProperty('type', 'string');
      expect(schema.SHIROKUMA_DATABASE_URL).toHaveProperty('required', true);
      expect(schema.SHIROKUMA_DATABASE_URL).toHaveProperty('description');
      expect(schema.SHIROKUMA_DATABASE_URL).toHaveProperty('default');
    });
  });
});