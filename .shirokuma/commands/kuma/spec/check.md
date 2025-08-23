---
description: Validate specs with comprehensive checklists for each phase
argument-hint: "<spec-id> [phase] | 'spec content'"
allowed-tools: Read, mcp__shirokuma-kb__get_item, mcp__shirokuma-kb__update_item
---

# /kuma:spec:check - Spec Validation Command

## Language

@.shirokuma/commands/shared/lang.markdown

## Purpose

Validate specifications using comprehensive checklists to ensure quality and completeness at each phase.

## Usage

```bash
/kuma:spec:check <spec-id>                # Check all phases
/kuma:spec:check <spec-id> requirements   # Check requirements only
/kuma:spec:check <spec-id> design        # Check design only
/kuma:spec:check <spec-id> tasks         # Check tasks only
/kuma:spec:check "spec content"          # Check provided content
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

## Validation Process

1. **Retrieve Spec for Validation**
```yaml
# Load spec from shirokuma-kb
- Tool: mcp__shirokuma-kb__get_item
  Parameters:
    id: "[specId]"
  Purpose: Get spec content for validation
```

2. **Run Validation Process**
   - Validate spec content against phase-specific checklists
   - Calculate scores for each validation category
   - Generate comprehensive validation report
   - Identify strengths, improvements needed, and critical issues

3. **Generate Validation Report**
   - Create detailed Markdown validation report including:
     - Overall score and rating
     - Phase-specific scores breakdown
     - Validation results (strengths, improvements, critical issues)
     - Detailed findings by phase
     - Prioritized recommendations
     - Compliance summary (EARS, template, cross-reference)
     - Approval decision and validation history

4. **Store Validation Report**
```yaml
# Save validation report to shirokuma-kb
- Tool: mcp__shirokuma-kb__create_item
  Parameters:
    type: "spec_validation"
    title: "Validation Report: [spec.title]"
    description: "Validation results for spec #[specId]"
    content: "[Generated comprehensive validation report in Markdown]"
    status: "Completed" or "Review"  # Based on score >= 75%
    priority: "HIGH" or "MEDIUM"  # Based on critical issues
    tags: ["spec", "validation", "[phase]", "score-[score_range]"]
    related: ["[specId]"]
  Purpose: Store validation results for review and tracking
```

5. **Return Validation Results**
   - Display overall score and rating
   - Show validation report ID
   - Provide approval/revision decision

## Integration with Other Commands

- After `/kuma:spec:req`: Run requirements check
- After `/kuma:spec:design`: Run design check
- After `/kuma:spec:tasks`: Run tasks check
- Before `/kuma:spec:execute`: Final validation

## References

- `.shirokuma/commands/spec/shared/spec-templates.markdown` - Templates
- `.shirokuma/commands/spec/shared/ears-format.markdown` - EARS guide
- `.shirokuma/commands/spec/validate.md` - Format validation