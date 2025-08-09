#!/bin/bash
# Test script for Pre-flight Check scripts
# Verifies that all modules work without environment variables

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

# Colors for output
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
  local test_name="$1"
  local command="$2"
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  echo -n "Testing: $test_name... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}FAILED${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

# Main test execution
main() {
  echo "================================================"
  echo "Testing Pre-flight Check Scripts"
  echo "================================================"
  echo
  
  # Test main script
  echo "Testing main orchestrator..."
  run_test "Help option" "${SCRIPT_DIR}/preflight-check.sh --help"
  run_test "Version option" "${SCRIPT_DIR}/preflight-check.sh --version"
  run_test "Debug mode" "${SCRIPT_DIR}/preflight-check.sh --debug --skip-build --skip-test --skip-lint"
  run_test "Verbose mode" "${SCRIPT_DIR}/preflight-check.sh --verbose --skip-build --skip-test --skip-lint"
  run_test "Custom timeout" "${SCRIPT_DIR}/preflight-check.sh --timeout 10 --skip-build --skip-test --skip-lint"
  echo
  
  # Test modules
  echo "Testing modules..."
  run_test "Build module help" "${SCRIPT_DIR}/modules/build-check.sh --help"
  run_test "Test module help" "${SCRIPT_DIR}/modules/test-check.sh --help"
  run_test "Lint module help" "${SCRIPT_DIR}/modules/lint-check.sh --help"
  run_test "Checkpoint module help" "${SCRIPT_DIR}/modules/checkpoint-create.sh --help"
  run_test "Checkpoint list" "${SCRIPT_DIR}/modules/checkpoint-create.sh --list"
  echo
  
  # Test argument parsing
  echo "Testing argument parsing..."
  run_test "Multiple skip options" "${SCRIPT_DIR}/preflight-check.sh --skip-build --skip-test --skip-lint --skip-checkpoint"
  run_test "Force option" "${SCRIPT_DIR}/preflight-check.sh --force --skip-build --skip-test --skip-lint"
  run_test "Individual timeouts" "${SCRIPT_DIR}/preflight-check.sh --build-timeout 100 --test-timeout 200 --lint-timeout 50 --skip-build --skip-test --skip-lint"
  echo
  
  # Test checkpoint creation
  echo "Testing checkpoint creation..."
  run_test "Create checkpoint" "${SCRIPT_DIR}/modules/checkpoint-create.sh --build-passed=true --test-passed=false --lint-passed=true"
  run_test "Named checkpoint" "${SCRIPT_DIR}/modules/checkpoint-create.sh --name test_checkpoint --build-passed=true --test-passed=true --lint-passed=true"
  echo
  
  # Summary
  echo "================================================"
  echo "Test Summary"
  echo "================================================"
  echo "Tests run: $TESTS_RUN"
  echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
  echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
  echo
  
  if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo "The Pre-flight Check scripts work correctly without environment variables."
    exit 0
  else
    echo -e "${RED}❌ Some tests failed.${NC}"
    echo "Please review the failures above."
    exit 1
  fi
}

# Run tests
main "$@"