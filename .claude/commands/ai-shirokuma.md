---
allowed-tools: Task, Read, Grep, mcp__shirokuma-knowledge-base__get_items, mcp__shirokuma-knowledge-base__get_item_detail, mcp__shirokuma-knowledge-base__create_item
description: System consistency checker - Ensures harmony between commands, agents, and rules
argument-hint: "[check-type]"
---

# ai-shirokuma - System Consistency Checker

## Usage
```
/ai-shirokuma [check-type]
```

Examples:
- `/ai-shirokuma` - Comprehensive system consistency check
- `/ai-shirokuma commands` - Check command definitions and interactions
- `/ai-shirokuma agents` - Verify agent roles and boundaries
- `/ai-shirokuma rules` - Validate rule alignment across files
- `/ai-shirokuma memory-flow` - Check AI memory management flow

## Task

@.shirokuma/configs/lang.md

Analyze the check type requested: $ARGUMENTS

### Primary Function: System Consistency Check

Execute the following workflow using the shirokuma-system-harmonizer agent:

1. **Scope Determination**
   - If no arguments: Perform comprehensive check
   - If specific type: Focus on that area (commands/agents/rules/memory-flow)

2. **Launch System Harmonizer**
   ```
   Task: Use shirokuma-system-harmonizer to check system consistency
   Scope: $ARGUMENTS or 'all'
   Report: Detailed analysis with actionable fixes
   ```

3. **Consistency Analysis**
   The harmonizer will:
   - Read relevant files:
     - .claude/commands/*
     - .claude/agents/*
     - SHIROKUMA.md, SHIROKUMA.md.example, SHIROKUMA.md.ja.example
     - CLAUDE.md, CLAUDE.md.example, CLAUDE.md.ja.example
   - Compare definitions and purposes
   - Identify overlaps, gaps, and contradictions
   - Generate harmony score
   - Check consistency between language versions

4. **Report Format**
   ```
   ## 🔍 System Consistency Report
   
   ### Harmony Score: X.XX/1.00
   
   ### Issues Found:
   - [Type]: Description
     Location: file:line
     Fix: Proposed solution
   
   ### Recommendations:
   - Priority actions for improvement
   
   ### Validation Results:
   ✓ Commands aligned
   ✓ Agents have clear boundaries
   ✓ Rules consistently applied
   ```

5. **Fix Approval Workflow**
   If issues are found:
   - Present fixes for user approval
   - Execute approved changes
   - Document in decisions type
   - Update affected files

### Key Principles

1. **Single Responsibility**: This command ONLY checks consistency
2. **Expert Delegation**: Uses specialized harmonizer agent
3. **Actionable Output**: Always provide concrete fixes
4. **Minimal Disruption**: Prefer small, incremental improvements

### Integration

- Uses Task tool to invoke shirokuma-system-harmonizer
- Records findings in MCP (decisions/knowledge)
- Updates documentation as needed
- Maintains system integrity

This command ensures the SHIROKUMA ecosystem remains consistent and harmonious.