---
description: Optimize documents for AI readability by removing redundancy
argument-hint: "<filepath> [additional instructions]"
---

# ai-optimize - Optimize documents for AI readability

## Usage
```
/ai-optimize <filepath> [additional instructions]
```

Examples:
- `/ai-optimize README.md`
- `/ai-optimize api-docs.md keep all code examples`
- `/ai-optimize CLAUDE.md focus on command specifications`

## Task

@.claude/agents/LANG.markdown

<ultrathink>
The user wants to optimize a document for AI readability. I need to:
1. Parse the filepath and any additional instructions
2. Analyze the document to identify redundant content
3. Create an optimization plan preserving essential information
4. Show the proposed changes and get user confirmation before editing
</ultrathink>

Parse arguments:
- First argument: filepath
- Remaining arguments: additional optimization instructions

Optimize the document for AI readability:

1. **Analyze file**: Read the file specified in the first argument

2. **Apply optimizations**:
   <ultrathink>
   I need to carefully analyze what to remove and what to preserve:
   - Standard concepts that AI already knows can be reduced to just names
   - Project-specific rules must be preserved in full
   - Examples should be minimal but representative
   - Any user-specified preservation instructions must be followed
   </ultrathink>
   
   - Remove redundant explanations
   - Keep only names for standard methodologies (e.g., Conventional Commits)
   - Preserve project-specific important rules
   - Minimize examples to essential ones
   - Clearly state points prone to inconsistency
   - **Apply any additional instructions provided by the user**

3. **Review and confirm**:
   - Show proposed changes summary with line count reduction
   - List specific optimizations to be applied
   - Ask user: "Apply these optimizations? (y/n)"
   - Only proceed with editing after user confirms with "y"

## Optimization Principles

### Remove
- General concept explanations
- Duplicate examples
- Lengthy background information
- Details of standard methodologies AI already knows

### Preserve
- Project-specific rules
- Critical instructions prone to inconsistency
- Essential command examples
- Special constraints

## Example Output

Standard usage:
```
> /ai-optimize example.md

📄 Analyzing: example.md (500 lines)

🔍 Proposed optimizations:
- Remove 50 lines of Conventional Commits explanation
- Consolidate 30 duplicate examples into 5
- Remove 100 lines of general Git workflow
- Preserve 3 project-specific rules

📊 Result: 500 lines → 50 lines (90% reduction)

Apply these optimizations? (y/n):
```

With additional instructions:
```
> /ai-optimize api-docs.md preserve all error handling examples

📄 Analyzing: api-docs.md (800 lines)
📌 Additional instructions: preserve all error handling examples

🔍 Proposed optimizations:
- Remove 200 lines of REST API basics
- Consolidate authentication examples
- ✓ Preserving all 15 error handling examples (per your request)
- Remove redundant endpoint descriptions

📊 Result: 800 lines → 250 lines (69% reduction)

Apply these optimizations? (y/n):
```

After confirmation:
```
✅ Optimized: example.md
📊 Reduction: 90% (500 lines → 50 lines)
```

## Important Note
- Original file is edited in place after confirmation
- Shows detailed preview before any changes
- Requires explicit user confirmation