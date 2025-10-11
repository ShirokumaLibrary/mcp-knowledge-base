---
id: 189
type: spec
title: "[Feature] Package Distribution System for Agents and Commands"
status: Open
priority: MEDIUM
description: "Specification for bundling and distributing .shirokuma/agents and .shirokuma/commands with shirokuma-kb package, including CLI setup command with placeholder replacement and environment configuration"
tags: ["feature","spec","setup","packaging","distribution"]
related: [184]
keywords: {"package":1,"setup":1,"mcp":0.9,"configuration":0.9,"distribution":0.9}
concepts: {"package management":0.95,"configuration management":0.9,"automation":0.85,"template processing":0.85,"cli tool":0.8}
createdAt: 2025-10-11T03:53:33.000Z
updatedAt: 2025-10-11T03:53:33.000Z
---

# Specification: Package Distribution System for Agents and Commands

**Created**: 2025-10-11  
**Status**: Open  
**Priority**: MEDIUM  
**Phase**: Complete (Requirements + Design + Tasks)  
**Related Issue**: #184

---

## Phase 1: Requirements

### 1.1 Introduction

This specification defines a package distribution system for shirokuma-kb that bundles agent and command definitions with the package and provides a CLI setup command to configure user projects. The system solves the critical issue of MCP tool name inconsistency across different user configurations.

**Problem Statement:**
Currently, MCP tool names in command/agent definitions (e.g., `mcp__shirokuma-kb__*`) depend on user's `.mcp.json` configuration. When users define different MCP instance names, distributed commands and agents fail to work correctly.

**Solution Approach:**
Provide an integrated setup system that:
- Bundles master files with placeholders in `.shirokuma/` directory
- Generates environment-specific files in `.claude/` directory
- Manages environment variables for data and export directories
- Supports single MCP instance configuration (simplified architecture)

### 1.2 Functional Requirements (EARS Format)

#### FR-1: Package File Inclusion
**WHEN** the shirokuma-kb package is published  
**THEN** the package SHALL include the following directories:
- `.shirokuma/agents/*` - All agent definitions with placeholders
- `.shirokuma/commands/*` - All command definitions with placeholders
- `.shirokuma/templates/.mcp.json` - MCP configuration template
- `.shirokuma/templates/.env` - Environment variable template

#### FR-2: Setup Command - Basic Execution
**WHEN** user executes `shirokuma-kb setup`  
**THEN** the system SHALL:
- Copy master files from package to project's `.shirokuma/` directory
- Generate `.env` file from template if not exists
- Integrate MCP configuration into `.mcp.json`
- Replace placeholders and generate files in `.claude/` directory
- Create necessary directories (`.shirokuma/data/`, `docs/export/`)
- Execute database migration (`shirokuma-kb migrate`)

#### FR-3: Setup Command - Force Overwrite
**WHEN** user executes `shirokuma-kb setup --force`  
**THEN** the system SHALL overwrite existing files without confirmation prompts

#### FR-4: Setup Command - Custom MCP Name
**WHEN** user executes `shirokuma-kb setup --mcp-name <custom-name>`  
**THEN** the system SHALL:
- Replace `{{MCP_NAME}}` placeholder with `mcp__<custom-name>`
- Configure `.mcp.json` with the specified MCP instance name

#### FR-5: Setup Command - Rebuild Files
**WHEN** user executes `shirokuma-kb setup --rebuild`  
**THEN** the system SHALL:
- Read master files from `.shirokuma/agents/` and `.shirokuma/commands/`
- Replace placeholders based on current `.mcp.json` configuration
- Regenerate all files in `.claude/agents/` and `.claude/commands/`

#### FR-6: Placeholder Replacement
**WHEN** the system processes template files  
**THEN** the system SHALL replace the following placeholders:
- `{{MCP_NAME}}` → `mcp__shirokuma-kb` (or custom name)
- `{{WORKSPACE_FOLDER}}` → Project root absolute path

**Example:**
```markdown
# Before (master file in .shirokuma/)
allowed-tools: 
  - {{MCP_NAME}}__create_item
  - {{MCP_NAME}}__get_item

# After (generated file in .claude/)
allowed-tools: 
  - mcp__shirokuma-kb__create_item
  - mcp__shirokuma-kb__get_item
```

#### FR-7: Environment Variable Configuration
**WHEN** the system creates `.env` file  
**THEN** the file SHALL contain:
```bash
# shirokuma-kb data directory
SHIROKUMA_DATA_DIR=${workspaceFolder}/.shirokuma/data

# Export directory (optional)
# When set, items are automatically exported to Markdown files
SHIROKUMA_EXPORT_DIR=${workspaceFolder}/docs/export
```

#### FR-8: MCP Configuration Integration
**WHEN** the system processes `.mcp.json`  
**IF** `.mcp.json` exists  
**THEN** the system SHALL:
- Add or update `shirokuma-kb` server section
- Preserve other existing MCP server configurations
- Include environment variable references

**IF** `.mcp.json` does not exist  
**THEN** the system SHALL create new file with template configuration:
```json
{
  "mcpServers": {
    "shirokuma-kb": {
      "command": "shirokuma-kb",
      "args": ["serve"],
      "env": {
        "SHIROKUMA_DATA_DIR": "${workspaceFolder}/.shirokuma/data",
        "SHIROKUMA_EXPORT_DIR": "${workspaceFolder}/docs/export"
      }
    }
  }
}
```

#### FR-9: Verification Command
**WHEN** user executes `shirokuma-kb verify-setup`  
**THEN** the system SHALL check and report:
- MCP connection status
- Database connection status
- Environment variable configuration
- Master files existence (`.shirokuma/`)
- Generated files existence (`.claude/`)
- Placeholder replacement status
- Export directory existence

### 1.3 Non-Functional Requirements

#### NFR-1: Compatibility
- SHALL support Node.js 18+ and npm 9+
- SHALL work on Windows, macOS, and Linux

#### NFR-2: File Safety
- SHALL prompt for confirmation before overwriting existing files (unless `--force` flag is used)
- SHALL create backup of `.mcp.json` before modification

#### NFR-3: Error Handling
- SHALL provide clear error messages for common issues:
  - Missing dependencies
  - Invalid project structure
  - Permission errors
  - Invalid MCP configuration

#### NFR-4: Performance
- Setup command SHALL complete within 10 seconds for typical project

#### NFR-5: Git Integration
- Generated files in `.claude/` SHALL be excluded from Git (via `.gitignore`)
- Data directory SHALL be excluded from Git
- `.env` file SHALL be excluded from Git

### 1.4 Acceptance Criteria

- [ ] User can install shirokuma-kb package and run `shirokuma-kb setup` successfully
- [ ] After setup, user's project has proper directory structure and configuration
- [ ] Agent and command definitions work with user's MCP instance name
- [ ] User can edit master files in `.shirokuma/` and rebuild with `--rebuild` flag
- [ ] Verification command reports all configuration correctly
- [ ] Generated files in `.claude/` work seamlessly with Claude Code
- [ ] Environment variables are properly configured and recognized by MCP server

---

## Phase 2: Design

### 2.1 Architecture Overview

The package distribution system follows a **master-slave file architecture**:

1. **Master Files** (`.shirokuma/`): Version-controlled, portable, contain placeholders
2. **Slave Files** (`.claude/`): Generated, environment-specific, Git-ignored

**Key Design Decisions:**

- **Single MCP Instance**: Simplified from previous PROD/DEV separation. Environment switching handled via `SHIROKUMA_DATA_DIR` environment variable.
- **Placeholder-Based Generation**: Allows portable master files that adapt to user's environment.
- **File Copy vs. Symbolic Links**: Use actual file copies instead of symlinks for better cross-platform compatibility.

### 2.2 Component Design

#### 2.2.1 Setup Command Handler (`src/cli/setup.ts`)

**Responsibilities:**
- Parse command-line arguments
- Orchestrate setup workflow
- Handle user prompts and confirmations
- Coordinate file operations

**Key Methods:**
```typescript
interface SetupOptions {
  force?: boolean;
  mcpName?: string;
  rebuild?: boolean;
}

class SetupCommand {
  async execute(options: SetupOptions): Promise<void>
  private async checkProjectStructure(): Promise<boolean>
  private async copyMasterFiles(force: boolean): Promise<void>
  private async createEnvFile(): Promise<void>
  private async integrateMcpConfig(mcpName: string): Promise<void>
  private async generateClaudeFiles(mcpName: string): Promise<void>
  private async createDirectories(): Promise<void>
  private async runMigration(): Promise<void>
}
```

**Workflow:**
1. Validate project structure
2. Copy master files to `.shirokuma/`
3. Create/update `.env` file
4. Integrate MCP configuration
5. Generate `.claude/` files with placeholder replacement
6. Create data and export directories
7. Run database migration
8. Display success message with next steps

#### 2.2.2 Placeholder Replacement Engine

**Responsibilities:**
- Parse template files
- Replace placeholders with environment-specific values
- Handle nested directory structures

**Implementation:**
```typescript
interface PlaceholderConfig {
  MCP_NAME: string;           // e.g., "mcp__shirokuma-kb"
  WORKSPACE_FOLDER: string;   // Project root path
}

class PlaceholderEngine {
  private config: PlaceholderConfig;
  
  constructor(mcpName: string, workspaceRoot: string) {
    this.config = {
      MCP_NAME: `mcp__${mcpName}`,
      WORKSPACE_FOLDER: workspaceRoot
    };
  }
  
  replace(content: string): string {
    return content
      .replace(/\{\{MCP_NAME\}\}/g, this.config.MCP_NAME)
      .replace(/\{\{WORKSPACE_FOLDER\}\}/g, this.config.WORKSPACE_FOLDER);
  }
  
  async processDirectory(
    sourceDir: string,
    targetDir: string
  ): Promise<void> {
    // Recursively process all files in directory
  }
}
```

**Supported Placeholders:**
- `{{MCP_NAME}}` - MCP tool prefix (default: `mcp__shirokuma-kb`)
- `{{WORKSPACE_FOLDER}}` - Project root absolute path

#### 2.2.3 MCP Configuration Manager

**Responsibilities:**
- Read and parse existing `.mcp.json`
- Merge new configuration with existing
- Write updated configuration safely

**Implementation:**
```typescript
interface McpServerConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}

class McpConfigManager {
  async read(filePath: string): Promise<McpConfig | null>
  async merge(
    existing: McpConfig,
    serverName: string,
    config: McpServerConfig
  ): Promise<McpConfig>
  async write(filePath: string, config: McpConfig): Promise<void>
  async backup(filePath: string): Promise<string>
}
```

**Merge Strategy:**
- If `shirokuma-kb` server exists: Update configuration
- If other servers exist: Add `shirokuma-kb` alongside
- If file doesn't exist: Create new with template

#### 2.2.4 File System Operations

**Responsibilities:**
- Copy directories recursively
- Create directories with proper permissions
- Handle file conflicts

**Implementation:**
```typescript
class FileOperations {
  async copyDir(
    source: string,
    target: string,
    options: { overwrite: boolean }
  ): Promise<void>
  
  async ensureDir(path: string): Promise<void>
  
  async fileExists(path: string): Promise<boolean>
  
  async promptOverwrite(filePath: string): Promise<boolean>
}
```

#### 2.2.5 Verification Command Handler

**Responsibilities:**
- Check all setup components
- Report status and issues
- Provide actionable recommendations

**Checks:**
```typescript
interface VerificationResult {
  category: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  recommendation?: string;
}

class VerifyCommand {
  async execute(): Promise<VerificationResult[]>
  
  private async checkMcpConnection(): Promise<VerificationResult>
  private async checkDatabaseConnection(): Promise<VerificationResult>
  private async checkEnvironmentVariables(): Promise<VerificationResult>
  private async checkMasterFiles(): Promise<VerificationResult>
  private async checkGeneratedFiles(): Promise<VerificationResult>
  private async checkPlaceholderReplacement(): Promise<VerificationResult>
  private async checkExportDirectory(): Promise<VerificationResult>
}
```

### 2.3 Data Flow

```
Package Install
    ↓
User runs: shirokuma-kb setup
    ↓
┌─────────────────────────────────────┐
│ 1. Copy Master Files                │
│    node_modules/.shirokuma/         │
│    → project/.shirokuma/            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. Create .env                      │
│    - SHIROKUMA_DATA_DIR             │
│    - SHIROKUMA_EXPORT_DIR           │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. Integrate .mcp.json              │
│    - Add shirokuma-kb server        │
│    - Configure env vars             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. Generate .claude/ Files          │
│    - Read .shirokuma/*              │
│    - Replace placeholders           │
│    - Write to .claude/*             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. Create Directories               │
│    - .shirokuma/data/               │
│    - docs/export/                   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 6. Run Migration                    │
│    shirokuma-kb migrate             │
└─────────────────────────────────────┘
    ↓
Setup Complete ✓
```

### 2.4 File Structure

```
user-project/
├── .shirokuma/                    # Master files (Git-tracked)
│   ├── agents/                    # Agent definitions (with placeholders)
│   │   ├── shirokuma-programmer.md
│   │   ├── shirokuma-reviewer.md
│   │   └── ...
│   ├── commands/                  # Command definitions (with placeholders)
│   │   ├── start.md
│   │   ├── finish.md
│   │   └── ...
│   ├── data/                      # Database storage (Git-ignored)
│   │   └── shirokuma.db
│   └── templates/                 # Configuration templates (from package)
│       ├── .mcp.json
│       └── .env
├── .claude/                       # Generated files (Git-ignored)
│   ├── agents/                    # Replaced agent definitions
│   │   ├── shirokuma-programmer.md
│   │   └── ...
│   └── commands/                  # Replaced command definitions
│       ├── start.md
│       └── ...
├── docs/
│   └── export/                    # Auto-exported items (Git-tracked)
│       ├── issue/
│       ├── session/
│       └── .system/
├── .env                           # Environment variables (Git-ignored)
├── .mcp.json                      # MCP configuration (Git-tracked)
└── .gitignore                     # Git ignore rules
```

### 2.5 Error Handling Strategy

**Error Categories:**

1. **Pre-flight Checks** (before any modifications)
   - Node.js version check
   - Package installation check
   - File system permissions check

2. **Operational Errors** (during setup)
   - File copy failures → Rollback and report
   - Configuration merge conflicts → Backup and prompt
   - Migration failures → Report and provide manual steps

3. **Validation Errors** (after setup)
   - Missing files → List missing items
   - Invalid configurations → Show diff and expected format
   - MCP connection failures → Provide troubleshooting steps

**Error Recovery:**
- Create backups before destructive operations
- Provide rollback mechanism for failed setups
- Log detailed error information to `.shirokuma/setup.log`

### 2.6 Testing Strategy

Following project's TDD standards (Steering #131, #135):

**Unit Tests:**
- PlaceholderEngine: Replacement logic
- McpConfigManager: JSON parsing and merging
- FileOperations: File system operations

**Integration Tests:**
- Setup command end-to-end workflow
- Rebuild command with existing files
- Verification command checks

**Test Environment:**
- Use temporary directories for file operations
- Mock MCP server for connection tests
- Test on all supported platforms (Windows, macOS, Linux)

**Coverage Goals:**
- Unit tests: 80%+ coverage
- Integration tests: Critical paths covered
- Manual testing: Platform-specific edge cases

---

## Phase 3: Tasks

### Task Breakdown by Implementation Phases

#### Phase 1: Basic Setup (Core Functionality)

**Task 1.1: Project Structure and Packaging** [4 hours]
- Update `package.json` to include `.shirokuma/` directories in package files
- Create `.shirokuma/templates/` directory with template files
- Add `.gitignore` rules for generated files
- **Testing**: Verify package includes correct files after `npm pack`

**Task 1.2: Placeholder Engine Implementation** [3 hours]
- Implement `PlaceholderEngine` class with replacement logic
- Support `{{MCP_NAME}}` and `{{WORKSPACE_FOLDER}}` placeholders
- Add recursive directory processing
- **Testing**: Unit tests for placeholder replacement with various inputs

**Task 1.3: File Operations Module** [3 hours]
- Implement `FileOperations` class for copy/create operations
- Add overwrite confirmation prompts
- Handle file system errors gracefully
- **Testing**: Unit tests with temporary directories

**Task 1.4: MCP Configuration Manager** [4 hours]
- Implement `McpConfigManager` class for JSON operations
- Add backup creation before modifications
- Implement merge strategy for existing configurations
- **Testing**: Unit tests with various `.mcp.json` scenarios

**Task 1.5: Setup Command - Basic Flow** [6 hours]
- Implement `SetupCommand` class with basic workflow
- Add argument parsing for basic flags
- Implement step-by-step setup process
- Add progress reporting to user
- **Testing**: Integration test for basic setup flow

**Task 1.6: Environment File Generation** [2 hours]
- Create `.env` template with SHIROKUMA variables
- Implement environment file creation logic
- Handle existing `.env` files (skip or merge)
- **Testing**: Test .env creation and existing file handling

**Task 1.7: Directory Creation** [2 hours]
- Implement data directory creation (`.shirokuma/data/`)
- Implement export directory creation (`docs/export/`)
- Set proper permissions
- **Testing**: Verify directory creation and permissions

**Task 1.8: Migration Integration** [2 hours]
- Add migration execution to setup workflow
- Handle migration errors and report
- **Testing**: Test migration execution after setup

**Task 1.9: End-to-End Testing - Phase 1** [4 hours]
- Test complete setup flow on clean project
- Test setup with existing `.mcp.json`
- Test setup with existing `.shirokuma/` files
- Verify generated files work with Claude Code
- **Testing**: Manual testing on multiple platforms

**Phase 1 Checkpoint**: Basic setup command working end-to-end

---

#### Phase 2: Rebuild Functionality

**Task 2.1: Rebuild Command Implementation** [3 hours]
- Add `--rebuild` flag to setup command
- Implement rebuild-only logic (skip file copying)
- Read current MCP configuration for placeholder values
- **Testing**: Unit tests for rebuild logic

**Task 2.2: Incremental File Updates** [3 hours]
- Detect which files changed in `.shirokuma/`
- Only regenerate changed files in `.claude/`
- Add change detection logging
- **Testing**: Test rebuild with partial file changes

**Task 2.3: End-to-End Testing - Phase 2** [3 hours]
- Test rebuild after editing master files
- Test rebuild with different MCP names
- Verify incremental updates work correctly
- **Testing**: Integration tests for rebuild scenarios

**Phase 2 Checkpoint**: Rebuild command working correctly

---

#### Phase 3: Customization Support

**Task 3.1: Custom MCP Name Support** [3 hours]
- Add `--mcp-name` flag to setup command
- Update PlaceholderEngine to use custom name
- Update McpConfigManager to use custom name
- **Testing**: Test setup with various custom MCP names

**Task 3.2: Custom Name Validation** [2 hours]
- Add validation for MCP name format
- Provide helpful error messages for invalid names
- **Testing**: Test with invalid MCP names

**Task 3.3: End-to-End Testing - Phase 3** [2 hours]
- Test setup with custom MCP names
- Verify generated files use custom names correctly
- **Testing**: Integration tests with custom names

**Phase 3 Checkpoint**: Custom MCP name support working

---

#### Phase 4: Verification and Quality Assurance

**Task 4.1: Verification Command Implementation** [4 hours]
- Implement `VerifyCommand` class
- Add all verification checks (MCP, database, files, etc.)
- Format verification results for user
- **Testing**: Unit tests for each verification check

**Task 4.2: Verification Reporting** [2 hours]
- Add colored output for pass/warn/fail status
- Provide actionable recommendations
- Add detailed logging option
- **Testing**: Test verification output formatting

**Task 4.3: Error Recovery Mechanisms** [3 hours]
- Implement rollback for failed setups
- Add setup.log for debugging
- Provide manual recovery steps
- **Testing**: Test rollback scenarios

**Task 4.4: Documentation** [3 hours]
- Update README.md with setup instructions
- Create troubleshooting guide
- Document placeholder system
- Add examples for common scenarios

**Task 4.5: Cross-Platform Testing** [4 hours]
- Test on Windows with PowerShell and CMD
- Test on macOS
- Test on Linux (Ubuntu, Fedora)
- Fix platform-specific issues
- **Testing**: Manual testing on all platforms

**Task 4.6: Final Integration Testing** [4 hours]
- Test complete workflow on fresh projects
- Test all command flags and combinations
- Verify with real Claude Code usage
- Performance testing (setup should complete <10s)
- **Testing**: End-to-end integration tests

**Phase 4 Checkpoint**: All features complete and verified

---

### Task Summary

**Total Estimated Hours**: 62 hours (~8 days)

**Breakdown by Phase:**
- Phase 1 (Basic Setup): 30 hours
- Phase 2 (Rebuild): 9 hours
- Phase 3 (Customization): 7 hours
- Phase 4 (Verification): 16 hours

**Dependencies:**
- Phase 2 depends on Phase 1 completion
- Phase 3 can be parallel with Phase 2
- Phase 4 requires all previous phases

**Risk Areas:**
- Cross-platform file system differences (Windows vs Unix)
- MCP configuration merge conflicts
- Migration failures on fresh databases
- Placeholder replacement edge cases

**Testing Strategy:**
- TDD approach: Write tests before implementation
- Unit tests for all core modules
- Integration tests for command workflows
- Manual testing for platform-specific issues
- Final testing with real Claude Code environment

---

## References

- **Issue #184**: Original feature request
- **Steering #128**: SHIROKUMA Project Standards
- **Steering #131**: Testing Standards
- **Steering #136**: Coding Conventions
- **Steering #129**: Git Workflow Standards