---
description: Validate specs with comprehensive checklists for each phase
argument-hint: "<spec-id> [phase] | 'spec content'"
allowed-tools: Read, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__update_item
---

# /ai-spec:check - Spec Validation Command

## Language

@.shirokuma/configs/lang.md

## Purpose

Validate specifications using comprehensive checklists to ensure quality and completeness at each phase.

## Usage

```bash
/ai-spec:check <spec-id>                # Check all phases
/ai-spec:check <spec-id> requirements   # Check requirements only
/ai-spec:check <spec-id> design        # Check design only
/ai-spec:check <spec-id> tasks         # Check tasks only
/ai-spec:check "spec content"          # Check provided content
```

## Requirements Phase Checklist

### Content Quality
- [ ] **Clear Introduction**: Feature overview explains problem and solution
- [ ] **Business Value**: Clear articulation of why needed
- [ ] **Scope Definition**: What's included/excluded is explicit
- [ ] **Stakeholder Identification**: All stakeholders identified

### User Stories
- [ ] **Complete Format**: All follow "As a [role], I want [feature], so that [benefit]"
- [ ] **Clear Roles**: User roles are specific and well-defined
- [ ] **Valuable Features**: Each provides clear user value
- [ ] **Measurable Benefits**: Benefits are specific where possible

### EARS Format Compliance
- [ ] **WHEN Statements**: Event-driven requirements use WHEN correctly
- [ ] **IF Statements**: Conditional requirements use IF appropriately
- [ ] **WHILE Statements**: Continuous behaviors use WHILE correctly
- [ ] **WHERE Statements**: Context-specific requirements use WHERE
- [ ] **SHALL Usage**: All system responses use SHALL

### Acceptance Criteria
- [ ] **Testable**: Each criterion can be objectively tested
- [ ] **Specific**: Avoid vague terms like "user-friendly" or "fast"
- [ ] **Complete**: All aspects of requirement covered
- [ ] **Unambiguous**: Only one possible interpretation
- [ ] **Measurable**: Quantitative criteria include metrics

### Non-Functional Requirements
- [ ] **Performance**: Response time and throughput specified
- [ ] **Security**: Auth, authorization, data protection covered
- [ ] **Usability**: UX and accessibility requirements included
- [ ] **Reliability**: Error handling and recovery defined
- [ ] **Scalability**: Growth and load requirements addressed

## Design Phase Checklist

### Architecture
- [ ] **System Context**: How feature fits in broader system
- [ ] **Component Identification**: Major components defined
- [ ] **Interface Definition**: Interfaces between components specified
- [ ] **Technology Choices**: Stack decisions justified

### Detailed Design
- [ ] **Data Models**: Complete structures with validation
- [ ] **API Specifications**: Endpoints with request/response
- [ ] **Business Logic**: Core algorithms documented
- [ ] **Integration Points**: External integrations detailed

### Design Quality
- [ ] **Modularity**: Components loosely coupled
- [ ] **Extensibility**: Supports future enhancements
- [ ] **Maintainability**: Code organization supports maintenance
- [ ] **Reusability**: Common patterns identified

### Non-Functional Design
- [ ] **Performance Design**: Scalability and caching planned
- [ ] **Security Design**: Auth patterns and data protection
- [ ] **Error Handling**: Comprehensive error strategies
- [ ] **Testing Strategy**: Test approach defined

## Tasks Phase Checklist

### Task Structure
- [ ] **Clear Naming**: Tasks use action verbs and specifics
- [ ] **Appropriate Size**: Each task 2-4 hours max
- [ ] **Dependencies**: Clear prerequisites identified
- [ ] **Estimates**: Time/complexity estimates provided

### Task Coverage
- [ ] **All Components**: Every design component has tasks
- [ ] **Testing Tasks**: Unit and integration tests included
- [ ] **Documentation**: Doc tasks specified
- [ ] **Deployment**: Deployment tasks present

### Task Quality
- [ ] **Actionable**: Each task clearly implementable
- [ ] **Specific**: Exact files and functions identified
- [ ] **Testable**: Success criteria defined
- [ ] **Traceable**: Links to requirements clear

### Task Sequencing
- [ ] **Logical Order**: Dependencies respected
- [ ] **No Circular**: No circular dependencies
- [ ] **Incremental**: Builds progressively
- [ ] **Risk Management**: High-risk tasks early

## Validation Process

### Automated Checks
1. **Format Validation**: Check EARS syntax
2. **Completeness**: Verify all sections present
3. **Consistency**: Cross-reference between phases
4. **Coverage**: Ensure requirements → design → tasks

### Manual Review Points
1. **Business Alignment**: Meets stakeholder needs
2. **Technical Feasibility**: Can be implemented
3. **Resource Adequacy**: Time and skills available
4. **Risk Assessment**: Risks identified and mitigated

## Scoring System

### Requirements Score
- Format Compliance: 25%
- Completeness: 25%
- Testability: 25%
- Clarity: 25%

### Design Score
- Architecture: 30%
- Component Detail: 30%
- Integration: 20%
- Non-Functional: 20%

### Tasks Score
- Coverage: 30%
- Actionability: 30%
- Sequencing: 20%
- Estimates: 20%

### Overall Rating
- **Excellent**: 90-100% - Ready to proceed
- **Good**: 75-89% - Minor improvements needed
- **Fair**: 60-74% - Significant improvements needed
- **Poor**: <60% - Major revision required

## Example Output

```markdown
## Spec Validation Report

**Spec ID**: 101
**Title**: User Authentication System
**Phase**: Requirements
**Date**: 2025-01-21

### Requirements Phase Score: 85% (Good)

✅ **Strengths:**
- Clear user stories with roles and benefits
- EARS format correctly used
- Comprehensive acceptance criteria

⚠️ **Improvements Needed:**
- Missing performance requirements for login response time
- Security requirements need more detail on password policies
- No scalability requirements defined

❌ **Critical Issues:**
- None found

### Recommendations:
1. Add specific response time requirements (e.g., <2s for login)
2. Define password complexity rules
3. Specify expected user load (concurrent users)

### Next Steps:
- Address improvements before proceeding to design
- Re-run validation after updates
```

## MCP Integration

Validation results are automatically saved to shirokuma-kb as human-readable Markdown:

```typescript
// Retrieve spec
const spec = await mcp__shirokuma-kb__get_item({ id: specId });

// Run validation against Markdown content
const results = validateSpec(spec.content, phase);

// Generate human-readable Markdown validation report
const validationContent = `# Validation Report: ${spec.title}

## Metadata
- **Spec ID**: #${specId}
- **Validation Date**: ${new Date().toISOString()}
- **Phase**: ${phase}
- **Validator**: /ai-spec:check

## Overall Score: ${results.score}% (${results.rating})

## Phase Scores

### Requirements Phase: ${results.scores.requirements}%
- Format Compliance: ${results.scores.requirementsFormat}%
- Completeness: ${results.scores.requirementsCompleteness}%
- Testability: ${results.scores.requirementsTestability}%
- Clarity: ${results.scores.requirementsClarity}%

### Design Phase: ${results.scores.design}%
- Architecture: ${results.scores.designArchitecture}%
- Component Detail: ${results.scores.designComponents}%
- Integration: ${results.scores.designIntegration}%
- Non-Functional: ${results.scores.designNonFunctional}%

### Tasks Phase: ${results.scores.tasks}%
- Coverage: ${results.scores.tasksCoverage}%
- Actionability: ${results.scores.tasksActionability}%
- Sequencing: ${results.scores.tasksSequencing}%
- Estimates: ${results.scores.tasksEstimates}%

## Validation Results

### ✅ Strengths
${results.strengths.map(strength => `- ${strength}`).join('\n')}

### ⚠️ Improvements Needed
${results.improvements.map(improvement => `- ${improvement}`).join('\n')}

### ❌ Critical Issues
${results.criticalIssues.length > 0 ? 
  results.criticalIssues.map(issue => `- ${issue}`).join('\n') : 
  '- None found'}

## Detailed Findings

### Requirements Validation
${results.requirementsFindings.map(finding => 
  `- **${finding.type}**: ${finding.description}`
).join('\n')}

### Design Validation
${results.designFindings.map(finding => 
  `- **${finding.type}**: ${finding.description}`
).join('\n')}

### Tasks Validation
${results.tasksFindings.map(finding => 
  `- **${finding.type}**: ${finding.description}`
).join('\n')}

## Recommendations

### Priority 1: Critical (Must Fix)
${results.recommendations.critical.map((rec, i) => 
  `${i+1}. ${rec}`
).join('\n')}

### Priority 2: Important (Should Fix)
${results.recommendations.important.map((rec, i) => 
  `${i+1}. ${rec}`
).join('\n')}

### Priority 3: Nice to Have (Could Fix)
${results.recommendations.niceToHave.map((rec, i) => 
  `${i+1}. ${rec}`
).join('\n')}

## Next Steps
${results.nextSteps.map((step, i) => 
  `${i+1}. ${step}`
).join('\n')}

## Compliance Summary

### EARS Format Compliance
- Properly formatted: ${results.earsCompliance.proper}/${results.earsCompliance.total}
- Issues: ${results.earsCompliance.issues.join(', ') || 'None'}

### Template Compliance
- Required sections present: ${results.templateCompliance.present}/${results.templateCompliance.required}
- Missing sections: ${results.templateCompliance.missing.join(', ') || 'None'}

### Cross-Reference Validation
- Requirements → Design mapping: ${results.crossReference.reqToDesign}%
- Design → Tasks mapping: ${results.crossReference.designToTasks}%
- Tasks → Requirements traceability: ${results.crossReference.tasksToReq}%

## Decision
${results.score >= 75 ? 
  '✅ **APPROVED**: Spec meets quality standards and can proceed.' :
  '❌ **NEEDS REVISION**: Spec requires improvements before proceeding.'}

## Validation History
${validationHistory ? validationHistory.map(history => 
  `- ${history.date}: Score ${history.score}% - ${history.status}`
).join('\n') : '- First validation'}
`;

// Create validation report with Markdown content
const validationReport = await mcp__shirokuma-kb__create_item({
  type: "spec_validation",
  title: `Validation Report: ${spec.title}`,
  description: `Validation results for spec #${specId}`,
  content: validationContent, // Human-readable Markdown instead of JSON
  status: results.score >= 75 ? "Completed" : "Review",
  priority: results.criticalIssues.length > 0 ? "HIGH" : "MEDIUM",
  tags: ["spec", "validation", phase, `score-${Math.floor(results.score)}`],
  related: [specId]
});

console.log(`✅ Validation complete for spec #${specId}`);
console.log(`📊 Score: ${results.score}% (${results.rating})`);
console.log(`📝 Validation report saved with ID: ${validationReport.id}`);
```

## Integration with Other Commands

- After `/ai-spec:req`: Run requirements check
- After `/ai-spec:design`: Run design check
- After `/ai-spec:tasks`: Run tasks check
- Before `/ai-spec:execute`: Final validation

## References

- `.claude/commands/ai-spec/shared/spec-templates.markdown` - Templates
- `.claude/commands/ai-spec/shared/ears-format.markdown` - EARS guide
- `.claude/commands/ai-spec/validate.md` - Format validation