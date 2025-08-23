# Steering Document Loader

## Purpose

Utility for efficient loading and application of steering documents.
Automatically selects appropriate steering documents based on execution context.

## Loading Strategy

### 1. Automatic Loading (inclusion:always)
```typescript
// Always applied steering
const alwaysSteering = await mcp.search_items({
  query: "",
  types: ["steering"],
  tags: ["inclusion:always"]
});
```

### 2. Context-Based Loading (inclusion:filematch)
```typescript
// Selection based on current file path
const contextSteering = await mcp.search_items({
  query: "",
  types: ["steering"],
  tags: ["inclusion:filematch"]
});

// Pattern matching
for (const doc of contextSteering) {
  const pattern = extractPattern(doc.tags); // pattern:mcp/**
  if (matchesPattern(currentPath, pattern)) {
    applySteering(doc);
  }
}
```

### 3. Language/Environment Specific (pattern:*)
```typescript
// Detect project type and apply relevant steering
const projectType = detectProjectType(); // 'typescript', 'python', 'react', etc.

// Load language-specific steering
const languageSteering = await mcp.search_items({
  query: "",
  types: ["steering"],
  tags: [`pattern:${projectType}`]
});

// Apply based on detected environment
if (projectType === 'typescript') {
  const tsSteering = await mcp.search_items({
    query: "",
    types: ["steering"],
    tags: ["pattern:typescript"]
  });
  applySteeringDocs(tsSteering);
}
```

### 4. Manual Loading (inclusion:manual)
```typescript
// Only when explicitly requested
if (userRequestedManual) {
  const manualSteering = await mcp.search_items({
    query: "",
    types: ["steering"],
    tags: ["inclusion:manual"]
  });
}
```

## Priority Handling

Priority management using MCP priority field:

```typescript
const steeringDocs = [...alwaysSteering, ...contextSteering];

// Sort by priority
steeringDocs.sort((a, b) => {
  const priorityOrder = { 'CRITICAL': 5, 'HIGH': 4, 'MEDIUM': 3, 'LOW': 2, 'MINIMAL': 1 };
  return priorityOrder[b.priority] - priorityOrder[a.priority];
});
```

## Pattern Extraction

Extract patterns from tags:

```yaml
Pattern Extraction Process:
  Extract Pattern from Tags:
    - Find tag starting with 'pattern:'
    - Extract substring after 'pattern:'
    - Return pattern string or null if not found

Pattern Matching Logic:
  Match File Path Against Pattern:
    - Convert glob pattern to regex:
      - ** becomes .*
      - * becomes [^/]*  
      - ? becomes .
    - Test file path against regex
    - Return true if matches

Project Type Detection:
  Detection Order:
    1. Check package.json:
       - If has typescript dependency → 'typescript'
       - If has react dependency → 'react'
       - If has vue dependency → 'vue'
       - Otherwise → 'javascript'
    
    2. Check Python files:
       - If requirements.txt or pyproject.toml exists → 'python'
    
    3. Check Rust files:
       - If Cargo.toml exists → 'rust'
    
    4. Check Go files:
       - If go.mod exists → 'go'
    
    5. Default:
       - Return 'generic' if no specific type detected
```

## Steering Application

Apply steering document contents:

```yaml
Steering Context Structure:
  Components:
    - projectStandards: Project-wide standards and conventions
    - gitWorkflow: Git workflow and commit conventions
    - apiDesign: API design patterns and standards
    - testing: Testing requirements and coverage
    - environment: Development environment setup

Building Steering Context:
  Process:
    1. Iterate through steering documents
    2. Parse markdown content of each document
    3. Based on document title, extract appropriate content:
       
       Document Title Mapping:
         - 'Steering: SHIROKUMA Project Standards' → projectStandards
         - 'Steering: Git Workflow Standards' → gitWorkflow
         - 'Steering: MCP API Design Standards' → apiDesign
         - 'Steering: Testing Standards' → testing
         - 'Steering: Development Environment Setup' → environment
    
    4. Build context object with extracted content
    5. Return complete steering context
```

## Usage in Commands

### In /kuma:vibe
```yaml
Command Start Process:
  1. Load Steering Documents:
     Parameters:
       - currentFile: Current working directory
       - includeManual: false
  
  2. Apply During Code Generation:
     Input:
       - task: Current task details
       - steering: Project standards from steering
       - patterns: API design patterns from steering
     Output: Generated code following standards
```

### In /kuma:spec
```yaml
Spec Generation with Steering:
  Process:
    1. Load steering documents
    2. Generate spec using:
       - feature: Feature description
       - constraints: Project standards from steering
       - workflow: Git workflow from steering
    3. Apply steering rules to spec output
```

### In /kuma:commit
```yaml
Commit Message Generation:
  Process:
    1. Load steering for git workflow
    2. Format commit using:
       - changes: Staged changes list
       - format: Commit format from steering
       - types: Allowed commit types from steering
    3. Generate formatted message
```

## Caching Strategy

Cache for performance optimization:

```yaml
Caching Implementation:
  Structure:
    - Use Map for cache storage
    - Key: Unique identifier for steering context
    - Value: Loaded steering context
  
  Load Process:
    1. Check if key exists in cache
    2. If exists: Return cached value
    3. If not exists:
       - Load steering documents
       - Store in cache with key
       - Set timeout to clear after 5 minutes
       - Return loaded steering
  
  Cache Expiry:
    - Automatic cleanup after 5 minutes
    - Prevents stale data usage
    - Ensures fresh steering on changes
```

## Error Handling

Handling when steering is absent:

```yaml
Graceful Loading Process:
  Steps:
    1. Attempt to load steering documents
    2. Check if steering exists and has content
    3. If empty or missing:
       - Use default steering values
    4. If loading fails:
       - Log warning message
       - Return default steering
  
  Default Steering Values:
    Project Standards:
      - language: TypeScript
      - style: ESLint
      - naming:
          files: kebab-case
    
    Git Workflow:
      - commitFormat: 'type(scope): description'
    
    Purpose:
      - Ensure commands work without steering
      - Provide sensible defaults
      - Maintain system stability
```

## Integration with MCP

### Creating Steering
```yaml
MCP Tool Usage:
  Tool: mcp.create_item
  Parameters:
    - type: 'steering'
    - title: 'Steering: [document-name]'
    - description: 'Project steering document'
    - content: [markdown-content]
    - tags: ['steering', inclusion-tag, ...patterns]
    - priority: 'HIGH'
```

### Updating Steering
```yaml
MCP Tool Usage:
  Tool: mcp.update_item
  Parameters:
    - id: [steering-id]
    - content: [updated-markdown]
    - tags: [...existing-tags, new-tag]
```

### Searching Steering
```yaml
Get All Steering Documents:
  Tool: mcp.list_items
  Parameters:
    - type: 'steering'
    - limit: 100
  Purpose: Retrieve all steering documents

Keyword Search:
  Tool: mcp.search_items
  Parameters:
    - query: 'testing TDD'
    - types: ['steering']
  Purpose: Find specific steering by keywords
```

## Best Practices

1. **Use caching**: Avoid frequent MCP access
2. **Respect priorities**: HIGH priority is mandatory, MEDIUM is recommended
3. **Clear patterns**: Make fileMatch patterns specific
4. **Graceful degradation**: Continue operation even without steering
5. **Maintain context**: Keep loaded steering throughout session