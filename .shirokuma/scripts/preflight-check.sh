#!/bin/bash
# Main Pre-flight Check Orchestrator
# Coordinates all validation modules for comprehensive pre-commit checks
# NO ENVIRONMENT VARIABLES for configuration - uses command-line arguments only

set -euo pipefail

# ========================================
# Script Initialization
# ========================================

# Get script directory
PREFLIGHT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PREFLIGHT_SCRIPT_DIR

# Source common utilities
source "${PREFLIGHT_SCRIPT_DIR}/lib/preflight-common.sh"

# ========================================
# Configuration (via command-line arguments only)
# ========================================

readonly SCRIPT_VERSION="2.0.0"
readonly PREFLIGHT_NAME="Pre-flight Check"

# Module paths
readonly MODULE_DIR="${PREFLIGHT_SCRIPT_DIR}/modules"
readonly MARKDOWN_CHECK="${PREFLIGHT_SCRIPT_DIR}/../tools/check-markdown-only.sh"

# ========================================
# Global Variables (set by argument parsing)
# ========================================

# These will be set by parsing command-line arguments
DEBUG_MODE="false"
VERBOSE_MODE="false"
SKIP_BUILD="false"
SKIP_TEST="false"
SKIP_LINT="false"
SKIP_CHECKPOINT="false"
FORCE_CHECKS="false"
PARALLEL_CHECKS="false"
CLEAN_BUILD="false"
AUTO_FIX="false"
SKIP_ON_MARKDOWN="true"
CREATE_CHECKPOINT="true"
GLOBAL_TIMEOUT="$DEFAULT_GLOBAL_TIMEOUT"
BUILD_TIMEOUT="$DEFAULT_BUILD_TIMEOUT"
TEST_TIMEOUT="$DEFAULT_TEST_TIMEOUT"
LINT_TIMEOUT="$DEFAULT_LINT_TIMEOUT"

# Status tracking
BUILD_PASSED="false"
TEST_PASSED="false"
LINT_PASSED="false"
MARKDOWN_ONLY="false"

# ========================================
# Trap Handlers
# ========================================

# Cleanup on exit
cleanup() {
  local exit_code=$?
  
  if [ $exit_code -ne 0 ] && [ $exit_code -ne $EXIT_MARKDOWN_ONLY ]; then
    log_debug "$DEBUG_MODE" "Cleanup: Exit code $exit_code"
  fi
  
  # Remove any temporary files
  rm -f /tmp/preflight-*.tmp 2>/dev/null || true
  
  return $exit_code
}

trap cleanup EXIT

# Handle interruption
interrupt_handler() {
  echo
  log_error "Pre-flight check interrupted by user"
  exit 130
}

trap interrupt_handler INT TERM

# ========================================
# Helper Functions
# ========================================

# Show usage information
show_usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Pre-flight Check Orchestrator - Comprehensive validation before commit
Version: $SCRIPT_VERSION

Options:
  --skip-build            Skip build validation
  --skip-test             Skip test validation
  --skip-lint             Skip lint validation
  --skip-checkpoint       Skip checkpoint creation
  --skip-on-markdown      Skip checks for markdown-only changes (default: true)
  --no-skip-on-markdown   Don't skip checks for markdown-only changes
  --force                 Run full checks even for markdown-only changes
  --parallel              Run checks in parallel (experimental)
  --clean                 Clean build artifacts before checks
  --fix                   Auto-fix lint issues
  --timeout <seconds>     Global timeout in seconds (default: $DEFAULT_GLOBAL_TIMEOUT)
  --build-timeout <secs>  Build timeout in seconds (default: $DEFAULT_BUILD_TIMEOUT)
  --test-timeout <secs>   Test timeout in seconds (default: $DEFAULT_TEST_TIMEOUT)
  --lint-timeout <secs>   Lint timeout in seconds (default: $DEFAULT_LINT_TIMEOUT)
  --verbose, -v           Enable verbose output
  --debug, -d             Enable debug output (implies verbose)
  --help, -h              Show this help message
  --version               Show version information

Exit Codes:
  0  All checks passed
  1  One or more checks failed
  2  Markdown-only changes detected (checks skipped)
  3  Timeout occurred
  4  Check was skipped
  5  General error
  6  Configuration error
  7  Dependency error

Examples:
  # Run all checks with default settings
  $(basename "$0")
  
  # Skip test validation
  $(basename "$0") --skip-test
  
  # Force full checks for markdown changes
  $(basename "$0") --force
  
  # Run with custom timeout and verbose output
  $(basename "$0") --timeout 600 --verbose
  
  # Run with parallel checks and auto-fix
  $(basename "$0") --parallel --fix
  
  # Debug mode with custom timeouts
  $(basename "$0") --debug --build-timeout 300 --test-timeout 600

EOF
}

# Show version information
show_version() {
  echo "Pre-flight Check Orchestrator v$SCRIPT_VERSION"
  echo "Part of SHIROKUMA development toolkit"
  echo "Configuration: Command-line arguments only (no env vars)"
}

# Check if module exists
check_module() {
  local module="$1"
  local module_path="${MODULE_DIR}/${module}"
  
  if [ ! -f "$module_path" ]; then
    log_error "Module not found: $module"
    return 1
  fi
  
  if [ ! -x "$module_path" ]; then
    log_warn "Module not executable: $module (fixing...)"
    chmod +x "$module_path"
  fi
  
  return 0
}

# Run a check module
run_module() {
  local module="$1"
  shift
  
  local module_path="${MODULE_DIR}/${module}"
  
  if ! check_module "$module"; then
    return $EXIT_ERROR
  fi
  
  log_debug "$DEBUG_MODE" "Running module: $module $*"
  
  # Execute module and capture exit code
  local exit_code=0
  
  if [ "${PARALLEL_CHECKS}" = "true" ]; then
    # Run in background for parallel execution
    "$module_path" "$@" &
    return 0
  else
    # Run synchronously
    "$module_path" "$@" || exit_code=$?
    return $exit_code
  fi
}

# Wait for parallel jobs
wait_for_jobs() {
  local failed=0
  
  log_step "Waiting for parallel checks to complete..."
  
  # Wait for all background jobs
  while [ "$(jobs -r | wc -l)" -gt 0 ]; do
    # Check each job
    for job in $(jobs -p); do
      if ! kill -0 "$job" 2>/dev/null; then
        wait "$job"
        local exit_code=$?
        if [ $exit_code -ne 0 ]; then
          failed=$((failed + 1))
          log_debug "$DEBUG_MODE" "Job $job failed with exit code $exit_code"
        fi
      fi
    done
    sleep 0.5
  done
  
  if [ $failed -gt 0 ]; then
    log_error "$failed check(s) failed in parallel execution"
    return $EXIT_FAIL
  fi
  
  return 0
}

# ========================================
# Check Functions
# ========================================

# Check for markdown-only changes
check_markdown_only() {
  log_step "Checking for markdown-only changes..."
  
  if [ ! -f "$MARKDOWN_CHECK" ]; then
    log_debug "$DEBUG_MODE" "Markdown check script not found, assuming code changes"
    return 1
  fi
  
  # Run markdown check
  local exit_code=0
  "$MARKDOWN_CHECK" "$@" || exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    # Markdown-only changes detected
    MARKDOWN_ONLY="true"
    return 0
  else
    MARKDOWN_ONLY="false"
    return 1
  fi
}

# Run build check
run_build_check() {
  if [ "${SKIP_BUILD}" = "true" ]; then
    log_info "Build check skipped (--skip-build)"
    BUILD_PASSED="true"
    return 0
  fi
  
  # Build arguments array
  local -a build_args=()
  
  if [ "${CLEAN_BUILD}" = "true" ]; then
    build_args+=("--clean")
  fi
  if [ "${DEBUG_MODE}" = "true" ]; then
    build_args+=("--debug")
  fi
  if [ "${VERBOSE_MODE}" = "true" ]; then
    build_args+=("--verbose")
  fi
  build_args+=("--timeout")
  build_args+=("$BUILD_TIMEOUT")
  
  run_module "build-check.sh" "${build_args[@]}"
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    BUILD_PASSED="true"
  else
    BUILD_PASSED="false"
  fi
  
  return $exit_code
}

# Run test check
run_test_check() {
  if [ "${SKIP_TEST}" = "true" ]; then
    log_info "Test check skipped (--skip-test)"
    TEST_PASSED="true"
    return 0
  fi
  
  # Build arguments array
  local -a test_args=()
  
  if [ "${DEBUG_MODE}" = "true" ]; then
    test_args+=("--debug")
  fi
  if [ "${VERBOSE_MODE}" = "true" ]; then
    test_args+=("--verbose")
  fi
  test_args+=("--timeout")
  test_args+=("$TEST_TIMEOUT")
  
  run_module "test-check.sh" "${test_args[@]}"
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    TEST_PASSED="true"
  else
    TEST_PASSED="false"
  fi
  
  return $exit_code
}

# Run lint check
run_lint_check() {
  if [ "${SKIP_LINT}" = "true" ]; then
    log_info "Lint check skipped (--skip-lint)"
    LINT_PASSED="true"
    return 0
  fi
  
  # Build arguments array
  local -a lint_args=()
  
  if [ "${AUTO_FIX}" = "true" ]; then
    lint_args+=("--fix")
  fi
  if [ "${DEBUG_MODE}" = "true" ]; then
    lint_args+=("--debug")
  fi
  if [ "${VERBOSE_MODE}" = "true" ]; then
    lint_args+=("--verbose")
  fi
  lint_args+=("--timeout")
  lint_args+=("$LINT_TIMEOUT")
  
  run_module "lint-check.sh" "${lint_args[@]}"
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    LINT_PASSED="true"
  else
    LINT_PASSED="false"
  fi
  
  return $exit_code
}

# Create checkpoint
create_checkpoint_wrapper() {
  if [ "${SKIP_CHECKPOINT}" = "true" ]; then
    log_debug "$DEBUG_MODE" "Checkpoint creation skipped"
    return 0
  fi
  
  # Build arguments array
  local -a checkpoint_args=()
  
  if [ "${DEBUG_MODE}" = "true" ]; then
    checkpoint_args+=("--debug")
  fi
  if [ "${VERBOSE_MODE}" = "true" ]; then
    checkpoint_args+=("--verbose")
  fi
  
  # Pass the check results
  checkpoint_args+=("--build-passed=$BUILD_PASSED")
  checkpoint_args+=("--test-passed=$TEST_PASSED")
  checkpoint_args+=("--lint-passed=$LINT_PASSED")
  
  run_module "checkpoint-create.sh" "${checkpoint_args[@]}"
}

# ========================================
# Main Orchestration
# ========================================

main() {
  local start_time
  start_time=$(date +%s)
  
  # Parse command line arguments
  while [ $# -gt 0 ]; do
    case "$1" in
      --skip-build)
        SKIP_BUILD="true"
        ;;
      --skip-test)
        SKIP_TEST="true"
        ;;
      --skip-lint)
        SKIP_LINT="true"
        ;;
      --skip-checkpoint)
        SKIP_CHECKPOINT="true"
        ;;
      --skip-on-markdown)
        SKIP_ON_MARKDOWN="true"
        ;;
      --no-skip-on-markdown)
        SKIP_ON_MARKDOWN="false"
        ;;
      --force|-f)
        FORCE_CHECKS="true"
        ;;
      --parallel)
        PARALLEL_CHECKS="true"
        ;;
      --clean)
        CLEAN_BUILD="true"
        ;;
      --fix)
        AUTO_FIX="true"
        ;;
      --timeout)
        shift
        if [ -n "${1:-}" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
          GLOBAL_TIMEOUT="$1"
          # Keep timeouts simple - don't scale them
          # Users can set individual timeouts if needed
        else
          log_error "Invalid timeout value: ${1:-missing}"
          exit $EXIT_CONFIG_ERROR
        fi
        ;;
      --build-timeout)
        shift
        if [ -n "${1:-}" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
          BUILD_TIMEOUT="$1"
        else
          log_error "Invalid build timeout value: ${1:-missing}"
          exit $EXIT_CONFIG_ERROR
        fi
        ;;
      --test-timeout)
        shift
        if [ -n "${1:-}" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
          TEST_TIMEOUT="$1"
        else
          log_error "Invalid test timeout value: ${1:-missing}"
          exit $EXIT_CONFIG_ERROR
        fi
        ;;
      --lint-timeout)
        shift
        if [ -n "${1:-}" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
          LINT_TIMEOUT="$1"
        else
          log_error "Invalid lint timeout value: ${1:-missing}"
          exit $EXIT_CONFIG_ERROR
        fi
        ;;
      --verbose|-v)
        VERBOSE_MODE="true"
        ;;
      --debug|-d)
        DEBUG_MODE="true"
        VERBOSE_MODE="true"
        ;;
      --help|-h)
        show_usage
        exit 0
        ;;
      --version)
        show_version
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
  
  # Show header
  print_section "Pre-flight Checks v$SCRIPT_VERSION"
  
  # Show configuration if in debug mode
  if [ "$DEBUG_MODE" = "true" ]; then
    log_debug "$DEBUG_MODE" "Configuration:"
    log_debug "$DEBUG_MODE" "  Skip on markdown: $SKIP_ON_MARKDOWN"
    log_debug "$DEBUG_MODE" "  Force checks: $FORCE_CHECKS"
    log_debug "$DEBUG_MODE" "  Parallel mode: $PARALLEL_CHECKS"
    log_debug "$DEBUG_MODE" "  Build timeout: $BUILD_TIMEOUT seconds"
    log_debug "$DEBUG_MODE" "  Test timeout: $TEST_TIMEOUT seconds"
    log_debug "$DEBUG_MODE" "  Lint timeout: $LINT_TIMEOUT seconds"
  fi
  
  # Initialize status tracking
  local overall_status=0
  local checks_run=0
  local checks_passed=0
  local checks_failed=0
  local checks_skipped=0
  
  # Check for markdown-only changes
  if [ "${SKIP_ON_MARKDOWN}" = "true" ] && [ "${FORCE_CHECKS}" = "false" ]; then
    local markdown_args=""
    if [ "${FORCE_CHECKS}" = "true" ]; then
      markdown_args="--force"
    fi
    
    if check_markdown_only $markdown_args; then
      # Markdown-only changes detected
      print_section "Results"
      log_success "Markdown-only changes detected - skipping validation checks"
      echo
      echo "Time elapsed: $(format_duration $(($(date +%s) - start_time)))"
      echo "Checks skipped: Build, Test, Lint"
      echo
      log_info "💡 To force full checks, use: --force"
      
      exit $EXIT_MARKDOWN_ONLY
    fi
  fi
  
  # Run validation checks
  print_section "Running Validation Checks"
  
  if [ "${PARALLEL_CHECKS}" = "true" ]; then
    log_info "Running checks in parallel mode"
    
    # Start all checks in parallel
    run_build_check &
    local build_pid=$!
    checks_run=$((checks_run + 1))
    
    run_test_check &
    local test_pid=$!
    checks_run=$((checks_run + 1))
    
    run_lint_check &
    local lint_pid=$!
    checks_run=$((checks_run + 1))
    
    # Wait for all checks to complete
    wait_for_jobs
    overall_status=$?
    
  else
    # Run checks sequentially
    
    # Build check
    if run_build_check; then
      checks_passed=$((checks_passed + 1))
    else
      checks_failed=$((checks_failed + 1))
      overall_status=$EXIT_FAIL
    fi
    checks_run=$((checks_run + 1))
    
    # Test check
    if run_test_check; then
      checks_passed=$((checks_passed + 1))
    else
      checks_failed=$((checks_failed + 1))
      overall_status=$EXIT_FAIL
    fi
    checks_run=$((checks_run + 1))
    
    # Lint check
    if run_lint_check; then
      checks_passed=$((checks_passed + 1))
    else
      checks_failed=$((checks_failed + 1))
      overall_status=$EXIT_FAIL
    fi
    checks_run=$((checks_run + 1))
  fi
  
  # Calculate skipped checks
  if [ "${SKIP_BUILD}" = "true" ]; then
    checks_skipped=$((checks_skipped + 1))
    checks_run=$((checks_run - 1))
  fi
  if [ "${SKIP_TEST}" = "true" ]; then
    checks_skipped=$((checks_skipped + 1))
    checks_run=$((checks_run - 1))
  fi
  if [ "${SKIP_LINT}" = "true" ]; then
    checks_skipped=$((checks_skipped + 1))
    checks_run=$((checks_run - 1))
  fi
  
  # Recalculate passed count for parallel mode
  if [ "${PARALLEL_CHECKS}" = "true" ]; then
    checks_passed=0
    [ "${BUILD_PASSED}" = "true" ] && checks_passed=$((checks_passed + 1))
    [ "${TEST_PASSED}" = "true" ] && checks_passed=$((checks_passed + 1))
    [ "${LINT_PASSED}" = "true" ] && checks_passed=$((checks_passed + 1))
    checks_failed=$((checks_run - checks_passed))
  fi
  
  # Create checkpoint if all checks passed
  if [ $overall_status -eq 0 ] && [ "${CREATE_CHECKPOINT}" = "true" ]; then
    echo
    create_checkpoint_wrapper
  fi
  
  # Show summary
  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  print_section "Pre-flight Check Summary"
  
  echo "Time elapsed: $(format_duration $duration)"
  echo "Checks run: $checks_run"
  echo "Passed: $checks_passed"
  echo "Failed: $checks_failed"
  echo "Skipped: $checks_skipped"
  echo
  
  # Show individual results
  echo "Results:"
  [ "${BUILD_PASSED}" = "true" ] && echo "  ✅ Build: Passed" || echo "  ❌ Build: Failed"
  [ "${TEST_PASSED}" = "true" ] && echo "  ✅ Tests: Passed" || echo "  ❌ Tests: Failed"
  [ "${LINT_PASSED}" = "true" ] && echo "  ✅ Lint: Passed" || echo "  ❌ Lint: Failed"
  
  echo
  
  # Final status
  if [ $overall_status -eq 0 ]; then
    log_success "All pre-flight checks passed! ✈️"
    echo "Your code is ready for commit."
  else
    log_error "Pre-flight checks failed!"
    echo "Please fix the issues before committing."
    
    # Provide helpful suggestions
    echo
    echo "Suggestions:"
    if [ "${BUILD_PASSED}" = "false" ]; then
      echo "  • Fix build errors: npm run build"
    fi
    if [ "${TEST_PASSED}" = "false" ]; then
      echo "  • Fix failing tests: npm test"
    fi
    if [ "${LINT_PASSED}" = "false" ]; then
      echo "  • Fix lint errors: npm run lint:errors"
      echo "  • Try auto-fix: npm run lint:fix"
    fi
  fi
  
  exit $overall_status
}

# ========================================
# Script Entry Point
# ========================================

# Ensure we're in the project root
if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
  log_error "Not in a Node.js project root (package.json not found)"
  log_info "Current directory: $PWD"
  log_info "Expected project root: $PROJECT_ROOT"
  exit $EXIT_CONFIG_ERROR
fi

# Change to project root
cd "$PROJECT_ROOT" || exit $EXIT_ERROR

# Run main orchestration
main "$@"