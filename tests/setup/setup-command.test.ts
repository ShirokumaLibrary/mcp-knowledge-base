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

    it('should only regenerate changed files in rebuild mode (incremental update)', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      // Create source files with placeholders
      const shiroKumaAgentsDir = join(projectDir, '.shirokuma', 'agents');
      mkdirSync(shiroKumaAgentsDir, { recursive: true });
      writeFileSync(join(shiroKumaAgentsDir, 'agent1.md'), 'Tool: {{MCP_NAME}}__create_item');
      writeFileSync(join(shiroKumaAgentsDir, 'agent2.md'), 'Tool: {{MCP_NAME}}__get_item');

      // First setup
      await command.execute(projectDir, { force: true });

      // Verify generated files
      const claudeAgentsDir = join(projectDir, '.claude', 'agents');
      expect(existsSync(join(claudeAgentsDir, 'agent1.md'))).toBe(true);
      expect(existsSync(join(claudeAgentsDir, 'agent2.md'))).toBe(true);

      // Wait to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Modify only agent1 in source
      writeFileSync(join(shiroKumaAgentsDir, 'agent1.md'), 'Tool: {{MCP_NAME}}__create_item (updated)');

      // Get modification time of agent2 before rebuild
      const agent2TargetPath = join(claudeAgentsDir, 'agent2.md');
      const agent2MtimeBefore = require('fs').statSync(agent2TargetPath).mtime;

      // Wait to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Rebuild with incremental mode (enabled by default in rebuild)
      await command.execute(projectDir, { rebuild: true });

      // Check agent1 was updated
      const agent1Content = readFileSync(join(claudeAgentsDir, 'agent1.md'), 'utf-8');
      expect(agent1Content).toContain('(updated)');

      // Check agent2 was NOT regenerated (mtime should be same)
      const agent2MtimeAfter = require('fs').statSync(agent2TargetPath).mtime;
      expect(agent2MtimeAfter.getTime()).toBe(agent2MtimeBefore.getTime());
    });

    it('should detect and use different MCP names in rebuild mode', async () => {
      const projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      // Create source file with placeholder
      const shiroKumaAgentsDir = join(projectDir, '.shirokuma', 'agents');
      mkdirSync(shiroKumaAgentsDir, { recursive: true });
      writeFileSync(join(shiroKumaAgentsDir, 'agent.md'), 'Tool: {{MCP_NAME}}__create_item');

      // First setup with custom MCP name
      await command.execute(projectDir, { force: true, mcpName: 'my-custom-kb' });

      // Verify generated file uses custom name
      const claudeAgentsDir = join(projectDir, '.claude', 'agents');
      let agentContent = readFileSync(join(claudeAgentsDir, 'agent.md'), 'utf-8');
      expect(agentContent).toBe('Tool: mcp__my-custom-kb__create_item');

      // Verify MCP config has custom name
      const mcpPath = join(projectDir, '.mcp.json');
      const config = JSON.parse(readFileSync(mcpPath, 'utf-8'));
      expect(config.mcpServers['my-custom-kb']).toBeDefined();

      // Wait to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update source file
      writeFileSync(join(shiroKumaAgentsDir, 'agent.md'), 'Tool: {{MCP_NAME}}__get_item');

      // Rebuild (should auto-detect 'my-custom-kb' from .mcp.json)
      await command.execute(projectDir, { rebuild: true });

      // Verify generated file still uses custom name
      agentContent = readFileSync(join(claudeAgentsDir, 'agent.md'), 'utf-8');
      expect(agentContent).toBe('Tool: mcp__my-custom-kb__get_item');
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

  describe('copyMasterFiles', () => {
    let projectDir: string;

    beforeEach(() => {
      projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);

      // Create mock agents directory in package
      const agentsDir = join(packageRoot, '.shirokuma', 'agents');
      mkdirSync(agentsDir, { recursive: true });
      writeFileSync(join(agentsDir, 'agent1.md'), 'Agent 1 content');
      writeFileSync(join(agentsDir, 'agent2.md'), 'Agent 2 content');

      // Create mock commands directory in package
      const commandsDir = join(packageRoot, '.shirokuma', 'commands');
      mkdirSync(commandsDir, { recursive: true });
      writeFileSync(join(commandsDir, 'command1.md'), 'Command 1 content');
      writeFileSync(join(commandsDir, 'command2.md'), 'Command 2 content');

      // Create subdirectory to test recursive copying
      const commandsSubDir = join(commandsDir, 'subdir');
      mkdirSync(commandsSubDir);
      writeFileSync(join(commandsSubDir, 'nested.md'), 'Nested command content');
    });

    it('should copy agents directory from package to project', async () => {
      await command.execute(projectDir, { force: true });

      const targetAgentsDir = join(projectDir, '.shirokuma', 'agents');
      expect(existsSync(targetAgentsDir)).toBe(true);
      expect(existsSync(join(targetAgentsDir, 'agent1.md'))).toBe(true);
      expect(existsSync(join(targetAgentsDir, 'agent2.md'))).toBe(true);

      const agent1Content = readFileSync(join(targetAgentsDir, 'agent1.md'), 'utf-8');
      expect(agent1Content).toBe('Agent 1 content');
    });

    it('should copy commands directory from package to project', async () => {
      await command.execute(projectDir, { force: true });

      const targetCommandsDir = join(projectDir, '.shirokuma', 'commands');
      expect(existsSync(targetCommandsDir)).toBe(true);
      expect(existsSync(join(targetCommandsDir, 'command1.md'))).toBe(true);
      expect(existsSync(join(targetCommandsDir, 'command2.md'))).toBe(true);

      const command1Content = readFileSync(join(targetCommandsDir, 'command1.md'), 'utf-8');
      expect(command1Content).toBe('Command 1 content');
    });

    it('should copy nested directories recursively', async () => {
      await command.execute(projectDir, { force: true });

      const nestedPath = join(projectDir, '.shirokuma', 'commands', 'subdir', 'nested.md');
      expect(existsSync(nestedPath)).toBe(true);

      const nestedContent = readFileSync(nestedPath, 'utf-8');
      expect(nestedContent).toBe('Nested command content');
    });

    it('should handle missing source directories gracefully', async () => {
      // Remove agents directory to simulate missing source
      rmSync(join(packageRoot, '.shirokuma', 'agents'), { recursive: true, force: true });

      // Should not throw, just skip missing directory
      await expect(
        command.execute(projectDir, { force: true })
      ).resolves.not.toThrow();

      // Commands should still be copied
      const targetCommandsDir = join(projectDir, '.shirokuma', 'commands');
      expect(existsSync(targetCommandsDir)).toBe(true);
    });

    it('should not overwrite existing files without force option', async () => {
      // First setup
      await command.execute(projectDir, { force: true });

      // Modify a file
      const agent1Path = join(projectDir, '.shirokuma', 'agents', 'agent1.md');
      writeFileSync(agent1Path, 'Modified content');

      // Second setup without force
      await command.execute(projectDir, { force: false });

      // File should still have modified content
      const content = readFileSync(agent1Path, 'utf-8');
      expect(content).toBe('Modified content');
    });

    it('should overwrite existing files with force option', async () => {
      // First setup
      await command.execute(projectDir, { force: true });

      // Modify a file
      const agent1Path = join(projectDir, '.shirokuma', 'agents', 'agent1.md');
      writeFileSync(agent1Path, 'Modified content');

      // Update source file in package
      const sourceAgent1Path = join(packageRoot, '.shirokuma', 'agents', 'agent1.md');
      writeFileSync(sourceAgent1Path, 'Updated agent 1 content');

      // Second setup with force
      await command.execute(projectDir, { force: true });

      // File should have new content from package
      const content = readFileSync(agent1Path, 'utf-8');
      expect(content).toBe('Updated agent 1 content');
    });
  });

  describe('MCP name validation', () => {
    let projectDir: string;

    beforeEach(() => {
      projectDir = join(testDir, 'test-project');
      mkdirSync(projectDir);
    });

    it('should accept valid MCP names', async () => {
      const validNames = [
        'shirokuma-kb',
        'my-kb',
        'kb2',
        'a',
        'test-123',
        'my-custom-kb-name'
      ];

      for (const name of validNames) {
        await expect(
          command.execute(projectDir, { force: true, mcpName: name })
        ).resolves.not.toThrow();
      }
    });

    it('should reject empty MCP name', async () => {
      await expect(
        command.execute(projectDir, { force: true, mcpName: '' })
      ).rejects.toThrow('MCP name cannot be empty');
    });

    it('should reject MCP name with uppercase letters', async () => {
      await expect(
        command.execute(projectDir, { force: true, mcpName: 'MyKB' })
      ).rejects.toThrow('Invalid MCP name');
    });

    it('should reject MCP name with spaces', async () => {
      await expect(
        command.execute(projectDir, { force: true, mcpName: 'my kb' })
      ).rejects.toThrow(/Invalid MCP name/);
    });

    it('should reject MCP name with underscores', async () => {
      await expect(
        command.execute(projectDir, { force: true, mcpName: 'my_kb' })
      ).rejects.toThrow(/Invalid MCP name/);
    });

    it('should reject MCP name starting with hyphen', async () => {
      await expect(
        command.execute(projectDir, { force: true, mcpName: '-mykb' })
      ).rejects.toThrow(/Invalid MCP name/);
    });

    it('should reject MCP name ending with hyphen', async () => {
      await expect(
        command.execute(projectDir, { force: true, mcpName: 'mykb-' })
      ).rejects.toThrow(/Invalid MCP name/);
    });

    it('should reject MCP name with special characters', async () => {
      await expect(
        command.execute(projectDir, { force: true, mcpName: 'my@kb' })
      ).rejects.toThrow(/Invalid MCP name/);
    });

    it('should reject MCP name that is too long', async () => {
      const longName = 'a'.repeat(51);
      await expect(
        command.execute(projectDir, { force: true, mcpName: longName })
      ).rejects.toThrow('MCP name too long');
    });

    it('should provide helpful error message for invalid names', async () => {
      try {
        await command.execute(projectDir, { force: true, mcpName: 'Invalid_Name' });
        throw new Error('Should have thrown');
      } catch (error) {
        expect(error.message).toContain('Invalid MCP name');
        expect(error.message).toContain('lowercase letters');
        expect(error.message).toContain('Examples:');
      }
    });
  });
});
