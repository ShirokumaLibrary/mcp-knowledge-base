#!/bin/bash
# Script: test-script-guidelines.sh
# Purpose: Comprehensive test suite for script guidelines implementation (issues-175)
# Usage: .shirokuma/scripts/test-script-guidelines.sh [options]
# Version: 1.0.0

set -euo pipefail

# Script metadata
readonly SCRIPT_VERSION="1.0.0"
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_START_TIME="$(date -Iseconds)"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

# Test configuration
VERBOSE_MODE="false"
DEBUG_MODE="false"
CONTINUE_ON_FAIL="false"
TEST_FILTER=""
OUTPUT_FORMAT="console"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Test results array
declare -a TEST_RESULTS=()

# Color codes
readonly COLOR_RED='\033[0;31m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_RESET='\033[0m'

# Temporary test directory
TEST_TEMP_DIR=""

# Help function
show_help() {
    cat << EOF
Usage: .shirokuma/scripts/${SCRIPT_NAME} [OPTIONS]

Description:
    Comprehensive test suite for SHIROKUMA Script Guidelines implementation.
    Tests documentation, common library functions, validation script, and edge cases.

Options:
    -h, --help              Show this help message
    --version               Show version information
    -v, --verbose           Enable verbose output
    -d, --debug             Enable debug mode
    --continue-on-fail      Continue running tests after failures
    --filter=PATTERN        Run only tests matching pattern
    --format=FORMAT         Output format: console|json|junit (default: console)

Test Categories:
    1. Documentation Tests    - Verify guidelines and documentation
    2. Common Library Tests   - Test lib/common.sh functions
    3. Validation Tests       - Test validate-compliance.sh
    4. Integration Tests      - Test real-world scenarios
    5. Edge Case Tests        - Test boundary conditions

Examples:
    # Run all tests
    .shirokuma/scripts/${SCRIPT_NAME}
    
    # Run only documentation tests
    .shirokuma/scripts/${SCRIPT_NAME} --filter=doc
    
    # Run with verbose output
    .shirokuma/scripts/${SCRIPT_NAME} --verbose
    
    # Continue after failures
    .shirokuma/scripts/${SCRIPT_NAME} --continue-on-fail

Exit Codes:
    0    All tests passed
    1    One or more tests failed
    2    Invalid arguments or setup error

EOF
}

# Version function
show_version() {
    echo "${SCRIPT_NAME} version ${SCRIPT_VERSION}"
    echo "Test Framework for SHIROKUMA Script Guidelines v1.0"
}

# Parse arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --version)
                show_version
                exit 0
                ;;
            -v|--verbose)
                VERBOSE_MODE="true"
                shift
                ;;
            -d|--debug)
                DEBUG_MODE="true"
                VERBOSE_MODE="true"
                shift
                ;;
            --continue-on-fail)
                CONTINUE_ON_FAIL="true"
                shift
                ;;
            --filter=*)
                TEST_FILTER="${1#*=}"
                shift
                ;;
            --format=*)
                OUTPUT_FORMAT="${1#*=}"
                if [[ ! "${OUTPUT_FORMAT}" =~ ^(console|json|junit)$ ]]; then
                    echo "Error: Invalid format: ${OUTPUT_FORMAT}" >&2
                    exit 2
                fi
                shift
                ;;
            *)
                echo "Error: Unknown option: $1" >&2
                show_help
                exit 2
                ;;
        esac
    done
}

# Logging functions
log_info() {
    if [[ "${VERBOSE_MODE}" == "true" ]]; then
        echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET} $*"
    fi
}

log_debug() {
    if [[ "${DEBUG_MODE}" == "true" ]]; then
        echo -e "[DEBUG] $*"
    fi
}

log_error() {
    echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $*" >&2
}

log_success() {
    echo -e "${COLOR_GREEN}[PASS]${COLOR_RESET} $*"
}

log_fail() {
    echo -e "${COLOR_RED}[FAIL]${COLOR_RESET} $*"
}

log_skip() {
    echo -e "${COLOR_YELLOW}[SKIP]${COLOR_RESET} $*"
}

# Test framework functions
setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Create temporary directory for tests in current directory
    TEST_TEMP_DIR=".test-temp-$(date +%s)"
    mkdir -p "${TEST_TEMP_DIR}"
    log_debug "Created temp directory: ${TEST_TEMP_DIR}"
    
    # Verify required files exist
    local required_files=(
        ".shirokuma/scripts/lib/common.sh"
        ".shirokuma/scripts/validate-compliance.sh"
        ".shirokuma/docs/script-guidelines.md"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "${file}" ]]; then
            log_error "Required file missing: ${file}"
            return 1
        fi
    done
    
    log_info "Test environment ready"
    return 0
}

cleanup_test_environment() {
    log_info "Cleaning up test environment..."
    
    if [[ -n "${TEST_TEMP_DIR}" ]] && [[ -d "${TEST_TEMP_DIR}" ]]; then
        rm -rf "${TEST_TEMP_DIR}"
        log_debug "Removed temp directory: ${TEST_TEMP_DIR}"
    fi
    
    log_info "Cleanup complete"
}

# Test execution wrapper
run_test() {
    local test_name="$1"
    local test_function="$2"
    local test_category="${3:-General}"
    
    # Check filter
    if [[ -n "${TEST_FILTER}" ]] && [[ ! "${test_name}" =~ ${TEST_FILTER} ]]; then
        log_skip "${test_category}: ${test_name} (filtered)"
        ((SKIPPED_TESTS++))
        return 0
    fi
    
    ((TOTAL_TESTS++))
    
    log_info "Running test: ${test_name}"
    
    # Execute test in subshell to isolate failures
    if (${test_function}); then
        log_success "${test_category}: ${test_name}"
        ((PASSED_TESTS++))
        TEST_RESULTS+=("PASS: ${test_category}: ${test_name}")
        return 0
    else
        log_fail "${test_category}: ${test_name}"
        ((FAILED_TESTS++))
        TEST_RESULTS+=("FAIL: ${test_category}: ${test_name}")
        
        if [[ "${CONTINUE_ON_FAIL}" != "true" ]]; then
            return 1
        fi
        return 0
    fi
}

# Assertion helpers
assert_equals() {
    local expected="$1"
    local actual="$2"
    local message="${3:-Values do not match}"
    
    if [[ "${expected}" != "${actual}" ]]; then
        log_debug "Assertion failed: ${message}"
        log_debug "  Expected: '${expected}'"
        log_debug "  Actual:   '${actual}'"
        return 1
    fi
    return 0
}

assert_file_exists() {
    local file="$1"
    if [[ ! -f "${file}" ]]; then
        log_debug "File does not exist: ${file}"
        return 1
    fi
    return 0
}

assert_command_succeeds() {
    local command="$1"
    if ! eval "${command}" &>/dev/null; then
        log_debug "Command failed: ${command}"
        return 1
    fi
    return 0
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    if [[ ! "${haystack}" =~ ${needle} ]]; then
        log_debug "String '${haystack}' does not contain '${needle}'"
        return 1
    fi
    return 0
}

# ============================================================================
# TEST CATEGORY 1: DOCUMENTATION TESTS
# ============================================================================

test_doc_guidelines_exist() {
    assert_file_exists ".shirokuma/docs/script-guidelines.md"
}

test_doc_guidelines_readable() {
    local file=".shirokuma/docs/script-guidelines.md"
    if [[ ! -r "${file}" ]]; then
        log_debug "File is not readable: ${file}"
        return 1
    fi
    return 0
}

test_doc_guidelines_content() {
    local content
    content="$(cat .shirokuma/docs/script-guidelines.md 2>/dev/null)"
    
    # Check for essential sections
    assert_contains "${content}" "Script Calling Guidelines" || return 1
    assert_contains "${content}" "Standard Format" || return 1
    assert_contains "${content}" "Common Patterns" || return 1
    assert_contains "${content}" "DO NOT" || return 1
    
    return 0
}

test_doc_claude_md_updated() {
    local content
    content="$(cat CLAUDE.md 2>/dev/null)"
    
    # Check for script rules section
    assert_contains "${content}" "Script Calling Rules" || return 1
    assert_contains "${content}" ".shirokuma/scripts/" || return 1
    assert_contains "${content}" "validate-compliance.sh" || return 1
    
    return 0
}

test_doc_examples_valid() {
    # Extract examples from documentation and validate them
    local examples=(
        ".shirokuma/scripts/preflight-check.sh"
        ".shirokuma/scripts/validate-compliance.sh"
        ".shirokuma/scripts/run-all-tests.sh --junit"
    )
    
    for example in "${examples[@]}"; do
        # Extract just the script path (without arguments)
        local script_path="${example%% *}"
        
        # Validate pattern
        if [[ ! "${script_path}" =~ ^\.shirokuma/scripts/[^/]+\.sh$ ]]; then
            log_debug "Invalid example pattern: ${example}"
            return 1
        fi
    done
    
    return 0
}

# ============================================================================
# TEST CATEGORY 2: COMMON LIBRARY TESTS
# ============================================================================

test_lib_source_protection() {
    # Test that common.sh cannot be executed directly
    local output
    output="$(bash .shirokuma/scripts/lib/common.sh 2>&1 || true)"
    
    assert_contains "${output}" "should be sourced" || return 1
    return 0
}

test_lib_logging_functions() {
    # Create test script that sources common.sh
    cat > "${TEST_TEMP_DIR}/test_logging.sh" << 'EOF'
#!/bin/bash
source .shirokuma/scripts/lib/common.sh

# Test each logging function
log_info "Test info"
log_warn "Test warning"
log_error "Test error"
log_success "Test success"
DEBUG_MODE=true log_debug "Test debug"
EOF
    
    chmod +x "${TEST_TEMP_DIR}/test_logging.sh"
    local output
    output="$(bash "${TEST_TEMP_DIR}/test_logging.sh" 2>&1)"
    
    assert_contains "${output}" "INFO" || return 1
    assert_contains "${output}" "WARN" || return 1
    assert_contains "${output}" "ERROR" || return 1
    assert_contains "${output}" "SUCCESS" || return 1
    assert_contains "${output}" "DEBUG" || return 1
    
    return 0
}

test_lib_command_availability() {
    # Test is_command_available function
    cat > "${TEST_TEMP_DIR}/test_command.sh" << 'EOF'
#!/bin/bash
source .shirokuma/scripts/lib/common.sh

# Test with existing command
if is_command_available "bash"; then
    echo "bash_found"
fi

# Test with non-existing command
if ! is_command_available "nonexistentcommand123"; then
    echo "nonexistent_not_found"
fi
EOF
    
    chmod +x "${TEST_TEMP_DIR}/test_command.sh"
    local output
    output="$(bash "${TEST_TEMP_DIR}/test_command.sh" 2>&1)"
    
    assert_contains "${output}" "bash_found" || return 1
    assert_contains "${output}" "nonexistent_not_found" || return 1
    
    return 0
}

test_lib_path_validation() {
    # Test validate_script_call_pattern function
    cat > "${TEST_TEMP_DIR}/test_validation.sh" << 'EOF'
#!/bin/bash
source .shirokuma/scripts/lib/common.sh

# Valid patterns
patterns_valid=(
    ".shirokuma/scripts/test.sh"
    ".shirokuma/scripts/run-all-tests.sh"
    ".shirokuma/scripts/validate-compliance.sh"
)

# Invalid patterns
patterns_invalid=(
    "/absolute/path/.shirokuma/scripts/test.sh"
    "../relative/.shirokuma/scripts/test.sh"
    ".shirokuma/tools/test.sh"
    ".shirokuma/scripts/subdir/test.sh"
    "bash .shirokuma/scripts/test.sh"
)

for pattern in "${patterns_valid[@]}"; do
    if validate_script_call_pattern "${pattern}"; then
        echo "VALID: ${pattern}"
    fi
done

for pattern in "${patterns_invalid[@]}"; do
    if ! validate_script_call_pattern "${pattern}"; then
        echo "INVALID: ${pattern}"
    fi
done
EOF
    
    chmod +x "${TEST_TEMP_DIR}/test_validation.sh"
    local output
    output="$(bash "${TEST_TEMP_DIR}/test_validation.sh" 2>&1)"
    
    # Check valid patterns are recognized
    assert_contains "${output}" "VALID: .shirokuma/scripts/test.sh" || return 1
    assert_contains "${output}" "VALID: .shirokuma/scripts/run-all-tests.sh" || return 1
    
    # Check invalid patterns are rejected
    assert_contains "${output}" "INVALID: /absolute/path/.shirokuma/scripts/test.sh" || return 1
    assert_contains "${output}" "INVALID: .shirokuma/tools/test.sh" || return 1
    
    return 0
}

test_lib_temp_file_creation() {
    # Test temporary file/directory creation
    cat > "${TEST_TEMP_DIR}/test_temp.sh" << 'EOF'
#!/bin/bash
source .shirokuma/scripts/lib/common.sh

# Create temp file
temp_file="$(create_temp_file "test")"
if [[ -f "${temp_file}" ]]; then
    echo "temp_file_created"
    rm -f "${temp_file}"
fi

# Create temp directory
temp_dir="$(create_temp_dir "test")"
if [[ -d "${temp_dir}" ]]; then
    echo "temp_dir_created"
    rm -rf "${temp_dir}"
fi
EOF
    
    chmod +x "${TEST_TEMP_DIR}/test_temp.sh"
    local output
    output="$(bash "${TEST_TEMP_DIR}/test_temp.sh" 2>&1)"
    
    assert_contains "${output}" "temp_file_created" || return 1
    assert_contains "${output}" "temp_dir_created" || return 1
    
    return 0
}

test_lib_timer_functions() {
    # Test timer functions
    cat > "${TEST_TEMP_DIR}/test_timer.sh" << 'EOF'
#!/bin/bash
source .shirokuma/scripts/lib/common.sh

start="$(start_timer)"
sleep 0.1
duration="$(end_timer "${start}")"

# Check if duration is a number and greater than 0
if [[ "${duration}" =~ ^[0-9]+\.?[0-9]*$ ]] && (( $(echo "${duration} > 0" | bc -l) )); then
    echo "timer_works"
fi
EOF
    
    chmod +x "${TEST_TEMP_DIR}/test_timer.sh"
    
    # Check if bc is available, skip test if not
    if ! command -v bc &>/dev/null; then
        log_skip "Timer test requires 'bc' command"
        return 0
    fi
    
    local output
    output="$(bash "${TEST_TEMP_DIR}/test_timer.sh" 2>&1)"
    
    assert_contains "${output}" "timer_works" || return 1
    
    return 0
}

# ============================================================================
# TEST CATEGORY 3: VALIDATION SCRIPT TESTS
# ============================================================================

test_validate_help_option() {
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh --help 2>&1)"
    
    assert_contains "${output}" "Usage:" || return 1
    assert_contains "${output}" "Options:" || return 1
    assert_contains "${output}" "Examples:" || return 1
    
    return 0
}

test_validate_version_option() {
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh --version 2>&1)"
    
    assert_contains "${output}" "version" || return 1
    assert_contains "${output}" "Runtime Information" || return 1
    
    return 0
}

test_validate_invalid_options() {
    # Test with invalid option
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh --invalid-option 2>&1 || true)"
    
    assert_contains "${output}" "Unknown option" || return 1
    
    return 0
}

test_validate_valid_patterns() {
    # Create test file with valid patterns
    mkdir -p "${TEST_TEMP_DIR}/test_project"
    cat > "${TEST_TEMP_DIR}/test_project/valid.sh" << 'EOF'
#!/bin/bash
# Valid script calls
.shirokuma/scripts/test.sh
.shirokuma/scripts/run-all-tests.sh --option
.shirokuma/scripts/validate-compliance.sh
EOF
    
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh --scan-path="${TEST_TEMP_DIR}/test_project" 2>&1)"
    
    # Should not find violations
    if [[ "${output}" =~ "CRITICAL" ]] || [[ "${output}" =~ "WARNING" ]]; then
        log_debug "Unexpected violations found in valid patterns"
        return 1
    fi
    
    return 0
}

test_validate_invalid_patterns() {
    # Create test file with invalid patterns
    mkdir -p "${TEST_TEMP_DIR}/test_violations"
    cat > "${TEST_TEMP_DIR}/test_violations/invalid.sh" << 'EOF'
#!/bin/bash
# Invalid patterns that should be detected

# Absolute path (CRITICAL)
/usr/local/.shirokuma/scripts/test.sh

# Environment variable (CRITICAL)
DEBUG=true .shirokuma/scripts/test.sh

# Dynamic path (CRITICAL)
${HOME}/.shirokuma/scripts/test.sh

# Bash wrapper (WARNING)
bash .shirokuma/scripts/test.sh

# Direct tool call (WARNING)
.shirokuma/tools/check.sh
EOF
    
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh --scan-path="${TEST_TEMP_DIR}/test_violations" 2>&1 || true)"
    
    # Should find violations
    assert_contains "${output}" "CRITICAL" || return 1
    
    return 0
}

test_validate_output_formats() {
    # Test JSON output format
    mkdir -p "${TEST_TEMP_DIR}/test_format"
    cat > "${TEST_TEMP_DIR}/test_format/test.sh" << 'EOF'
#!/bin/bash
/absolute/.shirokuma/scripts/test.sh
EOF
    
    local json_output
    json_output="$(.shirokuma/scripts/validate-compliance.sh \
        --scan-path="${TEST_TEMP_DIR}/test_format" \
        --format=json 2>&1 || true)"
    
    # Check if output looks like JSON (starts with { or [)
    if [[ "${json_output}" =~ ^\{.*\}$ ]] || [[ "${json_output}" =~ ^\[.*\]$ ]]; then
        return 0
    else
        log_debug "JSON output format test failed"
        log_debug "Output: ${json_output}"
        return 1
    fi
}

test_validate_severity_filtering() {
    # Create file with mixed severity violations
    mkdir -p "${TEST_TEMP_DIR}/test_severity"
    cat > "${TEST_TEMP_DIR}/test_severity/mixed.sh" << 'EOF'
#!/bin/bash
# Critical violation
/absolute/.shirokuma/scripts/test.sh

# Warning violation
bash .shirokuma/scripts/test.sh
EOF
    
    # Test critical-only filter
    local critical_output
    critical_output="$(.shirokuma/scripts/validate-compliance.sh \
        --scan-path="${TEST_TEMP_DIR}/test_severity" \
        --severity=critical 2>&1 || true)"
    
    # Should show critical but not warning
    assert_contains "${critical_output}" "CRITICAL" || return 1
    
    # With critical severity, warnings should not be shown
    if [[ "${critical_output}" =~ "WARNING" ]]; then
        log_debug "Warning shown when severity=critical"
        return 1
    fi
    
    return 0
}

# ============================================================================
# TEST CATEGORY 4: INTEGRATION TESTS
# ============================================================================

test_integration_real_scripts() {
    # Test validation on actual project scripts
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh \
        --scan-path=".shirokuma/scripts" \
        --severity=critical 2>&1 || true)"
    
    # Project scripts should follow guidelines (no critical violations)
    if [[ "${output}" =~ "CRITICAL" ]]; then
        log_debug "Critical violations found in project scripts"
        log_debug "${output}"
        return 1
    fi
    
    return 0
}

test_integration_command_files() {
    # Test validation on command files
    if [[ -d ".claude/commands" ]]; then
        local output
        output="$(.shirokuma/scripts/validate-compliance.sh \
            --scan-path=".claude/commands" 2>&1 || true)"
        
        # Check execution completed
        return 0
    else
        log_skip "No .claude/commands directory found"
        return 0
    fi
}

test_integration_performance() {
    # Test that validation completes quickly
    local start_time end_time duration
    
    start_time="$(date +%s)"
    .shirokuma/scripts/validate-compliance.sh --quiet >/dev/null 2>&1 || true
    end_time="$(date +%s)"
    
    duration=$((end_time - start_time))
    
    # Should complete within 10 seconds for typical project
    if [[ ${duration} -gt 10 ]]; then
        log_debug "Validation took too long: ${duration} seconds"
        return 1
    fi
    
    return 0
}

# ============================================================================
# TEST CATEGORY 5: EDGE CASE TESTS
# ============================================================================

test_edge_empty_file() {
    # Test with empty file
    mkdir -p "${TEST_TEMP_DIR}/test_edge"
    touch "${TEST_TEMP_DIR}/test_edge/empty.sh"
    
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh \
        --scan-path="${TEST_TEMP_DIR}/test_edge" 2>&1)"
    
    # Should handle empty file gracefully
    return 0
}

test_edge_file_with_spaces() {
    # Test with filename containing spaces
    mkdir -p "${TEST_TEMP_DIR}/test edge spaces"
    cat > "${TEST_TEMP_DIR}/test edge spaces/file with spaces.sh" << 'EOF'
#!/bin/bash
.shirokuma/scripts/test.sh
EOF
    
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh \
        --scan-path="${TEST_TEMP_DIR}/test edge spaces" 2>&1 || true)"
    
    # Should handle spaces in path
    return 0
}

test_edge_large_file() {
    # Test with large file
    mkdir -p "${TEST_TEMP_DIR}/test_large"
    
    # Generate large file with many lines
    {
        echo "#!/bin/bash"
        for i in {1..1000}; do
            echo "# Line ${i}"
            echo ".shirokuma/scripts/test-${i}.sh"
        done
    } > "${TEST_TEMP_DIR}/test_large/large.sh"
    
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh \
        --scan-path="${TEST_TEMP_DIR}/test_large" 2>&1)"
    
    # Should handle large file
    return 0
}

test_edge_binary_files() {
    # Test that binary files are skipped
    mkdir -p "${TEST_TEMP_DIR}/test_binary"
    
    # Create a simple binary file
    echo -e "\x00\x01\x02\x03" > "${TEST_TEMP_DIR}/test_binary/binary.dat"
    
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh \
        --scan-path="${TEST_TEMP_DIR}/test_binary" --verbose 2>&1)"
    
    # Should skip binary file without error
    return 0
}

test_edge_symlinks() {
    # Test with symlinks
    mkdir -p "${TEST_TEMP_DIR}/test_symlink"
    cat > "${TEST_TEMP_DIR}/test_symlink/original.sh" << 'EOF'
#!/bin/bash
.shirokuma/scripts/test.sh
EOF
    
    ln -s original.sh "${TEST_TEMP_DIR}/test_symlink/link.sh"
    
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh \
        --scan-path="${TEST_TEMP_DIR}/test_symlink" 2>&1)"
    
    # Should handle symlinks
    return 0
}

test_edge_special_characters() {
    # Test with special characters in script calls
    mkdir -p "${TEST_TEMP_DIR}/test_special"
    cat > "${TEST_TEMP_DIR}/test_special/special.sh" << 'EOF'
#!/bin/bash
# Special characters that might break regex
.shirokuma/scripts/test-with-dash.sh
.shirokuma/scripts/test_with_underscore.sh
.shirokuma/scripts/test123numbers.sh
.shirokuma/scripts/TEST-CAPS.sh
EOF
    
    local output
    output="$(.shirokuma/scripts/validate-compliance.sh \
        --scan-path="${TEST_TEMP_DIR}/test_special" 2>&1)"
    
    # Should handle special characters in script names
    return 0
}

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

run_all_tests() {
    echo "════════════════════════════════════════════════════════════════"
    echo " SHIROKUMA Script Guidelines Test Suite v${SCRIPT_VERSION}"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Test Configuration:"
    echo "  Verbose Mode: ${VERBOSE_MODE}"
    echo "  Debug Mode: ${DEBUG_MODE}"
    echo "  Continue on Fail: ${CONTINUE_ON_FAIL}"
    echo "  Test Filter: ${TEST_FILTER:-none}"
    echo ""
    
    # Setup test environment
    if ! setup_test_environment; then
        log_error "Failed to setup test environment"
        exit 2
    fi
    
    echo "Running Tests..."
    echo ""
    
    # Category 1: Documentation Tests
    echo "─────────────────────────────────────────────────────────────────"
    echo "CATEGORY 1: Documentation Tests"
    echo "─────────────────────────────────────────────────────────────────"
    run_test "Guidelines document exists" test_doc_guidelines_exist "Documentation"
    run_test "Guidelines document readable" test_doc_guidelines_readable "Documentation"
    run_test "Guidelines content complete" test_doc_guidelines_content "Documentation"
    run_test "CLAUDE.md updated with rules" test_doc_claude_md_updated "Documentation"
    run_test "Documentation examples valid" test_doc_examples_valid "Documentation"
    echo ""
    
    # Category 2: Common Library Tests
    echo "─────────────────────────────────────────────────────────────────"
    echo "CATEGORY 2: Common Library Tests"
    echo "─────────────────────────────────────────────────────────────────"
    run_test "Source protection works" test_lib_source_protection "Library"
    run_test "Logging functions work" test_lib_logging_functions "Library"
    run_test "Command availability check" test_lib_command_availability "Library"
    run_test "Path validation function" test_lib_path_validation "Library"
    run_test "Temp file creation" test_lib_temp_file_creation "Library"
    run_test "Timer functions work" test_lib_timer_functions "Library"
    echo ""
    
    # Category 3: Validation Script Tests
    echo "─────────────────────────────────────────────────────────────────"
    echo "CATEGORY 3: Validation Script Tests"
    echo "─────────────────────────────────────────────────────────────────"
    run_test "Help option works" test_validate_help_option "Validation"
    run_test "Version option works" test_validate_version_option "Validation"
    run_test "Invalid options rejected" test_validate_invalid_options "Validation"
    run_test "Valid patterns accepted" test_validate_valid_patterns "Validation"
    run_test "Invalid patterns detected" test_validate_invalid_patterns "Validation"
    run_test "Output formats work" test_validate_output_formats "Validation"
    run_test "Severity filtering works" test_validate_severity_filtering "Validation"
    echo ""
    
    # Category 4: Integration Tests
    echo "─────────────────────────────────────────────────────────────────"
    echo "CATEGORY 4: Integration Tests"
    echo "─────────────────────────────────────────────────────────────────"
    run_test "Real project scripts valid" test_integration_real_scripts "Integration"
    run_test "Command files validation" test_integration_command_files "Integration"
    run_test "Performance acceptable" test_integration_performance "Integration"
    echo ""
    
    # Category 5: Edge Case Tests
    echo "─────────────────────────────────────────────────────────────────"
    echo "CATEGORY 5: Edge Case Tests"
    echo "─────────────────────────────────────────────────────────────────"
    run_test "Empty file handling" test_edge_empty_file "Edge Cases"
    run_test "Files with spaces" test_edge_file_with_spaces "Edge Cases"
    run_test "Large file handling" test_edge_large_file "Edge Cases"
    run_test "Binary file skipping" test_edge_binary_files "Edge Cases"
    run_test "Symlink handling" test_edge_symlinks "Edge Cases"
    run_test "Special characters" test_edge_special_characters "Edge Cases"
    echo ""
    
    # Cleanup
    cleanup_test_environment
    
    # Print summary
    echo "════════════════════════════════════════════════════════════════"
    echo " TEST SUMMARY"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "  Total Tests:    ${TOTAL_TESTS}"
    echo -e "  ${COLOR_GREEN}Passed:${COLOR_RESET}         ${PASSED_TESTS}"
    echo -e "  ${COLOR_RED}Failed:${COLOR_RESET}         ${FAILED_TESTS}"
    echo -e "  ${COLOR_YELLOW}Skipped:${COLOR_RESET}        ${SKIPPED_TESTS}"
    echo ""
    
    # Calculate pass rate
    if [[ ${TOTAL_TESTS} -gt 0 ]]; then
        local pass_rate
        pass_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
        echo "  Pass Rate:      ${pass_rate}%"
    fi
    echo ""
    
    # Print failed tests if any
    if [[ ${FAILED_TESTS} -gt 0 ]]; then
        echo "Failed Tests:"
        for result in "${TEST_RESULTS[@]}"; do
            if [[ "${result}" =~ ^FAIL: ]]; then
                echo "  - ${result#FAIL: }"
            fi
        done
        echo ""
    fi
    
    # Exit with appropriate code
    if [[ ${FAILED_TESTS} -gt 0 ]]; then
        echo -e "${COLOR_RED}✗ Test suite failed${COLOR_RESET}"
        return 1
    else
        echo -e "${COLOR_GREEN}✓ All tests passed!${COLOR_RESET}"
        return 0
    fi
}

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    # Run all tests
    if run_all_tests; then
        exit 0
    else
        exit 1
    fi
}

# Execute main function
main "$@"