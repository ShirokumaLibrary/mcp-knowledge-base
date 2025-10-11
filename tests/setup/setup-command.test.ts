import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { SetupCommand } from '../../src/setup/setup-command';

describe('SetupCommand', () => {
  let testDir: string;
  let command: SetupCommand;
  let packageRoot: string;

  beforeEach(() => {
    // Create temporary directory for testing
    testDir = join(tmpdir(), `setup-command-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Mock package root (where .shirokuma/templates/ exists)
    packageRoot = join(testDir, 'package-root');
    mkdirSync(join(packageRoot, '.shirokuma', 'templates'), { recursive: true });

    // Create mock template files
    const mcpTemplate = {
      mcpServers: {
        'shirokuma-kb': {
          command: 'shirokuma-kb',
          args: ['serve'],
          env: {
            SHIROKUMA_DATA_DIR: '${workspaceFolder}/.shirokuma/data',
            SHIROKUMA_EXPORT_DIR: '${workspaceFolder}/docs/export'
          }
        }
      }
    };
    writeFileSync(
      join(packageRoot, '.shirokuma', 'templates', '.mcp.json'),
      JSON.stringify(mcpTemplate, null, 2)
    );

    writeFileSync(
      join(packageRoot, '.shirokuma', 'templates', '.env.template'),
      'SHIROKUMA_DATA_DIR=${workspaceFolder}/.shirokuma/data\nSHIROKUMA_EXPORT_DIR=${workspaceFolder}/docs/export\n'
    );

    command = new SetupCommand(packageRoot);
  });

  afterEach(() => {
    // Clean up temporary directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('execute', () => {
    it('should create .shirokuma directory in target project', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      await command.execute(projectDir, { force: true });

      expect(existsSync(join(projectDir, '.shirokuma'))).toBe(true);
    });

    it('should create .mcp.json in target project', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      await command.execute(projectDir, { force: true });

      const mcpPath = join(projectDir, '.mcp.json');
      expect(existsSync(mcpPath)).toBe(true);

      const config = JSON.parse(readFileSync(mcpPath, 'utf-8'));
      expect(config.mcpServers['shirokuma-kb']).toBeDefined();
    });

    it('should create .env file in target project', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      await command.execute(projectDir, { force: true });

      const envPath = join(projectDir, '.env');
      expect(existsSync(envPath)).toBe(true);

      const envContent = readFileSync(envPath, 'utf-8');
      expect(envContent).toContain('SHIROKUMA_DATA_DIR');
      expect(envContent).toContain('SHIROKUMA_EXPORT_DIR');
    });

    it('should create data directory', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      await command.execute(projectDir, { force: true });

      expect(existsSync(join(projectDir, '.shirokuma', 'data'))).toBe(true);
    });

    it('should create export directory', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      await command.execute(projectDir, { force: true });

      expect(existsSync(join(projectDir, 'docs', 'export'))).toBe(true);
    });

    it('should respect custom MCP name', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      await command.execute(projectDir, { force: true, mcpName: 'my-kb' });

      const mcpPath = join(projectDir, '.mcp.json');
      const config = JSON.parse(readFileSync(mcpPath, 'utf-8'));

      expect(config.mcpServers['my-kb']).toBeDefined();
      expect(config.mcpServers['shirokuma-kb']).toBeUndefined();
    });

    it('should preserve existing .mcp.json servers', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      // Create existing .mcp.json with other server
      const existingConfig = {
        mcpServers: {
          'other-server': {
            command: 'other-cmd',
            args: ['serve']
          }
        }
      };
      writeFileSync(
        join(projectDir, '.mcp.json'),
        JSON.stringify(existingConfig, null, 2)
      );

      await command.execute(projectDir, { force: true });

      const mcpPath = join(projectDir, '.mcp.json');
      const config = JSON.parse(readFileSync(mcpPath, 'utf-8'));

      expect(config.mcpServers['other-server']).toEqual(existingConfig.mcpServers['other-server']);
      expect(config.mcpServers['shirokuma-kb']).toBeDefined();
    });

    it('should create backup of existing .mcp.json', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      // Create existing .mcp.json
      const existingConfig = { mcpServers: { existing: { command: 'cmd' } } };
      writeFileSync(
        join(projectDir, '.mcp.json'),
        JSON.stringify(existingConfig, null, 2)
      );

      await command.execute(projectDir, { force: true });

      // Check for backup file
      const files = require('fs').readdirSync(projectDir);
      const backupFiles = files.filter((f: string) => f.startsWith('.mcp.json.backup'));

      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should skip existing .env file if not forced', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      // Create existing .env
      const existingEnv = 'EXISTING_VAR=value\n';
      writeFileSync(join(projectDir, '.env'), existingEnv);

      await command.execute(projectDir, { force: false });

      const envContent = readFileSync(join(projectDir, '.env'), 'utf-8');
      expect(envContent).toBe(existingEnv);
    });

    it('should overwrite .env file if forced', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      // Create existing .env
      writeFileSync(join(projectDir, '.env'), 'OLD_VAR=old\n');

      await command.execute(projectDir, { force: true });

      const envContent = readFileSync(join(projectDir, '.env'), 'utf-8');
      expect(envContent).toContain('SHIROKUMA_DATA_DIR');
      expect(envContent).not.toContain('OLD_VAR');
    });
  });

  describe('rebuild mode', () => {
    it('should skip file copying in rebuild mode', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      // First setup
      await command.execute(projectDir, { force: true });

      // Mark a file to detect if it's copied again
      const markerFile = join(projectDir, '.shirokuma', 'MARKER');
      writeFileSync(markerFile, 'test');

      // Rebuild
      await command.execute(projectDir, { rebuild: true });

      // Marker should still exist (directory wasn't re-copied)
      expect(existsSync(markerFile)).toBe(true);
    });

    it('should update .mcp.json in rebuild mode', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      // First setup
      await command.execute(projectDir, { force: true });

      // Modify .mcp.json
      const mcpPath = join(projectDir, '.mcp.json');
      const config = JSON.parse(readFileSync(mcpPath, 'utf-8'));
      config.mcpServers['shirokuma-kb'].args = ['old-arg'];
      writeFileSync(mcpPath, JSON.stringify(config, null, 2));

      // Rebuild
      await command.execute(projectDir, { rebuild: true });

      // Should have updated config
      const updatedConfig = JSON.parse(readFileSync(mcpPath, 'utf-8'));
      expect(updatedConfig.mcpServers['shirokuma-kb'].args).toEqual(['serve']);
    });
  });

  describe('error handling', () => {
    it('should throw error if package root is invalid', async () => {
      const invalidCommand = new SetupCommand('/nonexistent/path');
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      await expect(
        invalidCommand.execute(projectDir, { force: true })
      ).rejects.toThrow();
    });

    it('should throw error if project directory does not exist', async () => {
      await expect(
        command.execute('/nonexistent/project', { force: true })
      ).rejects.toThrow();
    });
  });
});
