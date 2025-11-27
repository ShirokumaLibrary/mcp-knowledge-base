import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { McpConfigManager } from '../../src/setup/mcp-config-manager';

describe('McpConfigManager', () => {
  let testDir: string;
  let manager: McpConfigManager;
  let testConfigPath: string;

  beforeEach(() => {
    // Create temporary directory for testing
    testDir = join(tmpdir(), `mcp-config-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    testConfigPath = join(testDir, '.mcp.json');
    manager = new McpConfigManager();
  });

  afterEach(() => {
    // Clean up temporary directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('read', () => {
    it('should read and parse valid .mcp.json file', async () => {
      const config = {
        mcpServers: {
          'existing-server': {
            command: 'existing-cmd',
            args: ['serve'],
          },
        },
      };
      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

      const result = await manager.read(testConfigPath);

      expect(result).toEqual(config);
    });

    it('should return null if file does not exist', async () => {
      const result = await manager.read(join(testDir, 'nonexistent.json'));

      expect(result).toBeNull();
    });

    it('should throw error for invalid JSON', async () => {
      writeFileSync(testConfigPath, 'invalid json content');

      await expect(manager.read(testConfigPath)).rejects.toThrow();
    });

    it('should handle empty file', async () => {
      writeFileSync(testConfigPath, '');

      await expect(manager.read(testConfigPath)).rejects.toThrow();
    });
  });

  describe('merge', () => {
    it('should add new server to existing config', async () => {
      const existing = {
        mcpServers: {
          'existing-server': {
            command: 'existing-cmd',
            args: ['serve'],
          },
        },
      };

      const newServerConfig = {
        command: 'shirokuma-kb',
        args: ['serve'],
        env: {
          SHIROKUMA_DATA_DIR: '${workspaceFolder}/.shirokuma/data',
        },
      };

      const result = await manager.merge(existing, 'shirokuma-kb', newServerConfig);

      expect(result.mcpServers['existing-server']).toEqual(existing.mcpServers['existing-server']);
      expect(result.mcpServers['shirokuma-kb']).toEqual(newServerConfig);
    });

    it('should update existing server config', async () => {
      const existing = {
        mcpServers: {
          'shirokuma-kb': {
            command: 'old-command',
            args: ['old-arg'],
          },
        },
      };

      const newServerConfig = {
        command: 'shirokuma-kb',
        args: ['serve'],
        env: {
          SHIROKUMA_DATA_DIR: '${workspaceFolder}/.shirokuma/data',
        },
      };

      const result = await manager.merge(existing, 'shirokuma-kb', newServerConfig);

      expect(result.mcpServers['shirokuma-kb']).toEqual(newServerConfig);
    });

    it('should handle empty existing config', async () => {
      const existing = { mcpServers: {} };

      const newServerConfig = {
        command: 'shirokuma-kb',
        args: ['serve'],
        env: {},
      };

      const result = await manager.merge(existing, 'shirokuma-kb', newServerConfig);

      expect(result.mcpServers['shirokuma-kb']).toEqual(newServerConfig);
    });

    it('should preserve other server configurations', async () => {
      const existing = {
        mcpServers: {
          'server-1': { command: 'cmd1', args: ['arg1'] },
          'server-2': { command: 'cmd2', args: ['arg2'] },
          'server-3': { command: 'cmd3', args: ['arg3'] },
        },
      };

      const newServerConfig = {
        command: 'shirokuma-kb',
        args: ['serve'],
        env: {},
      };

      const result = await manager.merge(existing, 'shirokuma-kb', newServerConfig);

      expect(result.mcpServers['server-1']).toEqual(existing.mcpServers['server-1']);
      expect(result.mcpServers['server-2']).toEqual(existing.mcpServers['server-2']);
      expect(result.mcpServers['server-3']).toEqual(existing.mcpServers['server-3']);
      expect(result.mcpServers['shirokuma-kb']).toEqual(newServerConfig);
    });
  });

  describe('write', () => {
    it('should write config to file with proper formatting', async () => {
      const config = {
        mcpServers: {
          'shirokuma-kb': {
            command: 'shirokuma-kb',
            args: ['serve'],
            env: {
              SHIROKUMA_DATA_DIR: '${workspaceFolder}/.shirokuma/data',
            },
          },
        },
      };

      await manager.write(testConfigPath, config);

      const written = readFileSync(testConfigPath, 'utf-8');
      const parsed = JSON.parse(written);

      expect(parsed).toEqual(config);
      // Check formatting (should have indentation)
      expect(written).toContain('  ');
    });

    it('should create parent directory if it does not exist', async () => {
      const nestedPath = join(testDir, 'nested', 'dir', '.mcp.json');

      const config = { mcpServers: {} };

      await manager.write(nestedPath, config);

      expect(existsSync(nestedPath)).toBe(true);
    });

    it('should overwrite existing file', async () => {
      const oldConfig = { mcpServers: { old: { command: 'old' } } };
      const newConfig = { mcpServers: { new: { command: 'new' } } };

      writeFileSync(testConfigPath, JSON.stringify(oldConfig));

      await manager.write(testConfigPath, newConfig);

      const written = JSON.parse(readFileSync(testConfigPath, 'utf-8'));
      expect(written).toEqual(newConfig);
    });
  });

  describe('backup', () => {
    it('should create backup file with timestamp', async () => {
      const config = { mcpServers: { test: { command: 'test' } } };
      writeFileSync(testConfigPath, JSON.stringify(config));

      const backupPath = await manager.backup(testConfigPath);

      expect(existsSync(backupPath)).toBe(true);
      expect(backupPath).toContain('.mcp.json.backup');

      const backupContent = JSON.parse(readFileSync(backupPath, 'utf-8'));
      expect(backupContent).toEqual(config);
    });

    it('should return original path if file does not exist', async () => {
      const nonExistentPath = join(testDir, 'nonexistent.json');

      const backupPath = await manager.backup(nonExistentPath);

      expect(backupPath).toBe(nonExistentPath);
    });

    it('should create unique backup names for multiple backups', async () => {
      const config = { mcpServers: {} };
      writeFileSync(testConfigPath, JSON.stringify(config));

      const backup1 = await manager.backup(testConfigPath);

      // Wait a tiny bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const backup2 = await manager.backup(testConfigPath);

      expect(backup1).not.toBe(backup2);
      expect(existsSync(backup1)).toBe(true);
      expect(existsSync(backup2)).toBe(true);
    });
  });

  describe('integration', () => {
    it('should handle complete workflow: read, merge, backup, write', async () => {
      // Setup: existing config
      const existingConfig = {
        mcpServers: {
          'existing-server': {
            command: 'existing-cmd',
            args: ['arg'],
          },
        },
      };
      writeFileSync(testConfigPath, JSON.stringify(existingConfig));

      // Read existing config
      const existing = await manager.read(testConfigPath);
      expect(existing).not.toBeNull();

      // Backup before modification
      const backupPath = await manager.backup(testConfigPath);
      expect(existsSync(backupPath)).toBe(true);

      // Merge new server
      const newServerConfig = {
        command: 'shirokuma-kb',
        args: ['serve'],
        env: {
          SHIROKUMA_DATA_DIR: '${workspaceFolder}/.shirokuma/data',
        },
      };
      const merged = await manager.merge(existing!, 'shirokuma-kb', newServerConfig);

      // Write updated config
      await manager.write(testConfigPath, merged);

      // Verify final result
      const final = await manager.read(testConfigPath);
      expect(final?.mcpServers['existing-server']).toEqual(existingConfig.mcpServers['existing-server']);
      expect(final?.mcpServers['shirokuma-kb']).toEqual(newServerConfig);
    });
  });
});
