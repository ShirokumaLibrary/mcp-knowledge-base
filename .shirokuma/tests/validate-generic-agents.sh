#!/bin/bash

# SHIROKUMA Generic Agent Validation Test Script
# Purpose: Verify agents and commands are truly generic and framework-agnostic

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall test result
FAILED=0
WARNINGS=0

# Test results tracking
declare -A TEST_RESULTS

# Function to print test result
print_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        TEST_RESULTS["$test_name"]="PASS"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $test_name"
        echo -e "  ${RED}→ $message${NC}"
        TEST_RESULTS["$test_name"]="FAIL: $message"
        ((FAILED++))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $test_name"
        echo -e "  ${YELLOW}→ $message${NC}"
        TEST_RESULTS["$test_name"]="WARN: $message"
        ((WARNINGS++))
    fi
}

# Function to check for forbidden patterns
check_forbidden_patterns() {
    local file="$1"
    local level="$2"
    local test_name="$(basename $file): Forbidden patterns check ($level)"
    local violations=""
    
    # L1_UNIVERSAL forbidden patterns
    if [ "$level" = "L1_UNIVERSAL" ]; then
        # Check for project-specific MCP tools
        if grep -q "mcp__shirokuma-knowledge-base" "$file" 2>/dev/null; then
            violations="${violations}Found project-specific MCP tool 'shirokuma-knowledge-base'\n"
        fi
        
        # Check for hardcoded npm/yarn commands in agents
        if [[ "$file" == *"agent"* ]]; then
            if grep -E "npm (run|test|install|build)" "$file" 2>/dev/null | grep -v "conventions\." > /dev/null; then
                violations="${violations}Found hardcoded npm commands without conventions reference\n"
            fi
            if grep -E "yarn (run|test|install|build)" "$file" 2>/dev/null | grep -v "conventions\." > /dev/null; then
                violations="${violations}Found hardcoded yarn commands without conventions reference\n"
            fi
        fi
        
        # Check for framework-specific imports/requires
        if grep -E "(require|import).*['\"]@?angular|react|vue|svelte" "$file" 2>/dev/null; then
            violations="${violations}Found framework-specific imports\n"
        fi
    fi
    
    # L2_FRAMEWORK forbidden patterns
    if [ "$level" = "L2_FRAMEWORK" ]; then
        # Check for project-specific MCP tools
        if grep -q "mcp__shirokuma-knowledge-base" "$file" 2>/dev/null; then
            violations="${violations}Found project-specific MCP tool 'shirokuma-knowledge-base'\n"
        fi
        
        # L2 can have framework references but should use conventions
        if grep -E "npm (run|test|install|build)" "$file" 2>/dev/null | grep -v "conventions\." > /dev/null; then
            if ! grep -q "@.shirokuma/configs/" "$file" 2>/dev/null; then
                violations="${violations}Found npm commands without conventions config reference\n"
            fi
        fi
    fi
    
    # L3_PROJECT forbidden patterns (most permissive)
    if [ "$level" = "L3_PROJECT" ]; then
        # L3 can have project-specific tools, just check for basic issues
        if grep -q "hardcoded_password\|secret_key" "$file" 2>/dev/null; then
            violations="${violations}Found potential hardcoded secrets\n"
        fi
    fi
    
    if [ -z "$violations" ]; then
        print_result "$test_name" "PASS" ""
    else
        print_result "$test_name" "FAIL" "$violations"
    fi
}

# Function to check for required config references
check_config_references() {
    local file="$1"
    local level="$2"
    local test_name="$(basename $file): Config references check"
    local missing=""
    
    # L1 and L2 should reference configs
    if [ "$level" = "L1_UNIVERSAL" ] || [ "$level" = "L2_FRAMEWORK" ]; then
        if ! grep -q "@\.shirokuma/configs/" "$file" 2>/dev/null; then
            missing="${missing}Missing @.shirokuma/configs/ reference\n"
        fi
    fi
    
    if [ -z "$missing" ]; then
        print_result "$test_name" "PASS" ""
    else
        print_result "$test_name" "FAIL" "$missing"
    fi
}

# Function to validate FrontMatter
validate_frontmatter() {
    local file="$1"
    local test_name="$(basename $file): FrontMatter validation"
    local issues=""
    
    # Check if file has FrontMatter
    if ! head -n 1 "$file" | grep -q "^---$" 2>/dev/null; then
        print_result "$test_name" "WARN" "No FrontMatter found"
        return
    fi
    
    # Extract FrontMatter (between first two ---)
    local frontmatter=$(awk '/^---$/{p++} p==1{print} p==2{exit}' "$file")
    
    # Check for classification field
    if ! echo "$frontmatter" | grep -q "^classification:" 2>/dev/null; then
        issues="${issues}Missing 'classification' field\n"
    else
        # Extract classification value
        local classification=$(echo "$frontmatter" | grep "^classification:" | sed 's/classification: *//')
        if ! echo "$classification" | grep -E "^(L1_UNIVERSAL|L2_FRAMEWORK|L3_PROJECT)$" > /dev/null; then
            issues="${issues}Invalid classification value: '$classification'\n"
        fi
    fi
    
    # Check for name field (for agents)
    if [[ "$file" == *"agent"* ]]; then
        if ! echo "$frontmatter" | grep -q "^name:" 2>/dev/null; then
            issues="${issues}Missing 'name' field for agent\n"
        fi
    fi
    
    # Check for description field (for commands)
    if [[ "$file" == *"commands"* ]]; then
        if ! echo "$frontmatter" | grep -q "^description:" 2>/dev/null; then
            issues="${issues}Missing 'description' field for command\n"
        fi
    fi
    
    if [ -z "$issues" ]; then
        print_result "$test_name" "PASS" ""
    else
        print_result "$test_name" "FAIL" "$issues"
    fi
}

# Function to check agent independence
check_agent_independence() {
    local file="$1"
    local level="$2"
    local test_name="$(basename $file): Independence check"
    local dependencies=""
    
    if [ "$level" = "L1_UNIVERSAL" ]; then
        # Check for dependencies on other project-specific agents
        if grep -q "@agent-shirokuma-mcp-specialist" "$file" 2>/dev/null; then
            dependencies="${dependencies}Depends on project-specific mcp-specialist agent\n"
        fi
        
        # Check for create_item, update_item calls (project-specific MCP)
        if grep -E "(create_item|update_item|get_item)" "$file" 2>/dev/null | grep -v "# Example" > /dev/null; then
            dependencies="${dependencies}Contains direct MCP item manipulation calls\n"
        fi
    fi
    
    if [ -z "$dependencies" ]; then
        print_result "$test_name" "PASS" ""
    else
        print_result "$test_name" "FAIL" "$dependencies"
    fi
}

# Function to validate required sections
check_required_sections() {
    local file="$1"
    local test_name="$(basename $file): Required sections check"
    local missing=""
    
    # For agents, check for key sections
    if [[ "$file" == *"agent"* ]]; then
        if ! grep -q "## Core Purpose" "$file" 2>/dev/null; then
            missing="${missing}Missing '## Core Purpose' section\n"
        fi
        if ! grep -q "## Language Setting" "$file" 2>/dev/null; then
            missing="${missing}Missing '## Language Setting' section\n"
        fi
        if ! grep -q "## Project Configuration" "$file" 2>/dev/null; then
            missing="${missing}Missing '## Project Configuration' section\n"
        fi
    fi
    
    # For commands, check for usage section
    if [[ "$file" == *"commands"* ]]; then
        if ! grep -q "## Usage" "$file" 2>/dev/null && ! grep -q "## 使用方法" "$file" 2>/dev/null; then
            missing="${missing}Missing '## Usage' section\n"
        fi
    fi
    
    if [ -z "$missing" ]; then
        print_result "$test_name" "PASS" ""
    else
        print_result "$test_name" "WARN" "$missing"
    fi
}

# Main test execution
echo "========================================="
echo "SHIROKUMA Generic Agent Validation Tests"
echo "========================================="
echo

# Define test files and their expected classifications
declare -A TEST_FILES=(
    [".claude/agents/shirokuma-designer.md"]="L1_UNIVERSAL"
    [".claude/agents/shirokuma-researcher.md"]="L1_UNIVERSAL"
    [".claude/commands/ai-commit.md"]="L1_UNIVERSAL"
    [".claude/commands/ai-tests.md"]="L2_FRAMEWORK"
)

# Additional files to check if they exist
declare -A OPTIONAL_FILES=(
    [".claude/agents/shirokuma-programmer.md"]="L1_UNIVERSAL"
    [".claude/agents/shirokuma-tester.md"]="L1_UNIVERSAL"
    [".claude/agents/shirokuma-reviewer.md"]="L1_UNIVERSAL"
)

echo "Testing required files..."
echo "-------------------------"

for file in "${!TEST_FILES[@]}"; do
    level="${TEST_FILES[$file]}"
    
    if [ ! -f "$file" ]; then
        print_result "$(basename $file): File exists" "FAIL" "File not found"
        continue
    fi
    
    echo
    echo "Testing: $file (Expected: $level)"
    echo "................................................"
    
    # Run all validation checks
    validate_frontmatter "$file"
    check_forbidden_patterns "$file" "$level"
    check_config_references "$file" "$level"
    check_agent_independence "$file" "$level"
    check_required_sections "$file"
done

echo
echo "Testing optional files (if present)..."
echo "--------------------------------------"

for file in "${!OPTIONAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        level="${OPTIONAL_FILES[$file]}"
        echo
        echo "Testing: $file (Expected: $level)"
        echo "................................................"
        
        validate_frontmatter "$file"
        check_forbidden_patterns "$file" "$level"
        check_config_references "$file" "$level"
        check_agent_independence "$file" "$level"
        check_required_sections "$file"
    fi
done

# Summary
echo
echo "========================================="
echo "Test Summary"
echo "========================================="

if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo "Agents and commands are properly generic."
    exit 0
elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}Tests passed with $WARNINGS warning(s)${NC}"
    echo "Review warnings for potential improvements."
    exit 0
else
    echo -e "${RED}$FAILED test(s) failed${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Also found $WARNINGS warning(s)${NC}"
    fi
    echo
    echo "Failed tests must be fixed for agents to be truly generic."
    
    # Show failed tests summary
    echo
    echo "Failed Tests:"
    for test in "${!TEST_RESULTS[@]}"; do
        if [[ "${TEST_RESULTS[$test]}" == FAIL* ]]; then
            echo "  - $test"
        fi
    done
    
    exit 1
fi