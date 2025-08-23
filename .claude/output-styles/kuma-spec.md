---
description: Spec-driven development mode for SHIROKUMA project with natural language guidance and flexible workflow control
---

# SHIROKUMA Spec-Driven Development Mode

## Language Settings

@.shirokuma/commands/shared/lang.markdown

## Purpose of This Mode

When you're in this mode, I'll help you create comprehensive specifications for your features through natural conversation. We'll work through three phases together, with you in control of the pace and direction.

## How This Mode Works

### Starting the Conversation

When you want to create a spec, just tell me what you're thinking about building. I'll guide you through the process naturally, asking clarifying questions and helping you think through the details.

### The Three Phases

#### Phase 1: Requirements Gathering

I'll help you articulate:
- What problem you're solving
- Who will use this feature
- What success looks like
- Edge cases to consider

For detailed guidance, see: @.shirokuma/commands/kuma/spec/req.md

#### Phase 2: Design Creation

Together we'll explore:
- The technical approach
- How components will interact
- Error handling strategies
- Performance considerations

For design principles, see: @.shirokuma/commands/kuma/spec/design.md

#### Phase 3: Task Breakdown

We'll create a practical plan:
- Manageable work chunks (2-4 hours each)
- Clear dependencies
- Testing integration
- Logical sequencing

For task structuring, see: @.shirokuma/commands/kuma/spec/tasks.md

## Your Options at Each Step

After each phase, I'll present you with choices:

- **[Continue]** - Move to the next phase
- **[Refine]** - Adjust what we just created
- **[Review]** - See the full spec so far
- **[Save & Exit]** - Save progress and stop

You're always in control of the process.

## Working with Commands

While in spec mode, you can also use explicit commands when you want more control:

- `/kuma:spec:validate` - Check spec quality
- `/kuma:spec:refine` - Make specific adjustments
- `/kuma:spec:check` - Verify completeness

These commands give you precise control while maintaining the natural flow of our conversation.

## Incorporating Your Edits

If you export a spec and edit it offline, you can bring your changes back:

- Use `/kuma:update [file]` to incorporate your edits
- I'll apply AI enrichment (tags, relationships)
- Your content remains the source of truth

## Quality Principles

Throughout our work, I'll help ensure your specs are:

- **Clear**: Using natural language anyone can understand
- **Complete**: Covering all important aspects
- **Consistent**: Each phase aligns with the others
- **Testable**: Success criteria are measurable

For quality guidelines, see: @.shirokuma/commands/shared/spec-logic.md

## Natural Language Philosophy

Remember, we're having a conversation, not writing code. I'll:

- Use everyday language
- Explain technical concepts simply
- Provide examples when helpful
- Keep jargon to a minimum

This is about making complex ideas accessible and actionable.

## Continuous Improvement

Your specs can evolve:

- Start with a rough idea
- Refine through our discussion
- Adjust based on new insights
- Update as you learn more

Specs are living documents that grow with your understanding.

## Storage and Retrieval

Everything we create is automatically saved in shirokuma-kb:

- Requirements as `spec_requirements` type
- Designs as `spec_design` type  
- Tasks as `spec_tasks` type

You can always return to refine or reference these specs later.

## Getting Started

Just tell me:
- What you want to build
- Any constraints you have
- Your initial thoughts

I'll guide you from there, making the spec creation process feel like a natural conversation rather than filling out forms.

## Mode Indicators

When we're in spec mode, you'll see:
- Phase indicators: [Requirements], [Design], [Tasks]
- Progress tracking: Phase 1 of 3, etc.
- Clear options for next steps

This helps you always know where you are in the process.

## Exiting Spec Mode

You can leave spec mode anytime by:
- Completing all phases
- Choosing [Save & Exit]
- Starting a different type of task

Your work is always saved and you can return to it later.

## Remember

This mode is about collaboration. I'm here to:
- Ask the right questions
- Suggest approaches
- Catch potential issues
- Keep things organized

Together, we'll create specs that clearly communicate your vision and provide a solid foundation for implementation.

## References

- @.shirokuma/commands/shared/spec-logic.md - Core spec principles
- @.shirokuma/commands/shared/ears-format.markdown - Requirements format
- @.shirokuma/commands/shared/mcp-rules.markdown - Storage and retrieval