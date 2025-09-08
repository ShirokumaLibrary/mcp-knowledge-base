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
      process.env.SHIROKUMA_DATA_DIR = '/test/data';
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';

      // Act
      const config = configManager.getConfig();

      // Assert
      expect(config).toEqual({
        SHIROKUMA_DATA_DIR: '/test/data',
        SHIROKUMA_EXPORT_DIR: '/test/export'
      });
    });

    it('should use default values when environment variables are not set', () => {
      // Arrange
      delete process.env.SHIROKUMA_DATA_DIR;
      delete process.env.SHIROKUMA_EXPORT_DIR;

      // Act
      const config = configManager.getConfig();

      // Assert
      expect(config.SHIROKUMA_DATA_DIR).toBe('.shirokuma/data-prod');
      expect(config.SHIROKUMA_EXPORT_DIR).toBe('docs/export');
    });
  });

  describe('exportConfig', () => {
    it('should export configuration as .env format', () => {
      // Arrange
      process.env.SHIROKUMA_DATA_DIR = '/test/data';
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';

      // Act
      const exported = configManager.exportConfig('env');

      // Assert
      expect(exported).toContain('SHIROKUMA_DATA_DIR=/test/data');
      expect(exported).toContain('SHIROKUMA_EXPORT_DIR=/test/export');
      expect(exported).toContain('# Environment configuration exported');
    });

    it('should export configuration as JSON format', () => {
      // Arrange
      process.env.SHIROKUMA_DATA_DIR = '/test/data';
      process.env.SHIROKUMA_EXPORT_DIR = '/test/export';

      // Act
      const exported = configManager.exportConfig('json');
      const parsed = JSON.parse(exported);

      // Assert
      expect(parsed).toHaveProperty('SHIROKUMA_DATA_DIR', '/test/data');
      expect(parsed).toHaveProperty('SHIROKUMA_EXPORT_DIR', '/test/export');
      expect(parsed).toHaveProperty('_metadata');
    });

    it.skip('should mask sensitive fields during export', () => {
      // Skip: No sensitive fields in current schema
      // Will be re-enabled when sensitive fields are added
    });
  });

  describe.skip('importConfig', () => {
    // TODO: Implement importConfig method in ConfigManager
    it.skip('should import configuration from .env format', () => {});
    it.skip('should import configuration from JSON format', () => {});
  });

  describe('validateConfig', () => {
    it('should validate required fields', () => {
      // Act
      const result = configManager.validateConfig();

      // Assert - All fields are optional in current schema
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it.skip('should validate enum values', () => {
      // Skip: No enum fields in current schema

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

  describe.skip('switchEnvironment', () => {
    // TODO: Implement switchEnvironment method in ConfigManager
    it.skip('should switch to development environment', () => {});
    it.skip('should switch to production environment', () => {});
    it.skip('should throw error if environment file does not exist', () => {});
  });

  describe('getSchema', () => {
    it('should return configuration schema with descriptions', () => {
      // Act
      const schema = configManager.getSchema();

      // Assert
      expect(schema).toHaveProperty('SHIROKUMA_DATA_DIR');
      expect(schema.SHIROKUMA_DATA_DIR).toHaveProperty('type', 'string');
      expect(schema.SHIROKUMA_DATA_DIR).toHaveProperty('required', false);
      expect(schema.SHIROKUMA_DATA_DIR).toHaveProperty('description');
      expect(schema.SHIROKUMA_DATA_DIR).toHaveProperty('default');
    });
  });
});