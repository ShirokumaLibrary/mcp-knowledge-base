#!/bin/bash
# Test validation module for Pre-flight Checks
# Validates that all tests pass successfully
# NO ENVIRONMENT VARIABLES for configuration - uses command-line arguments only

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/preflight-common.sh"

# ========================================
# Module Configuration
# ========================================

readonly MODULE_NAME="Test Check"
readonly TEST_COMMAND="npm test"

# Default settings (can be overridden with command-line args)
TEST_TIMEOUT="$DEFAULT_TEST_TIMEOUT"
DEBUG_MODE="false"
VERBOSE_MODE="false"

# ========================================
# Test Functions
# ========================================

# Run test command
run_tests() {
  local start_time
  start_time=$(date +%s)
  
  log_step "Starting test execution..."
  log_debug "$DEBUG_MODE" "Test command: $TEST_COMMAND"
  log_debug "$DEBUG_MODE" "Timeout: ${TEST_TIMEOUT}s"
  
  # Create temporary file for output
  local output_file
  output_file=$(mktemp)
  trap "rm -f '$output_file'" EXIT
  
  # Execute tests with timeout
  if execute_with_timeout "$TEST_TIMEOUT" "$TEST_COMMAND > '$output_file' 2>&1"; then
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Tests completed successfully ($(format_duration $duration))"
    
    # Parse test results if possible
    parse_test_results "$output_file"
    
    # Show summary if verbose
    if is_verbose "$VERBOSE_MODE" "$DEBUG_MODE"; then
      log_debug "$DEBUG_MODE" "Test output (last 20 lines):"
      tail -20 "$output_file" | sed 's/^/  /'
    fi
    
    return 0
  else
    local exit_code=$?
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq $EXIT_TIMEOUT ]; then
      log_error "Tests timed out after ${TEST_TIMEOUT}s"
    else
      log_error "Tests failed after $(format_duration $duration)"
    fi
    
    # Parse failed test results
    parse_test_results "$output_file"
    
    # Show error output
    log_error "Test output (last 30 lines):"
    tail -30 "$output_file" | sed 's/^/  /' >&2
    
    return $exit_code
  fi
}

# Parse test results from output
parse_test_results() {
  local output_file="$1"
  
  # Try to extract Jest test results
  if grep -q "Test Suites:" "$output_file" 2>/dev/null; then
    local test_summary
    test_summary=$(grep -E "(Test Suites:|Tests:)" "$output_file" | tail -2)
    
    if [ -n "$test_summary" ]; then
      echo "Test Summary:"
      echo "$test_summary" | sed 's/^/  /'
    fi
    
    # Extract coverage if present
    if grep -q "Coverage summary" "$output_file" 2>/dev/null; then
      log_info "Coverage report available"
      if is_verbose "$VERBOSE_MODE" "$DEBUG_MODE"; then
        grep -A 10 "Coverage summary" "$output_file" | sed 's/^/  /'
      fi
    fi
  fi
  
  # Try to extract Mocha test results
  if grep -q "passing\|failing" "$output_file" 2>/dev/null; then
    local mocha_summary
    mocha_summary=$(grep -E "[0-9]+ passing|[0-9]+ failing" "$output_file" | tail -2)
    
    if [ -n "$mocha_summary" ]; then
      echo "Test Results:"
      echo "$mocha_summary" | sed 's/^/  /'
    fi
  fi
  
  # Extract any failed test names
  if grep -qE "(FAIL|✕|✗|●)" "$output_file" 2>/dev/null; then
    log_warn "Failed tests detected:"
    grep -E "(FAIL |✕ |✗ |● )" "$output_file" | head -10 | sed 's/^/  /'
  fi
}

# Check test prerequisites
check_prerequisites() {
  log_step "Checking test prerequisites..."
  
  # Check if package.json exists
  if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
    log_error "package.json not found in project root"
    return $EXIT_CONFIG_ERROR
  fi
  
  # Check if test script exists in package.json
  if ! grep -q '"test"' "${PROJECT_ROOT}/package.json"; then
    log_warn "No test script found in package.json"
    log_info "Tests will be skipped"
    return $EXIT_SKIP
  fi
  
  # Check if node_modules exists
  if [ ! -d "${PROJECT_ROOT}/node_modules" ]; then
    log_warn "node_modules not found - you may need to run 'npm install'"
    return $EXIT_DEPENDENCY_ERROR
  fi
  
  # Check Node.js availability
  if ! check_command "node"; then
    return $EXIT_DEPENDENCY_ERROR
  fi
  
  # Check package manager
  local pkg_manager
  pkg_manager="$(get_package_manager)"
  if ! check_command "$pkg_manager"; then
    return $EXIT_DEPENDENCY_ERROR
  fi
  
  log_success "Prerequisites check passed"
  return 0
}

# Check for test files
check_test_files() {
  log_step "Checking for test files..."
  
  local test_dirs=("test" "tests" "__tests__" "spec" "src")
  local test_patterns=("*.test.js" "*.spec.js" "*.test.ts" "*.spec.ts" "*.test.jsx" "*.spec.jsx" "*.test.tsx" "*.spec.tsx")
  local found_tests=false
  
  for dir in "${test_dirs[@]}"; do
    if [ -d "${PROJECT_ROOT}/${dir}" ]; then
      for pattern in "${test_patterns[@]}"; do
        if find "${PROJECT_ROOT}/${dir}" -name "$pattern" -type f 2>/dev/null | head -1 | grep -q .; then
          found_tests=true
          break 2
        fi
      done
    fi
  done
  
  if [ "$found_tests" = true ]; then
    log_success "Test files found"
    return 0
  else
    log_warn "No test files found in common locations"
    log_info "Test execution may fail or report no tests"
    return 0  # Not an error, just a warning
  fi
}

# Clean test artifacts
clean_test_artifacts() {
  log_step "Cleaning test artifacts..."
  
  # Remove coverage directory
  if [ -d "${PROJECT_ROOT}/coverage" ]; then
    log_debug "$DEBUG_MODE" "Removing coverage/"
    rm -rf "${PROJECT_ROOT}/coverage"
  fi
  
  # Remove test results
  if [ -d "${PROJECT_ROOT}/test-results" ]; then
    log_debug "$DEBUG_MODE" "Removing test-results/"
    rm -rf "${PROJECT_ROOT}/test-results"
  fi
  
  # Remove Jest cache
  if [ -d "${PROJECT_ROOT}/.jest" ]; then
    log_debug "$DEBUG_MODE" "Removing .jest cache"
    rm -rf "${PROJECT_ROOT}/.jest"
  fi
  
  log_success "Test artifacts cleaned"
}

# ========================================
# Main Execution
# ========================================

main() {
  print_subsection "$MODULE_NAME"
  
  # Parse arguments
  local clean_artifacts=false
  local skip_file_check=false
  local coverage_flag=false
  
  while [ $# -gt 0 ]; do
    case "$1" in
      --clean)
        clean_artifacts=true
        ;;
      --skip-file-check)
        skip_file_check=true
        ;;
      --coverage)
        coverage_flag=true
        ;;
      --timeout)
        shift
        if [ -n "${1:-}" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
          TEST_TIMEOUT="$1"
        else
          log_error "Invalid timeout value: ${1:-missing}"
          exit $EXIT_CONFIG_ERROR
        fi
        ;;
      --debug)
        DEBUG_MODE="true"
        VERBOSE_MODE="true"
        ;;
      --verbose)
        VERBOSE_MODE="true"
        ;;
      --help|-h)
        cat <<EOF
Usage: $0 [OPTIONS]

Test validation module for Pre-flight Checks

Options:
  --clean           Clean test artifacts before running
  --skip-file-check Skip checking for test files
  --coverage        Request coverage report
  --timeout N       Test timeout in seconds (default: $DEFAULT_TEST_TIMEOUT)
  --debug           Enable debug output
  --verbose         Enable verbose output
  --help, -h        Show this help message

Examples:
  # Normal test check
  $0
  
  # Clean run with coverage
  $0 --clean --coverage
  
  # Custom timeout with debug
  $0 --timeout 600 --debug

Exit Codes:
  0  Tests passed
  1  Tests failed
  3  Test timeout
  4  Tests skipped (no test script)
  5  General error
  6  Configuration error
  7  Dependencies missing
EOF
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit $EXIT_CONFIG_ERROR
        ;;
    esac
    shift
  done
  
  # Track overall status
  local exit_code=0
  
  # Check prerequisites
  check_prerequisites
  exit_code=$?
  
  if [ $exit_code -eq $EXIT_SKIP ]; then
    log_info "$MODULE_NAME skipped: No test script defined"
    exit $EXIT_SKIP
  elif [ $exit_code -ne 0 ]; then
    log_error "$MODULE_NAME failed: Prerequisites not met"
    exit $exit_code
  fi
  
  # Clean if requested
  if [ "$clean_artifacts" = true ]; then
    clean_test_artifacts
  fi
  
  # Check for test files unless skipped
  if [ "$skip_file_check" = false ]; then
    check_test_files
  fi
  
  # Run tests
  if ! run_tests; then
    exit_code=$?
    log_error "$MODULE_NAME failed: Test execution failed"
    exit $exit_code
  fi
  
  # Success
  log_result "pass" "$MODULE_NAME completed successfully"
  
  exit $EXIT_SUCCESS
}

# Run main if executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi