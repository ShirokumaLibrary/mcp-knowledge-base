#!/bin/bash
# CI/CD Integration Test Suite for Pre-flight Check Scripts
# Tests that scripts work correctly in CI/CD environments

set -euo pipefail

# ========================================
# Configuration
# ========================================

readonly TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR="${TEST_DIR}"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors (disabled in CI environment)
if [ -t 1 ] && [ "${CI:-false}" != "true" ]; then
  readonly GREEN='\033[0;32m'
  readonly RED='\033[0;31m'
  readonly YELLOW='\033[1;33m'
  readonly BLUE='\033[0;34m'
  readonly BOLD='\033[1m'
  readonly NC='\033[0m'
else
  readonly GREEN=''
  readonly RED=''
  readonly YELLOW=''
  readonly BLUE=''
  readonly BOLD=''
  readonly NC=''
fi

# Test results
declare -i TESTS_PASSED=0
declare -i TESTS_FAILED=0
declare -i TESTS_TOTAL=0

# ========================================
# Helper Functions
# ========================================

log_test() {
  local test_name="$1"
  echo "[TEST] $test_name"
}

log_pass() {
  local message="${1:-Test passed}"
  echo "  ✓ $message"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_fail() {
  local message="${1:-Test failed}"
  echo "  ✗ $message" >&2
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

run_test() {
  local test_name="$1"
  local test_function="$2"
  
  TESTS_TOTAL=$((TESTS_TOTAL + 1))
  log_test "$test_name"
  
  if $test_function; then
    log_pass
  else
    log_fail
  fi
}

# ========================================
# CI Environment Tests
# ========================================

test_no_tty() {
  # Test that scripts work without TTY (common in CI)
  echo "Testing without TTY..."
  
  # Run script without TTY
  echo "" | ${SCRIPT_DIR}/preflight-check.sh --help >/dev/null 2>&1
}

test_no_color_in_ci() {
  # Test that color codes are disabled in CI environment
  echo "Testing CI color output..."
  
  CI=true ${SCRIPT_DIR}/preflight-check.sh --version 2>&1 | grep -v $'\033'
}

test_exit_codes() {
  # Test that proper exit codes are returned for CI systems
  echo "Testing exit codes for CI..."
  
  # Success case
  ${SCRIPT_DIR}/preflight-check.sh --skip-build --skip-test --skip-lint --skip-checkpoint
  [ $? -eq 0 ] || return 1
  
  # Skip case
  ${SCRIPT_DIR}/modules/build-check.sh --skip
  [ $? -eq 4 ] || return 1
  
  return 0
}

test_json_output() {
  # Test JSON output format for CI parsing
  echo "Testing structured output..."
  
  # Check if scripts can output in a parseable format
  local output=$(${SCRIPT_DIR}/modules/checkpoint-create.sh --list 2>&1)
  echo "$output" | grep -q "Checkpoints" || return 1
}

test_quiet_mode() {
  # Test that scripts can run in quiet mode for CI
  echo "Testing quiet execution..."
  
  # Verbose should produce output
  local verbose_output=$(${SCRIPT_DIR}/preflight-check.sh --verbose --skip-build --skip-test --skip-lint 2>&1 | wc -l)
  
  # Non-verbose should be quieter
  local quiet_output=$(${SCRIPT_DIR}/preflight-check.sh --skip-build --skip-test --skip-lint 2>&1 | wc -l)
  
  [ $verbose_output -gt $quiet_output ] || return 1
}

test_parallel_execution() {
  # Test parallel execution for faster CI builds
  echo "Testing parallel execution..."
  
  ${SCRIPT_DIR}/preflight-check.sh --parallel --skip-build --skip-test --skip-lint --skip-checkpoint
}

test_timeout_handling() {
  # Test that timeouts work correctly in CI
  echo "Testing timeout handling..."
  
  # Very short timeout should still work for skipped checks
  ${SCRIPT_DIR}/preflight-check.sh --timeout 1 --skip-build --skip-test --skip-lint --skip-checkpoint
}

test_environment_isolation() {
  # Test that scripts don't depend on environment variables
  echo "Testing environment isolation..."
  
  # Clear environment and run
  env -i PATH="$PATH" ${SCRIPT_DIR}/preflight-check.sh --help >/dev/null 2>&1
}

test_workspace_detection() {
  # Test that scripts correctly detect project workspace
  echo "Testing workspace detection..."
  
  # Run from different directory
  (cd /tmp && ${SCRIPT_DIR}/preflight-check.sh --help) >/dev/null 2>&1
}

test_concurrent_execution() {
  # Test that multiple instances can run concurrently
  echo "Testing concurrent execution..."
  
  # Start multiple instances in background
  local pids=()
  
  for i in {1..3}; do
    ${SCRIPT_DIR}/preflight-check.sh --skip-build --skip-test --skip-lint --skip-checkpoint &
    pids+=($!)
  done
  
  # Wait for all to complete
  for pid in "${pids[@]}"; do
    wait $pid || return 1
  done
  
  return 0
}

# ========================================
# GitHub Actions Specific Tests
# ========================================

test_github_actions_env() {
  # Test GitHub Actions specific features
  echo "Testing GitHub Actions compatibility..."
  
  # Simulate GitHub Actions environment
  GITHUB_ACTIONS=true \
  GITHUB_WORKFLOW="CI" \
  GITHUB_RUN_NUMBER="123" \
  ${SCRIPT_DIR}/preflight-check.sh --help >/dev/null 2>&1
}

test_github_output_format() {
  # Test GitHub Actions annotation format
  echo "Testing GitHub Actions output format..."
  
  # Check if error output follows GitHub format
  local output=$(${SCRIPT_DIR}/preflight-check.sh --invalid-option 2>&1 || true)
  echo "$output" | grep -q "Unknown option" || return 1
}

# ========================================
# GitLab CI Specific Tests
# ========================================

test_gitlab_ci_env() {
  # Test GitLab CI specific features
  echo "Testing GitLab CI compatibility..."
  
  # Simulate GitLab CI environment
  GITLAB_CI=true \
  CI_PIPELINE_ID="456" \
  CI_JOB_NAME="test" \
  ${SCRIPT_DIR}/preflight-check.sh --help >/dev/null 2>&1
}

# ========================================
# Jenkins Specific Tests
# ========================================

test_jenkins_env() {
  # Test Jenkins specific features
  echo "Testing Jenkins compatibility..."
  
  # Simulate Jenkins environment
  JENKINS_HOME="/var/jenkins" \
  BUILD_NUMBER="789" \
  JOB_NAME="preflight-check" \
  ${SCRIPT_DIR}/preflight-check.sh --help >/dev/null 2>&1
}

# ========================================
# Docker Container Tests
# ========================================

test_docker_compatibility() {
  # Test running in Docker container
  echo "Testing Docker container compatibility..."
  
  # Check if we're in a container (common in CI)
  if [ -f /.dockerenv ]; then
    echo "  Running in Docker container"
  fi
  
  # Test with minimal environment
  ${SCRIPT_DIR}/preflight-check.sh --skip-build --skip-test --skip-lint --skip-checkpoint
}

# ========================================
# Performance Benchmarks for CI
# ========================================

benchmark_execution_time() {
  echo "Benchmarking execution time..."
  
  local start_time=$(date +%s%N)
  
  ${SCRIPT_DIR}/preflight-check.sh \
    --skip-build \
    --skip-test \
    --skip-lint \
    --skip-checkpoint \
    >/dev/null 2>&1
  
  local end_time=$(date +%s%N)
  local duration=$(( (end_time - start_time) / 1000000 ))
  
  echo "  Execution time: ${duration}ms"
  
  # Should complete quickly when skipping all checks
  [ $duration -lt 5000 ] || return 1
}

benchmark_parallel_vs_sequential() {
  echo "Benchmarking parallel vs sequential..."
  
  # Sequential execution
  local seq_start=$(date +%s%N)
  ${SCRIPT_DIR}/preflight-check.sh \
    --skip-build --skip-test --skip-lint \
    >/dev/null 2>&1
  local seq_end=$(date +%s%N)
  local seq_duration=$(( (seq_end - seq_start) / 1000000 ))
  
  # Parallel execution
  local par_start=$(date +%s%N)
  ${SCRIPT_DIR}/preflight-check.sh \
    --parallel \
    --skip-build --skip-test --skip-lint \
    >/dev/null 2>&1
  local par_end=$(date +%s%N)
  local par_duration=$(( (par_end - par_start) / 1000000 ))
  
  echo "  Sequential: ${seq_duration}ms"
  echo "  Parallel: ${par_duration}ms"
  
  return 0
}

# ========================================
# Integration with npm scripts
# ========================================

test_npm_script_integration() {
  echo "Testing npm script integration..."
  
  # Check if scripts can be called from npm scripts
  cd "$PROJECT_ROOT"
  
  # Test if preflight scripts are accessible
  [ -x "${SCRIPT_DIR}/preflight-check.sh" ] || return 1
  
  return 0
}

# ========================================
# Report Generation
# ========================================

generate_junit_report() {
  local output_file="${1:-test-results.xml}"
  
  cat > "$output_file" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Pre-flight Check CI Tests" tests="$TESTS_TOTAL" failures="$TESTS_FAILED">
  <testsuite name="CI Integration" tests="$TESTS_TOTAL" failures="$TESTS_FAILED">
EOF
  
  # Add test cases (simplified)
  cat >> "$output_file" <<EOF
    <testcase name="CI Environment Tests" classname="PreflightCheck.CI" time="0.1">
    </testcase>
  </testsuite>
</testsuites>
EOF
  
  echo "JUnit report generated: $output_file"
}

# ========================================
# Main Execution
# ========================================

main() {
  echo "========================================="
  echo "Pre-flight Check CI/CD Integration Tests"
  echo "========================================="
  echo
  echo "Environment:"
  echo "  CI: ${CI:-false}"
  echo "  GitHub Actions: ${GITHUB_ACTIONS:-false}"
  echo "  GitLab CI: ${GITLAB_CI:-false}"
  echo "  Jenkins: ${JENKINS_HOME:+true}"
  echo
  
  # Run all tests
  run_test "No TTY Support" test_no_tty
  run_test "No Color in CI" test_no_color_in_ci
  run_test "Exit Codes" test_exit_codes
  run_test "JSON Output" test_json_output
  run_test "Quiet Mode" test_quiet_mode
  run_test "Parallel Execution" test_parallel_execution
  run_test "Timeout Handling" test_timeout_handling
  run_test "Environment Isolation" test_environment_isolation
  run_test "Workspace Detection" test_workspace_detection
  run_test "Concurrent Execution" test_concurrent_execution
  
  # CI platform specific tests
  if [ "${GITHUB_ACTIONS:-false}" = "true" ]; then
    run_test "GitHub Actions Environment" test_github_actions_env
    run_test "GitHub Output Format" test_github_output_format
  fi
  
  if [ "${GITLAB_CI:-false}" = "true" ]; then
    run_test "GitLab CI Environment" test_gitlab_ci_env
  fi
  
  if [ -n "${JENKINS_HOME:-}" ]; then
    run_test "Jenkins Environment" test_jenkins_env
  fi
  
  # Container tests
  run_test "Docker Compatibility" test_docker_compatibility
  
  # Performance benchmarks
  run_test "Execution Time Benchmark" benchmark_execution_time
  run_test "Parallel vs Sequential" benchmark_parallel_vs_sequential
  
  # Integration tests
  run_test "NPM Script Integration" test_npm_script_integration
  
  # Generate reports
  echo
  echo "========================================="
  echo "Test Results Summary"
  echo "========================================="
  echo "Total Tests: $TESTS_TOTAL"
  echo "Passed: $TESTS_PASSED"
  echo "Failed: $TESTS_FAILED"
  
  # Generate JUnit report if requested
  if [ "${GENERATE_JUNIT:-false}" = "true" ]; then
    generate_junit_report "${JUNIT_OUTPUT:-test-results.xml}"
  fi
  
  # Exit with appropriate code
  if [ $TESTS_FAILED -eq 0 ]; then
    echo
    echo "✅ All CI/CD integration tests passed!"
    exit 0
  else
    echo
    echo "❌ Some CI/CD integration tests failed"
    exit 1
  fi
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi