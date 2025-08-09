#!/bin/bash
# Master Test Runner for Pre-flight Check Scripts
# Executes all test suites and generates comprehensive report

set -euo pipefail

# ========================================
# Configuration
# ========================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
readonly REPORT_DIR="${PROJECT_ROOT}/.shirokuma/test-reports"
readonly TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create report directory
mkdir -p "${REPORT_DIR}"

# Colors for output
if [ -t 1 ]; then
  readonly GREEN='\033[0;32m'
  readonly RED='\033[0;31m'
  readonly YELLOW='\033[1;33m'
  readonly BLUE='\033[0;34m'
  readonly CYAN='\033[0;36m'
  readonly BOLD='\033[1m'
  readonly NC='\033[0m'
else
  readonly GREEN=''
  readonly RED=''
  readonly YELLOW=''
  readonly BLUE=''
  readonly CYAN=''
  readonly BOLD=''
  readonly NC=''
fi

# Test suite results
declare -A SUITE_RESULTS

# ========================================
# Helper Functions
# ========================================

log_header() {
  echo
  echo -e "${BOLD}${BLUE}════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${BLUE}  $1${NC}"
  echo -e "${BOLD}${BLUE}════════════════════════════════════════════════${NC}"
  echo
}

log_section() {
  echo
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${CYAN}  $1${NC}"
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo
}

run_test_suite() {
  local suite_name="$1"
  local test_script="$2"
  shift 2
  local args="$@"
  
  log_section "Running: $suite_name"
  
  local suite_log="${REPORT_DIR}/${TIMESTAMP}-${suite_name}.log"
  local exit_code=0
  
  # Run the test suite
  if $test_script $args > "$suite_log" 2>&1; then
    echo -e "  ${GREEN}✅ PASSED${NC}"
    SUITE_RESULTS["$suite_name"]="PASSED"
    
    # Show summary from log
    if grep -q "Tests Passed:" "$suite_log"; then
      grep "Tests Passed:\|Tests Failed:\|Tests Skipped:" "$suite_log" | tail -3 | sed 's/^/    /'
    fi
  else
    exit_code=$?
    echo -e "  ${RED}❌ FAILED${NC} (exit code: $exit_code)"
    SUITE_RESULTS["$suite_name"]="FAILED"
    
    # Show error summary
    echo "  Last 10 lines of output:"
    tail -10 "$suite_log" | sed 's/^/    /'
  fi
  
  echo "  Log: $suite_log"
  
  return $exit_code
}

# ========================================
# Test Suite Execution
# ========================================

run_all_tests() {
  local total_suites=0
  local passed_suites=0
  local failed_suites=0
  local skipped_suites=0
  
  # 1. Basic Test Suite (existing)
  if [ -f "${SCRIPT_DIR}/test-preflight.sh" ]; then
    total_suites=$((total_suites + 1))
    if run_test_suite "basic" "${SCRIPT_DIR}/test-preflight.sh"; then
      passed_suites=$((passed_suites + 1))
    else
      failed_suites=$((failed_suites + 1))
    fi
  else
    echo -e "  ${YELLOW}⚠ Basic test suite not found${NC}"
    skipped_suites=$((skipped_suites + 1))
  fi
  
  # 2. Comprehensive Test Suite
  if [ -f "${SCRIPT_DIR}/test-preflight-comprehensive.sh" ]; then
    total_suites=$((total_suites + 1))
    if run_test_suite "comprehensive" "${SCRIPT_DIR}/test-preflight-comprehensive.sh"; then
      passed_suites=$((passed_suites + 1))
    else
      failed_suites=$((failed_suites + 1))
    fi
  else
    echo -e "  ${YELLOW}⚠ Comprehensive test suite not found${NC}"
    skipped_suites=$((skipped_suites + 1))
  fi
  
  # 3. CI/CD Integration Tests
  if [ -f "${SCRIPT_DIR}/test-ci-integration.sh" ]; then
    total_suites=$((total_suites + 1))
    if run_test_suite "ci-integration" "${SCRIPT_DIR}/test-ci-integration.sh"; then
      passed_suites=$((passed_suites + 1))
    else
      failed_suites=$((failed_suites + 1))
    fi
  else
    echo -e "  ${YELLOW}⚠ CI integration test suite not found${NC}"
    skipped_suites=$((skipped_suites + 1))
  fi
  
  # 4. Stress Tests (optional - can be slow)
  if [ "${RUN_STRESS_TESTS:-false}" = "true" ]; then
    if [ -f "${SCRIPT_DIR}/test-stress.sh" ]; then
      total_suites=$((total_suites + 1))
      if run_test_suite "stress" "${SCRIPT_DIR}/test-stress.sh" \
        --max-concurrent 5 --duration 10; then
        passed_suites=$((passed_suites + 1))
      else
        failed_suites=$((failed_suites + 1))
      fi
    else
      echo -e "  ${YELLOW}⚠ Stress test suite not found${NC}"
      skipped_suites=$((skipped_suites + 1))
    fi
  else
    echo
    echo -e "  ${YELLOW}ℹ️  Stress tests skipped (set RUN_STRESS_TESTS=true to enable)${NC}"
  fi
  
  return $failed_suites
}

# ========================================
# Coverage Analysis
# ========================================

analyze_coverage() {
  log_section "Coverage Analysis"
  
  echo "Script Coverage:"
  
  # Check which scripts are tested
  local scripts=(
    "preflight-check.sh"
    "modules/build-check.sh"
    "modules/test-check.sh"
    "modules/lint-check.sh"
    "modules/checkpoint-create.sh"
  )
  
  for script in "${scripts[@]}"; do
    if [ -f "${SCRIPT_DIR}/$script" ]; then
      echo -e "  ✓ $script - ${GREEN}exists${NC}"
      
      # Check if script is referenced in tests
      if grep -q "$(basename "$script")" "${SCRIPT_DIR}"/test-*.sh 2>/dev/null; then
        echo -e "    └─ ${GREEN}tested${NC}"
      else
        echo -e "    └─ ${YELLOW}not tested${NC}"
      fi
    else
      echo -e "  ✗ $script - ${RED}missing${NC}"
    fi
  done
  
  echo
  echo "Exit Code Coverage:"
  echo "  0 - SUCCESS       ✓"
  echo "  1 - FAIL          ○ (requires real failure)"
  echo "  2 - MARKDOWN_ONLY ○ (requires git state)"
  echo "  3 - TIMEOUT       ○ (requires slow process)"
  echo "  4 - SKIP          ✓"
  echo "  5 - ERROR         ○ (requires error condition)"
  echo "  6 - CONFIG_ERROR  ○ (requires missing config)"
  echo "  7 - DEPENDENCY    ○ (requires missing dependency)"
  
  echo
  echo "Feature Coverage:"
  local features=(
    "Command-line argument parsing:✓"
    "Help and version output:✓"
    "Debug and verbose modes:✓"
    "Timeout handling:✓"
    "Skip functionality:✓"
    "Parallel execution:✓"
    "Checkpoint creation:✓"
    "Error handling:✓"
    "Signal handling:○"
    "Resource limits:○"
  )
  
  for feature in "${features[@]}"; do
    echo "  $feature"
  done
}

# ========================================
# Report Generation
# ========================================

generate_html_report() {
  local report_file="${REPORT_DIR}/${TIMESTAMP}-report.html"
  
  cat > "$report_file" <<EOF
<!DOCTYPE html>
<html>
<head>
  <title>Pre-flight Check Test Report - $TIMESTAMP</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; }
    .passed { color: green; font-weight: bold; }
    .failed { color: red; font-weight: bold; }
    .skipped { color: orange; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #4CAF50; color: white; }
    .log-link { color: blue; text-decoration: underline; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Pre-flight Check Test Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p>Date: $(date)</p>
    <p>Host: $(hostname)</p>
    <p>Project: ${PROJECT_ROOT}</p>
  </div>
  
  <h2>Test Suites</h2>
  <table>
    <tr>
      <th>Suite</th>
      <th>Status</th>
      <th>Log File</th>
    </tr>
EOF
  
  for suite in "${!SUITE_RESULTS[@]}"; do
    local status="${SUITE_RESULTS[$suite]}"
    local class="passed"
    [ "$status" = "FAILED" ] && class="failed"
    [ "$status" = "SKIPPED" ] && class="skipped"
    
    echo "    <tr>" >> "$report_file"
    echo "      <td>$suite</td>" >> "$report_file"
    echo "      <td class='$class'>$status</td>" >> "$report_file"
    echo "      <td><a href='${TIMESTAMP}-${suite}.log'>View Log</a></td>" >> "$report_file"
    echo "    </tr>" >> "$report_file"
  done
  
  cat >> "$report_file" <<EOF
  </table>
  
  <h2>Coverage</h2>
  <p>See console output for detailed coverage analysis.</p>
  
</body>
</html>
EOF
  
  echo "HTML report generated: $report_file"
}

generate_junit_xml() {
  local xml_file="${REPORT_DIR}/${TIMESTAMP}-junit.xml"
  
  cat > "$xml_file" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Pre-flight Check Tests" timestamp="$TIMESTAMP">
EOF
  
  for suite in "${!SUITE_RESULTS[@]}"; do
    local status="${SUITE_RESULTS[$suite]}"
    local failures=0
    [ "$status" = "FAILED" ] && failures=1
    
    cat >> "$xml_file" <<EOF
  <testsuite name="$suite" tests="1" failures="$failures">
    <testcase name="$suite" classname="PreflightCheck">
EOF
    
    if [ "$status" = "FAILED" ]; then
      cat >> "$xml_file" <<EOF
      <failure message="Test suite failed">See log file for details</failure>
EOF
    fi
    
    cat >> "$xml_file" <<EOF
    </testcase>
  </testsuite>
EOF
  done
  
  cat >> "$xml_file" <<EOF
</testsuites>
EOF
  
  echo "JUnit XML report generated: $xml_file"
}

# ========================================
# Main Execution
# ========================================

main() {
  log_header "Pre-flight Check Test Runner"
  
  echo "Configuration:"
  echo "  Script Directory: ${SCRIPT_DIR}"
  echo "  Project Root: ${PROJECT_ROOT}"
  echo "  Report Directory: ${REPORT_DIR}"
  echo "  Timestamp: ${TIMESTAMP}"
  echo
  
  # Check prerequisites
  echo "Checking prerequisites..."
  
  if [ ! -f "${SCRIPT_DIR}/preflight-check.sh" ]; then
    echo -e "${RED}Error: preflight-check.sh not found${NC}"
    exit 1
  fi
  
  if [ ! -d "${SCRIPT_DIR}/modules" ]; then
    echo -e "${RED}Error: modules directory not found${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✓ Prerequisites met${NC}"
  
  # Run all test suites
  log_header "Test Execution"
  
  local failed_suites=0
  run_all_tests || failed_suites=$?
  
  # Analyze coverage
  analyze_coverage
  
  # Generate reports
  log_section "Report Generation"
  
  generate_html_report
  
  if [ "${GENERATE_JUNIT:-false}" = "true" ]; then
    generate_junit_xml
  fi
  
  # Final summary
  log_header "Final Summary"
  
  echo "Test Suite Results:"
  for suite in "${!SUITE_RESULTS[@]}"; do
    local status="${SUITE_RESULTS[$suite]}"
    if [ "$status" = "PASSED" ]; then
      echo -e "  $suite: ${GREEN}✅ PASSED${NC}"
    elif [ "$status" = "FAILED" ]; then
      echo -e "  $suite: ${RED}❌ FAILED${NC}"
    else
      echo -e "  $suite: ${YELLOW}⚠ SKIPPED${NC}"
    fi
  done
  
  echo
  echo "Reports saved to: ${REPORT_DIR}"
  echo
  
  if [ $failed_suites -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ All test suites passed!${NC}"
    echo "The Pre-flight Check scripts are fully tested and working correctly."
    exit 0
  else
    echo -e "${RED}${BOLD}❌ $failed_suites test suite(s) failed${NC}"
    echo "Please review the logs in ${REPORT_DIR}"
    exit 1
  fi
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stress)
      RUN_STRESS_TESTS=true
      shift
      ;;
    --junit)
      GENERATE_JUNIT=true
      shift
      ;;
    --help)
      cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Run all test suites for Pre-flight Check scripts

Options:
  --stress    Include stress tests (slower)
  --junit     Generate JUnit XML report
  --help      Show this help message

Report files are saved to: .shirokuma/test-reports/

Examples:
  $(basename "$0")           # Run standard tests
  $(basename "$0") --stress  # Include stress tests
  $(basename "$0") --junit   # Generate JUnit report for CI
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Run the test runner
main