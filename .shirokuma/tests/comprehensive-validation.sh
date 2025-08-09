#!/bin/bash

# SHIROKUMA Comprehensive Agent/Command Validation Report
# Purpose: Validate ALL agents and commands for generic compatibility

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Summary counters
TOTAL_FILES=0
PASS_FILES=0
FAIL_FILES=0
WARN_FILES=0

# Classification counters
L1_COUNT=0
L2_COUNT=0
L3_COUNT=0
UNCLASSIFIED_COUNT=0

echo "========================================="
echo "SHIROKUMA Comprehensive Validation Report"
echo "========================================="
echo
echo "Scanning for all agent and command files..."
echo

# Find all agent files
AGENT_FILES=$(find .claude/agents -name "*.md" -type f | sort)
COMMAND_FILES=$(find .claude/commands -name "*.md" -type f | sort)

# Function to check classification
check_classification() {
    local file="$1"
    
    if ! head -n 1 "$file" | grep -q "^---$" 2>/dev/null; then
        echo "UNCLASSIFIED"
        return
    fi
    
    # Extract FrontMatter
    local frontmatter=$(awk '/^---$/{p++} p==1{print} p==2{exit}' "$file")
    
    # Check for classification field
    if echo "$frontmatter" | grep -q "^classification:" 2>/dev/null; then
        local classification=$(echo "$frontmatter" | grep "^classification:" | sed 's/classification: *//' | tr -d ' ')
        echo "$classification"
    else
        echo "UNCLASSIFIED"
    fi
}

# Function to check for project-specific patterns
check_project_specific() {
    local file="$1"
    local issues=""
    
    # Check for shirokuma-knowledge-base MCP
    if grep -q "mcp__shirokuma-knowledge-base" "$file" 2>/dev/null; then
        issues="${issues}Uses project-specific MCP (shirokuma-knowledge-base); "
    fi
    
    # Check for hardcoded npm/yarn without conventions
    if grep -E "npm (run|test|install|build)" "$file" 2>/dev/null | grep -v "conventions\." > /dev/null; then
        issues="${issues}Hardcoded npm commands; "
    fi
    
    echo "$issues"
}

echo "## Agent Files Analysis"
echo "========================"
echo

for file in $AGENT_FILES; do
    ((TOTAL_FILES++))
    basename=$(basename "$file")
    classification=$(check_classification "$file")
    project_specific=$(check_project_specific "$file")
    
    # Count classifications
    case "$classification" in
        "L1_UNIVERSAL") ((L1_COUNT++)) ;;
        "L2_FRAMEWORK") ((L2_COUNT++)) ;;
        "L3_PROJECT") ((L3_COUNT++)) ;;
        *) ((UNCLASSIFIED_COUNT++)) ;;
    esac
    
    # Determine status
    if [ "$classification" = "UNCLASSIFIED" ]; then
        status="${RED}❌ FAIL${NC}"
        ((FAIL_FILES++))
        reason="Missing classification"
    elif [ -n "$project_specific" ] && [ "$classification" = "L1_UNIVERSAL" ]; then
        status="${RED}❌ FAIL${NC}"
        ((FAIL_FILES++))
        reason="L1 but has project-specific: $project_specific"
    elif [ -n "$project_specific" ] && [ "$classification" = "L2_FRAMEWORK" ]; then
        status="${YELLOW}⚠ WARN${NC}"
        ((WARN_FILES++))
        reason="L2 with project-specific: $project_specific"
    else
        status="${GREEN}✓ PASS${NC}"
        ((PASS_FILES++))
        reason=""
    fi
    
    # Print result
    printf "%-40s [%-15s] %b\n" "$basename" "$classification" "$status"
    if [ -n "$reason" ]; then
        echo "  └─ $reason"
    fi
done

echo
echo "## Command Files Analysis"
echo "========================="
echo

for file in $COMMAND_FILES; do
    ((TOTAL_FILES++))
    basename=$(basename "$file")
    classification=$(check_classification "$file")
    project_specific=$(check_project_specific "$file")
    
    # Count classifications
    case "$classification" in
        "L1_UNIVERSAL") ((L1_COUNT++)) ;;
        "L2_FRAMEWORK") ((L2_COUNT++)) ;;
        "L3_PROJECT") ((L3_COUNT++)) ;;
        *) ((UNCLASSIFIED_COUNT++)) ;;
    esac
    
    # Determine status
    if [ "$classification" = "UNCLASSIFIED" ]; then
        status="${RED}❌ FAIL${NC}"
        ((FAIL_FILES++))
        reason="Missing classification"
    elif [ -n "$project_specific" ] && [ "$classification" = "L1_UNIVERSAL" ]; then
        status="${RED}❌ FAIL${NC}"
        ((FAIL_FILES++))
        reason="L1 but has project-specific: $project_specific"
    elif [ -n "$project_specific" ] && [ "$classification" = "L2_FRAMEWORK" ]; then
        status="${YELLOW}⚠ WARN${NC}"
        ((WARN_FILES++))
        reason="L2 with project-specific: $project_specific"
    else
        status="${GREEN}✓ PASS${NC}"
        ((PASS_FILES++))
        reason=""
    fi
    
    # Print result
    printf "%-40s [%-15s] %b\n" "$basename" "$classification" "$status"
    if [ -n "$reason" ]; then
        echo "  └─ $reason"
    fi
done

echo
echo "========================================="
echo "## Summary Statistics"
echo "========================================="
echo
echo "### File Status:"
echo "  Total Files:    $TOTAL_FILES"
echo -e "  ${GREEN}Passed:${NC}         $PASS_FILES"
echo -e "  ${YELLOW}Warnings:${NC}       $WARN_FILES"
echo -e "  ${RED}Failed:${NC}         $FAIL_FILES"
echo
echo "### Classification Distribution:"
echo "  L1_UNIVERSAL:   $L1_COUNT"
echo "  L2_FRAMEWORK:   $L2_COUNT"
echo "  L3_PROJECT:     $L3_COUNT"
echo -e "  ${RED}UNCLASSIFIED:${NC}   $UNCLASSIFIED_COUNT"

echo
echo "========================================="
echo "## Recommendations"
echo "========================================="

if [ $UNCLASSIFIED_COUNT -gt 0 ]; then
    echo
    echo "1. Add classification field to all unclassified files:"
    echo "   - L1_UNIVERSAL: For truly generic, framework-agnostic"
    echo "   - L2_FRAMEWORK: For framework-specific (React, Vue, etc.)"
    echo "   - L3_PROJECT: For project-specific agents"
fi

if [ $FAIL_FILES -gt 0 ] || [ $WARN_FILES -gt 0 ]; then
    echo
    echo "2. Fix project-specific dependencies in L1/L2 files:"
    echo "   - Replace 'mcp__shirokuma-knowledge-base' with generic alternatives"
    echo "   - Use conventions.* for build commands instead of hardcoded npm/yarn"
    echo "   - Move project-specific agents to L3_PROJECT classification"
fi

echo
if [ $FAIL_FILES -eq 0 ] && [ $WARN_FILES -eq 0 ]; then
    echo -e "${GREEN}✅ All files are properly classified and generic!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Review and fix the issues above for true generic compatibility${NC}"
    exit 1
fi