#!/bin/bash
# Quick validation test for Pre-flight Check scripts
# Runs essential tests to ensure basic functionality

set -euo pipefail

# Script directory
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Simple test function
test_command() {
  local name="$1"
  local command="$2"
  local expected_exit="${3:-0}"
  
  echo -n "Testing $name... "
  
  local actual_exit=0
  if eval "$command" >/dev/null 2>&1; then
    actual_exit=0
  else
    actual_exit=$?
  fi
  
  if [ "$actual_exit" -eq "$expected_exit" ]; then
    echo -e "${GREEN}✓${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} (expected $expected_exit, got $actual_exit)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

echo "===================================="
echo "Quick Validation Test Suite"
echo "===================================="
echo

# Test main orchestrator
echo "Main Orchestrator:"
test_command "help" "${SCRIPT_DIR}/preflight-check.sh --help"
test_command "version" "${SCRIPT_DIR}/preflight-check.sh --version"
test_command "skip all" "${SCRIPT_DIR}/preflight-check.sh --skip-build --skip-test --skip-lint --skip-checkpoint"
test_command "invalid option" "${SCRIPT_DIR}/preflight-check.sh --invalid" 6
echo

# Test build module
echo "Build Module:"
test_command "help" "${SCRIPT_DIR}/modules/build-check.sh --help"
test_command "invalid option" "${SCRIPT_DIR}/modules/build-check.sh --invalid" 6
echo

# Test test module
echo "Test Module:"
test_command "help" "${SCRIPT_DIR}/modules/test-check.sh --help"
test_command "invalid option" "${SCRIPT_DIR}/modules/test-check.sh --invalid" 6
echo

# Test lint module
echo "Lint Module:"
test_command "help" "${SCRIPT_DIR}/modules/lint-check.sh --help"
test_command "invalid option" "${SCRIPT_DIR}/modules/lint-check.sh --invalid" 6
echo

# Test checkpoint module
echo "Checkpoint Module:"
test_command "help" "${SCRIPT_DIR}/modules/checkpoint-create.sh --help"
test_command "list" "${SCRIPT_DIR}/modules/checkpoint-create.sh --list"
test_command "create checkpoint" "${SCRIPT_DIR}/modules/checkpoint-create.sh --build-passed=true --test-passed=true --lint-passed=true"
test_command "invalid option" "${SCRIPT_DIR}/modules/checkpoint-create.sh --invalid" 6
echo

# Summary
echo "===================================="
echo "Summary:"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All quick tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi