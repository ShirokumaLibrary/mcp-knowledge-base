# ai-config - Generate Project Configuration

## Usage
```
/ai-config [action]
```

Actions:
- `/ai-config generate` - Analyze project and generate configuration
- `/ai-config update` - Update existing configuration
- `/ai-config validate` - Validate current configuration

## Task

@.shirokuma/configs/lang.md

### Purpose

This command analyzes the current project structure and generates or updates the `.claude/agents/PROJECT_CONFIGURATION.markdown` file, which contains comprehensive project-specific settings and patterns for all AI agents.

### Workflow

#### Generate Configuration
```yaml
1. Analyze project structure
2. Detect technology stack
3. Identify conventions and patterns
4. Find MCP instance if exists
5. Generate configuration file
6. Save to .claude/agents/PROJECT_CONFIGURATION.markdown
```

#### Update Configuration
```yaml
1. Read existing configuration
2. Re-analyze project
3. Merge new findings
4. Preserve manual customizations
5. Update configuration file
```

#### Validate Configuration
```yaml
1. Check configuration exists
   - Verify .claude/agents/PROJECT_CONFIGURATION.markdown exists
   - Check YAML syntax is valid
   - Ensure required sections present

2. Verify all referenced files
   - methodology_file exists
   - project_instructions exists
   - example_files exist

3. Validate MCP connections
   - Test MCP prefix format
   - Verify tool list completeness
   - Check MCP server accessibility

4. Test commands if possible
   - Run build_command with --dry-run or --help
   - Check if test_command executable exists
   - Verify lint_command availability
   - Confirm package manager presence

5. Report validation results
   - List all found issues
   - Suggest fixes for problems
   - Indicate confidence level
   - Mark TODO items needing attention
```

**Validation Output Example**:
```markdown
## Configuration Validation Report

### ✅ Valid
- Project configuration file exists
- YAML syntax is correct
- All referenced files found

### ⚠️ Warnings
- build_command not tested (no --dry-run option)
- MCP server not running (cannot verify tools)

### ❌ Issues
- TODO: test_command needs to be configured
- File not found: docs/architecture.md

### Recommendations
1. Update test_command in conventions section
2. Start MCP server to verify tool list
3. Create missing documentation files
```

### Agent Selection

The command uses the specialized config-investigator agent to perform deep project analysis.

```
Task: Use config-investigator to analyze project and generate configuration
Purpose: Create project-specific settings for AI agents
Operations:
  1. Scan project structure
  2. Detect languages and frameworks
  3. Find build/test commands
  4. Identify naming conventions
  5. Detect MCP configurations
  6. Generate comprehensive config
```

### Configuration Structure

The generated markdown file includes comprehensive configuration with embedded YAML:

```yaml
project:
  name: "Project Name"
  description: "Project Description"
  language_env: "LANGUAGE_ENV_VAR"
  
mcp:
  prefix: "mcp__instance-name__"
  tools: [list of available tools]

references:
  methodology_file: "methodology.md"
  project_instructions: "instructions.md"
  
conventions:
  test_framework: "detected framework"
  test_command: "detected command"
  lint_command: "detected command"
  build_command: "detected command"
  file_naming: "detected pattern"
  
tech_stack:
  language: "detected language"
  runtime: "detected runtime"
  package_manager: "detected manager"
  frameworks: [detected frameworks]
  
quality_standards:
  review_threshold: 85
  test_coverage_target: 80
  
development_principles:
  - "Detected principles"
```

### Error Handling

- If no project detected, create minimal config
- If MCP not found, omit MCP section
- If commands not found, use placeholders
- Always create valid YAML structure

### Success Indicators

- Configuration file created/updated
- All project specifics captured
- Valid YAML syntax
- Agent compatibility verified

This command ensures all AI agents have accurate project context for optimal performance.

### Generic Project Template

For new projects or manual configuration, use this comprehensive template:

```yaml
# Generic Project Configuration Template
# Save as: .claude/agents/PROJECT_CONFIGURATION.markdown

project:
  name: "PROJECT_NAME"
  description: "Brief project description"
  version: "0.1.0"
  language_env: "LANGUAGE_ENV_VAR"  # Optional environment variable for language
  
references:
  methodology_file: "README.md"  # Or your main docs
  project_instructions: "CONTRIBUTING.md"  # Or your guidelines
  
conventions:
  # Commands - Update these based on your project
  test_command: "# TODO: Add test command"
  lint_command: "# TODO: Add lint command"
  build_command: "# TODO: Add build command"
  # Type checking may be included in build process or as separate command
  
  # Naming conventions
  file_naming: "kebab-case"  # or camelCase, PascalCase, snake_case
  
  # Code style
  indent_style: "space"  # or tab
  indent_size: 2  # or 4
  quote_style: "single"  # or double

tech_stack:
  language: "Unknown"  # Update with actual language
  runtime: "Unknown"  # Update with runtime
  package_manager: "Unknown"  # npm, pip, cargo, etc.
  frameworks: []  # Add frameworks as discovered

quality_standards:
  review_threshold: 85
  test_coverage_target: 80
  max_complexity: 10
  
development_principles:
  - "Clean Code"
  - "SOLID Principles"
  - "Test-Driven Development"
  - "Documentation First"
  - "# TODO: Add project-specific principles"
```

#### Template Usage

1. Run `/ai-config generate` to auto-detect your project settings
2. Or manually create `.claude/agents/PROJECT_CONFIGURATION.markdown` with the template
3. Replace all `# TODO:` items with actual values
4. Update placeholders like `PROJECT_NAME` and `Unknown`
5. Add project-specific sections as needed
6. Run `/ai-config validate` to check configuration

The AI agents will gracefully handle TODO items and provide guidance when commands are needed but not yet configured.