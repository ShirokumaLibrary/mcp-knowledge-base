---
description: Create a new Claude Code slash command
argument-hint: "<command-name> <description>"
---

# ai-create-command - Create custom slash commands

## Usage
```
/ai-create-command <command-name> <description>
```

## Task

@.shirokuma/configs/lang.md

<ultrathink>
The user wants to create a new slash command. I need to:
1. Parse the command name and description from arguments
2. Determine what tools the command will need
3. Create a properly formatted command file with YAML frontmatter
4. Include appropriate placeholders for dynamic content and internationalization
</ultrathink>

Reference documentation: https://docs.anthropic.com/en/docs/claude-code/slash-commands#custom-slash-commands

Create a new slash command file based on the following Claude Code specifications.

**IMPORTANT**: 
1. Always include the following in the Task section of the created command:
   ```
   @.shirokuma/configs/lang.md
   ```
2. For internationalization, use placeholder notation `[text]` for any user-facing text that should be translated.
3. Structure content in English but mark translatable strings clearly.

### File Structure Requirements

1. **File location**: `.claude/commands/<command-name>.md`
   - Project-level: `.claude/commands/` (for project-specific commands)
   - User-level: `~/.claude/commands/` (for global commands)

2. **YAML Front Matter** (optional but recommended):
   ```yaml
   ---
   allowed-tools: Tool1, Tool2(function:*), Tool3
   description: Brief description shown in command list
   argument-hint: "<expected-arguments>"
   ---
   ```

3. **Allowed Tools Format**:
   - Basic: `Read, Write, Bash`
   - With specific functions: `Bash(git add:*), Bash(npm test:*)`
   - Wildcards: `Bash(git:*)` allows all git subcommands

### Dynamic Content Features

1. **`$ARGUMENTS`** - Inserts user-provided arguments
   - Example: `/my-command foo.js` → `$ARGUMENTS` becomes `foo.js`

2. **Dynamic bash execution** - Executes bash command and inserts output
   - Syntax: exclamation mark followed by backticks with command
   - Example: exclamation+backtick+git status+backtick
   - Command must be wrapped in backticks after the exclamation mark

3. **`@filepath`** - Inserts file contents
   - Example: `@package.json` includes package.json content
   - Can be combined: `@$ARGUMENTS` to read file from user input

### Command Naming Conventions

- Command name = filename without `.md` extension
- Subdirectories create namespaces: `tools/format.md` → `/tools:format`
- Best practices:
  - Use kebab-case: `my-command.md`
  - Prefix AI commands with `ai-`: `ai-optimize.md`
  - Keep names short but descriptive

### Example Templates

#### Simple Command
```markdown
---
description: Format code files
argument-hint: "<filepath>"
---

# format-code - Format code files

## Task

Note: Respond to the user in their language.

Format the file at $ARGUMENTS using appropriate formatter.

Display: "[Formatting]: $ARGUMENTS"
Result: "[Success: File formatted]" or "[Error: reason]"
```

#### Command with Bash Execution
```markdown
---
allowed-tools: Bash(prettier:*), Read, Write
description: Format JavaScript files
---

# format-js - Format JavaScript files

## Context
- Current directory: [exclamation+backtick+pwd+backtick]
- Available files: [exclamation+backtick+ls -la *.js+backtick]

## Task

Note: Respond to the user in their language.

1. Check file: @$ARGUMENTS
2. Format using prettier
3. Save formatted version

Output messages:
- "[Checking]: $ARGUMENTS"
- "[Formatting with Prettier]"
- "[Saved]: $ARGUMENTS"
```

#### Complex Command with Multiple Tools
```markdown
---
allowed-tools: Read, Write, Bash(git:*), Bash(npm:*)
description: Prepare code for commit
argument-hint: "<commit-message>"
---

# prepare-commit - Prepare code for commit

## Context
- Git status: [exclamation+backtick+git status --short+backtick]
- Branch: [exclamation+backtick+git branch --show-current+backtick]

## Task

Note: Respond to the user in their language.

Execute preparation steps:
1. Run formatters - display "[Running formatters]"
2. Run tests - display "[Running tests]"
3. Stage changes - display "[Staging changes]"
4. Create commit - display "[Creating commit]: $ARGUMENTS"

Final message: "[Commit created successfully]"
```

### Output Example

<ultrathink>
Based on the user's input, I need to:
1. Extract command name: check-types
2. Extract description: Run TypeScript type checking
3. Determine appropriate tools (likely Bash for tsc)
4. Create a command that runs type checking and reports results
</ultrathink>

For command: `/ai-create-command check-types "Run TypeScript type checking"`

Should create: `.claude/commands/check-types.md`
```markdown
---
allowed-tools: Bash(npx tsc:*), Read
description: Run TypeScript type checking
---

# check-types - Run TypeScript type checking

## Usage
```
/check-types
```

## Context
- TypeScript config: @tsconfig.json
- Current directory: [exclamation+backtick+pwd+backtick]

## Task

Note: Respond to the user in their language.

Run TypeScript compiler in check mode:
1. Execute `npx tsc --noEmit`
2. Report any type errors found
3. Suggest fixes if possible
```

### Internationalization Guidelines

When creating commands that output text to users:

1. **Use placeholder notation** for translatable strings:
   ```
   "[Work completed]" → AI translates to appropriate language
   "[Error]: specific error" → Translate error part, keep details
   ```

2. **Structure vs Content**:
   - Keep command structure in English
   - Mark user-facing text with `[brackets]`
   - Technical terms can remain in English

3. **Example transformations**:
   - English: "Work completed"
   - Japanese: "[Work completed]" (translated)
   - Spanish: "Trabajo completado"

Report creation success: "✅ Created command: /check-types at .claude/commands/check-types.md"