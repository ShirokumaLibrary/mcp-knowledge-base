---
description: Decision guide for when to use spec-driven development
argument-hint: "'feature description' | complexity-check"
allowed-tools: Read, mcp__shirokuma-kb__search_items, mcp__shirokuma-kb__create_item
---

# /kuma:spec:when - Spec Usage Decision Guide

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Help decide whether spec-driven development is appropriate for your specific situation and which spec type to use.

## Usage

```bash
/kuma:spec:when "feature description"    # Analyze and recommend
/kuma:spec:when complexity-check        # Interactive assessment
```

## Decision Framework

### Primary Decision Criteria

#### 1. Complexity Assessment
**Use Spec-Driven Development When:**
- Feature involves multiple components/systems
- Integration with external APIs/services required
- Complex business logic or data transformations
- Multiple user roles or permission levels
- Affects existing system architecture

**Skip Spec When:**
- Simple bug fix or minor adjustment
- Well-understood pattern implementation
- Purely cosmetic UI changes
- Single-line fixes

#### 2. Risk and Impact
**Use Spec When:**
- Customer-facing with significant UX impact
- Could affect system stability/data integrity
- Involves sensitive data or security
- Multiple teams depend on outcome
- Hard to change once deployed

**Skip Spec When:**
- Internal tooling with limited impact
- Easily reversible change
- Throwaway prototype or POC
- Emergency hotfix needed

#### 3. Team and Collaboration
**Use Spec When:**
- Multiple developers working on feature
- Cross-functional collaboration needed
- Knowledge transfer important
- Distributed/async team
- New team members need context

**Skip Spec When:**
- Solo work on well-understood problem
- Team has extensive shared context
- Immediate implementation more valuable

#### 4. Timeline and Resources
**Use Spec When:**
- Sufficient planning time (20-30% of total)
- Cost of rework would be significant
- Accurate estimation important
- Long-term maintenance expected

**Skip Spec When:**
- Extreme time pressure for critical fix
- Experimental feature may be discarded
- Resources severely limited

## Spec Type Decision Tree

```
Start: How long will this take?
│
├─ < 1 day effort?
│  └─ Yes → MICRO SPEC
│      └─ Single file change?
│          ├─ Yes → Perfect for Micro
│          └─ No → Still OK if simple
│
├─ 1-3 days effort?
│  └─ Yes → Multiple components?
│      ├─ No → QUICK SPEC
│      └─ Yes → New patterns/tech?
│          ├─ No → QUICK SPEC
│          └─ Yes → STANDARD SPEC
│
└─ > 3 days effort?
   └─ Yes → Cross-team impact?
       ├─ No → STANDARD SPEC
       └─ Yes → FULL SPEC + Reviews
```

## Complexity Scoring

### Automatic Assessment
Rate each factor 1-5:

**Technical Complexity:**
- Number of components affected (1-5)
- Integration points (1-5)
- Data model changes (1-5)
- Business logic complexity (1-5)

**Risk Factors:**
- Security implications (1-5)
- Performance impact (1-5)
- Data integrity risk (1-5)
- User experience impact (1-5)

**Team Factors:**
- Number of developers (1-5)
- Cross-team coordination (1-5)
- Knowledge gaps (1-5)
- Communication overhead (1-5)

### Scoring Interpretation

**Total Score: 12-24**
- Recommendation: **MICRO SPEC**
- Effort: < 1 day
- Documentation: Minimal

**Total Score: 25-36**
- Recommendation: **QUICK SPEC**
- Effort: 1-3 days
- Documentation: Requirements + Tasks

**Total Score: 37-48**
- Recommendation: **STANDARD SPEC**
- Effort: 3-10 days
- Documentation: Full three-phase

**Total Score: 49-60**
- Recommendation: **FULL SPEC + REVIEWS**
- Effort: > 10 days
- Documentation: Comprehensive with stakeholder reviews

## Scenario Examples

### Scenario 1: Bug Fix
```
"Fix login button not working on mobile"
→ Complexity: Low (4/20)
→ Risk: Low (3/20)
→ Team: Minimal (2/20)
→ Total: 9/60
✅ Recommendation: MICRO SPEC or direct fix
```

### Scenario 2: New Feature
```
"Add OAuth integration for Google/GitHub"
→ Complexity: High (15/20)
→ Risk: High (16/20)
→ Team: Medium (10/20)
→ Total: 41/60
✅ Recommendation: STANDARD SPEC (full three-phase)
```

### Scenario 3: UI Component
```
"Create reusable data table component"
→ Complexity: Medium (10/20)
→ Risk: Low (5/20)
→ Team: Low (6/20)
→ Total: 21/60
✅ Recommendation: QUICK SPEC (requirements + tasks)
```

### Scenario 4: System Migration
```
"Migrate from SQL to NoSQL database"
→ Complexity: Very High (19/20)
→ Risk: Very High (20/20)
→ Team: High (15/20)
→ Total: 54/60
✅ Recommendation: FULL SPEC with extensive reviews
```

## Anti-Patterns to Avoid

### Over-Specification
❌ **Don't use specs for:**
- Typo fixes
- CSS color changes
- Config value updates
- README updates
- Dependency bumps

### Under-Specification
❌ **Don't skip specs for:**
- Payment processing
- Authentication systems
- Data migration
- API redesigns
- Security features

## Quick Decision Guide

### Green Light (Use Spec)
✅ New API endpoints
✅ Database schema changes
✅ User authentication
✅ Payment processing
✅ Data import/export
✅ Third-party integrations
✅ Permission systems
✅ Workflow automation

### Yellow Light (Consider Spec)
⚠️ UI component library
⚠️ Performance optimization
⚠️ Refactoring modules
⚠️ Adding analytics
⚠️ Email notifications
⚠️ Search functionality

### Red Light (Skip Spec)
❌ Fixing typos
❌ Updating dependencies
❌ Adjusting styles
❌ Config changes
❌ Adding comments
❌ Formatting code

## Output Format

```markdown
## Spec Recommendation Analysis

**Feature**: [Description]
**Analysis Date**: 2025-01-21

### Complexity Assessment
- Technical Complexity: 3/5
- Risk Level: 2/5
- Team Coordination: 1/5
- **Total Score**: 6/15

### Recommendation: MICRO SPEC

**Reasoning:**
- Single component affected
- Well-understood pattern
- Low risk to system stability
- Can be completed in <4 hours

### Suggested Approach:
1. Create micro spec with what/why/how
2. Implement directly
3. Basic testing
4. Deploy with monitoring

### Alternative:
If timeline critical, consider direct implementation with good commit message.
```

## MCP Storage

Decision analysis results are automatically saved as human-readable Markdown:

```typescript
// Generate human-readable Markdown content
const markdownContent = `# Spec Analysis: ${featureDescription}

## Metadata
- **Analysis Date**: ${new Date().toISOString()}
- **Analyzer**: /kuma:spec:when
- **Status**: Completed

## Feature Description
${featureDescription}

## Complexity Assessment

### Scoring Breakdown
- **Technical Complexity**: ${technicalScore}/5
  - Components affected: ${componentsAffected}
  - Integration points: ${integrationPoints}
  - Data model changes: ${dataModelChanges}
  - Business logic complexity: ${businessLogicComplexity}

- **Risk Level**: ${riskScore}/5
  - Security implications: ${securityImplications}
  - Performance impact: ${performanceImpact}
  - Data integrity risk: ${dataIntegrityRisk}
  - User experience impact: ${userExperienceImpact}

- **Team Coordination**: ${teamScore}/5
  - Number of developers: ${numberOfDevelopers}
  - Cross-team coordination: ${crossTeamCoordination}
  - Knowledge gaps: ${knowledgeGaps}
  - Communication overhead: ${communicationOverhead}

### Total Score: ${totalScore}/15

## Recommendation: ${specType} SPEC

### Reasoning
${reasoningPoints.map(point => `- ${point}`).join('\n')}

### Suggested Approach
${approachSteps.map((step, i) => `${i+1}. ${step}`).join('\n')}

### Alternative Approaches
${alternatives ? alternatives.map(alt => `- ${alt}`).join('\n') : '- None identified'}

## Similar Existing Specs
${relatedSpecs.length > 0 ? relatedSpecs.map(spec => 
  `- [#${spec.id}] ${spec.title} - ${spec.recommendation}`
).join('\n') : 'No similar specs found'}

## Decision Factors Summary

### Green Lights (Supporting Factors)
${greenLights.map(factor => `✅ ${factor}`).join('\n')}

### Yellow Lights (Considerations)
${yellowLights.map(factor => `⚠️ ${factor}`).join('\n')}

### Red Lights (Risk Factors)
${redLights.map(factor => `❌ ${factor}`).join('\n')}

## Next Steps
${nextSteps.map((step, i) => `${i+1}. ${step}`).join('\n')}

## Notes
${additionalNotes || 'None'}
`;

// Save analysis with Markdown content
const analysisResult = await mcp__shirokuma-kb__create_item({
  type: "spec_analysis",
  title: `Spec Analysis: ${featureDescription}`,
  description: "Decision guide analysis for spec-driven development",
  content: markdownContent, // Human-readable Markdown instead of JSON
  status: "Completed",
  priority: "LOW",
  tags: ["spec", "analysis", "decision", specType.toLowerCase()],
  related: relatedSpecs // IDs of similar specs found
});

console.log(`✅ Analysis saved to shirokuma-kb with ID: ${analysisResult.id}`);
console.log(`📊 Recommendation: ${specType} SPEC`);
```

## Integration

- Use before `/kuma:spec` to determine approach
- Links to appropriate spec command based on recommendation
- Can search existing specs for similar features

## References

- `.shirokuma/commands/spec/micro.md` - Micro specs
- `.shirokuma/commands/spec/quick.md` - Quick specs
- `.claude/commands/kuma:spec.md` - Standard specs
- `.shirokuma/commands/spec/shared/spec-templates.markdown` - Templates