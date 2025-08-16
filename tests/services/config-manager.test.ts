import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import { ConfigManager } from '../../src/services/config-manager.js';

describe('ConfigManager - Environment File Loading', () => {
  let configManager: ConfigManager;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear environment variables
    process.env = {};
    configManager = new ConfigManager();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('loadEnvFile', () => {
    it('should load .env file when no environment name is provided', async () => {
      const mockEnvContent = 'SHIROKUMA_DATABASE_URL=file:test.db\nNODE_ENV=development';
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockEnvContent);

      await configManager.loadEnvFile();

      expect(fs.readFile).toHaveBeenCalledWith('.env', 'utf-8');
      expect(process.env.SHIROKUMA_DATABASE_URL).toBe('file:test.db');
      expect(process.env.NODE_ENV).toBe('development');
    });

    it('should load .env.dev file when "dev" environment name is provided', async () => {
      const mockEnvContent = 'SHIROKUMA_DATABASE_URL=file:dev.db\nNODE_ENV=development';
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockEnvContent);

      await configManager.loadEnvFile('dev');

      expect(fs.readFile).toHaveBeenCalledWith('.env.dev', 'utf-8');
      expect(process.env.SHIROKUMA_DATABASE_URL).toBe('file:dev.db');
    });

    it('should load .env.test file when "test" environment name is provided', async () => {
      const mockEnvContent = 'SHIROKUMA_DATABASE_URL=file:test.db\nNODE_ENV=test';
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockEnvContent);

      await configManager.loadEnvFile('test');

      expect(fs.readFile).toHaveBeenCalledWith('.env.test', 'utf-8');
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should load .env.prod file when "prod" environment name is provided', async () => {
      const mockEnvContent = 'SHIROKUMA_DATABASE_URL=file:prod.db\nNODE_ENV=production';
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockEnvContent);

      await configManager.loadEnvFile('prod');

      expect(fs.readFile).toHaveBeenCalledWith('.env.prod', 'utf-8');
      expect(process.env.NODE_ENV).toBe('production');
    });

    it('should fallback to .env file if environment-specific file does not exist', async () => {
      const mockError = new Error('File not found') as NodeJS.ErrnoException;
      mockError.code = 'ENOENT';
      
      vi.spyOn(fs, 'readFile')
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce('SHIROKUMA_DATABASE_URL=file:default.db');

      await configManager.loadEnvFile('staging');

      expect(fs.readFile).toHaveBeenCalledTimes(2);
      expect(fs.readFile).toHaveBeenNthCalledWith(1, '.env.staging', 'utf-8');
      expect(fs.readFile).toHaveBeenNthCalledWith(2, '.env', 'utf-8');
      expect(process.env.SHIROKUMA_DATABASE_URL).toBe('file:default.db');
    });

    it('should handle both .env file not existing', async () => {
      const mockError = new Error('File not found') as NodeJS.ErrnoException;
      mockError.code = 'ENOENT';
      
      vi.spyOn(fs, 'readFile').mockRejectedValue(mockError);

      // Should not throw, just silently continue
      await expect(configManager.loadEnvFile('staging')).resolves.not.toThrow();
    });

    it('should handle file read errors other than ENOENT', async () => {
      const mockError = new Error('Permission denied') as NodeJS.ErrnoException;
      mockError.code = 'EACCES';
      
      vi.spyOn(fs, 'readFile').mockRejectedValue(mockError);

      await expect(configManager.loadEnvFile()).rejects.toThrow('Permission denied');
    });

    it('should ignore comments and empty lines in env file', async () => {
      const mockEnvContent = `
# This is a comment
SHIROKUMA_DATABASE_URL=file:test.db

# Another comment
NODE_ENV=development
`;
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockEnvContent);

      await configManager.loadEnvFile();

      expect(process.env.SHIROKUMA_DATABASE_URL).toBe('file:test.db');
      expect(process.env.NODE_ENV).toBe('development');
    });

    it('should handle values with equals signs', async () => {
      const mockEnvContent = 'SHIROKUMA_DATABASE_URL=postgres://user:pass=word@localhost/db';
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockEnvContent);

      await configManager.loadEnvFile();

      expect(process.env.SHIROKUMA_DATABASE_URL).toBe('postgres://user:pass=word@localhost/db');
    });
  });

  describe('initializeWithEnv', () => {
    it('should initialize ConfigManager with specified environment', async () => {
      const mockEnvContent = 'SHIROKUMA_DATABASE_URL=file:test.db\nNODE_ENV=test';
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockEnvContent);

      await configManager.initializeWithEnv('test');

      expect(fs.readFile).toHaveBeenCalledWith('.env.test', 'utf-8');
      expect(configManager.getConfig().NODE_ENV).toBe('test');
    });

    it('should initialize with default .env when no environment specified', async () => {
      const mockEnvContent = 'SHIROKUMA_DATABASE_URL=file:default.db';
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockEnvContent);

      await configManager.initializeWithEnv();

      expect(fs.readFile).toHaveBeenCalledWith('.env', 'utf-8');
    });
  });

  describe('Security Tests', () => {
    it('should reject path traversal attempts', async () => {
      await expect(configManager.loadEnvFile('../../../etc/passwd')).rejects.toThrow('Invalid environment name');
      await expect(configManager.loadEnvFile('../../.env')).rejects.toThrow('Invalid environment name');
      await expect(configManager.loadEnvFile('..\\..\\.env')).rejects.toThrow('Invalid environment name');
    });

    it('should reject environment names with slashes', async () => {
      await expect(configManager.loadEnvFile('env/prod')).rejects.toThrow('Invalid environment name');
      await expect(configManager.loadEnvFile('env\\test')).rejects.toThrow('Invalid environment name');
    });

    it('should reject environment names with special characters', async () => {
      await expect(configManager.loadEnvFile('env;rm -rf /')).rejects.toThrow('Invalid environment name format');
      await expect(configManager.loadEnvFile('env&echo')).rejects.toThrow('Invalid environment name format');
      await expect(configManager.loadEnvFile('env|cat')).rejects.toThrow('Invalid environment name format');
    });

    it('should accept valid environment names', async () => {
      const mockEnvContent = 'SHIROKUMA_DATABASE_URL=file:test.db';
      vi.spyOn(fs, 'readFile').mockResolvedValue(mockEnvContent);

      await expect(configManager.loadEnvFile('dev')).resolves.not.toThrow();
      await expect(configManager.loadEnvFile('test-env')).resolves.not.toThrow();
      await expect(configManager.loadEnvFile('prod_v2')).resolves.not.toThrow();
      await expect(configManager.loadEnvFile('PRODUCTION')).resolves.not.toThrow();
    });
  });
});