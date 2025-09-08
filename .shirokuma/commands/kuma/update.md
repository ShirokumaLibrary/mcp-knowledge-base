# /kuma:update - User Document Update Command

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

This command helps you incorporate changes from documents you've edited offline. When you export a document from shirokuma-kb and make changes to it, use this command to bring those changes back into the system with AI enrichment.

## Usage

```bash
/kuma:update <file_path>     # Update from edited file
/kuma:update <id> <file>     # Update specific item from file
```

## How to Use This Command

### When You Export and Edit

1. First, export a document using `/kuma:export`
2. Edit the document offline in your favorite editor
3. Use this command to incorporate your changes
4. The system will apply AI enrichment automatically

### What This Command Does

When you run this command, I will:

#### 1. Read Your File

I'll carefully read the file you've edited and understand:
- The title of the document
- The main content you've written
- What type of document this is
- What changes you've made

#### 2. Understand Your Intent

I'll analyze your edits to understand:
- What you're trying to accomplish
- Why you made specific changes
- How this relates to other documents
- What the key concepts are

#### 3. Check for Major Changes

If I notice significant changes, I'll ask you:
- "I see you've substantially changed [section]. Is this intentional?"
- "This seems to diverge from the original. Should I proceed?"
- "Would you like me to create a new document instead?"

This ensures we don't accidentally overwrite important content.

#### 4. Apply AI Enrichment

While preserving your content exactly as written, I'll add:
- **Relevant tags** based on the content
- **Relationships** to related documents
- **Summary** for quick reference
- **Search keywords** for better discoverability
- **Priority** based on content importance

#### 5. Update in shirokuma-kb

I'll update the document in the knowledge base:
- Your title and content remain the source of truth
- Metadata is enhanced for better organization
- Version history is maintained
- Relationships are updated bidirectionally

#### 6. Confirm the Update

After updating, I'll report back:
- "Document #[ID] has been updated successfully"
- "Added tags: [list of tags]"
- "Linked to related documents: [list]"
- "Any impacts on related documents have been noted"

## What Makes This Different

### From Import Commands

Import commands typically:
- Bring in completely new documents
- Create new entries in the system
- Process bulk imports

This command specifically:
- Updates existing documents
- Preserves your manual edits
- Applies AI understanding to your changes

### From Direct MCP Updates

Direct MCP updates:
- Require you to specify all fields
- Don't apply automatic enrichment
- Are more technical in nature

This command:
- Focuses on title and content only
- Automatically enriches metadata
- Provides a natural interface

## Best Practices

### Before Editing

1. Export the latest version of the document
2. Keep track of which ID you're editing
3. Make your changes thoughtfully

### While Editing

1. Preserve the document structure
2. Keep the title meaningful
3. Don't remove important context

### After Editing

1. Save your file with clear naming
2. Use this command promptly
3. Review the enrichment results

## Examples

### Simple Update
```
User: /kuma:update ./edited-docs/requirements-v2.md