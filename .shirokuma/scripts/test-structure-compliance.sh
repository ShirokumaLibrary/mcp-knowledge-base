#!/bin/bash
# Test Structure Compliance Checker
# Ensures all test scripts use consistent path references

set -euo pipefail

# Get the scripts directory consistently
readonly SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPTS_DIR}/../.." && pwd)"

# Colors for output
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# ========================================
# Path Standardization Rules
# ========================================
# 
# RULE 1: Always use ${SCRIPT_DIR} or ${SCRIPTS_DIR} variable
# RULE 2: Never use ./ or ../ directly in paths
# RULE 3: Never hardcode absolute paths
# RULE 4: Use consistent variable names across all scripts
# ========================================

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Path Consistency Checker${NC}"
echo -e "${CYAN}========================================${NC}"
echo

# Check for inconsistent path patterns
check_path_consistency() {
  local file="$1"
  local issues=0
  
  echo "Checking: $(basename "$file")"
  
  # Check for hardcoded absolute paths (except in comments or examples)
  if grep -E "^[^#]*/(home|usr/local|opt)/.*/\.shirokuma" "$file" >/dev/null 2>&1; then
    echo -e "  ${RED}✗${NC} Contains hardcoded absolute path"
    issues=$((issues + 1))
  fi
  
  # Check for relative paths without variable
  if grep -E "\.\.?/\.shirokuma/scripts" "$file" | grep -v "SCRIPT_DIR" >/dev/null 2>&1; then
    echo -e "  ${YELLOW}⚠${NC} Contains relative path without using SCRIPT_DIR variable"
    issues=$((issues + 1))
  fi
  
  # Check for inconsistent variable names
  if grep -q "PREFLIGHT_SCRIPT_DIR" "$file" && grep -q "SCRIPT_DIR" "$file"; then
    echo -e "  ${YELLOW}⚠${NC} Uses multiple directory variable names"
    issues=$((issues + 1))
  fi
  
  if [ $issues -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Path references are consistent"
  fi
  
  return $issues
}

# Check all test scripts
total_issues=0
for script in "${SCRIPTS_DIR}"/test-*.sh; do
  if [ -f "$script" ]; then
    check_path_consistency "$script" || total_issues=$((total_issues + $?))
  fi
done

echo
echo "Checking main scripts..."
check_path_consistency "${SCRIPTS_DIR}/preflight-check.sh" || total_issues=$((total_issues + $?))

for module in "${SCRIPTS_DIR}"/modules/*.sh; do
  if [ -f "$module" ]; then
    check_path_consistency "$module" || total_issues=$((total_issues + $?))
  fi
done

echo
echo -e "${CYAN}========================================${NC}"
echo "Summary:"

if [ $total_issues -eq 0 ]; then
  echo -e "${GREEN}✅ All scripts use consistent path references${NC}"
else
  echo -e "${RED}❌ Found $total_issues path consistency issues${NC}"
  echo
  echo "Recommended fixes:"
  echo "1. Replace hardcoded paths with \${SCRIPT_DIR} or \${SCRIPTS_DIR}"
  echo "2. Use consistent variable names across all scripts"
  echo "3. Avoid relative paths like ./ or ../ without variables"
fi

# ========================================
# Generate Path Reference Guide
# ========================================

cat > "${SCRIPTS_DIR}/PATH_REFERENCE.md" <<EOF
# Path Reference Guide for Pre-flight Scripts

## Consistent Path Usage

### Standard Variables
\`\`\`bash
# Always define at the top of your script
readonly SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="\$(cd "\${SCRIPT_DIR}/../.." && pwd)"
\`\`\`

### Referencing Scripts

#### ✅ CORRECT - Using variables
\`\`\`bash
"\${SCRIPT_DIR}/preflight-check.sh"
"\${SCRIPT_DIR}/modules/build-check.sh"
"\${SCRIPT_DIR}/test-preflight.sh"
\`\`\`

#### ❌ INCORRECT - Hardcoded or relative paths
\`\`\`bash
./.shirokuma/scripts/preflight-check.sh        # Relative path
/absolute/path/.shirokuma/scripts/test.sh      # Hardcoded absolute
../scripts/modules/build-check.sh              # Complex relative
\`\`\`

### Example Usage in Tests

\`\`\`bash
#!/bin/bash
set -euo pipefail

# Define once at the top
readonly SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"

# Use consistently throughout
test_build_module() {
  "\${SCRIPT_DIR}/modules/build-check.sh" --help
}

test_main_script() {
  "\${SCRIPT_DIR}/preflight-check.sh" --version
}
\`\`\`

## Benefits of Consistent Paths

1. **Portability**: Scripts work regardless of where they're called from
2. **Maintainability**: Easy to move or rename directories
3. **Clarity**: Clear what's being referenced
4. **CI/CD Compatibility**: Works in different environments

## Quick Reference

| Component | Path Variable |
|-----------|--------------|
| Main script | \`\${SCRIPT_DIR}/preflight-check.sh\` |
| Build module | \`\${SCRIPT_DIR}/modules/build-check.sh\` |
| Test module | \`\${SCRIPT_DIR}/modules/test-check.sh\` |
| Lint module | \`\${SCRIPT_DIR}/modules/lint-check.sh\` |
| Checkpoint module | \`\${SCRIPT_DIR}/modules/checkpoint-create.sh\` |
| Test scripts | \`\${SCRIPT_DIR}/test-*.sh\` |
| Project root | \`\${PROJECT_ROOT}\` |
EOF

echo
echo -e "${CYAN}Path reference guide saved to: ${SCRIPTS_DIR}/PATH_REFERENCE.md${NC}"

exit $total_issues