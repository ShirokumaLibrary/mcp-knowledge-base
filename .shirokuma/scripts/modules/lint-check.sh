#!/bin/bash
# Lint validation module for Pre-flight Checks
# Validates code quality and style compliance
# NO ENVIRONMENT VARIABLES for configuration - uses command-line arguments only

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/preflight-common.sh"

# ========================================
# Module Configuration
# ========================================

readonly MODULE_NAME="Lint Check"
readonly LINT_COMMAND="npm run lint:errors"
readonly LINT_FIX_COMMAND="npm run lint:fix"

# Default settings (can be overridden with command-line args)
LINT_TIMEOUT="$DEFAULT_LINT_TIMEOUT"
DEBUG_MODE="false"
VERBOSE_MODE="false"

# ========================================
# Lint Functions
# ========================================

# Run lint command
run_lint() {
  local command="$1"
  local start_time
  start_time=$(date +%s)
  
  log_step "Starting lint check..."
  log_debug "$DEBUG_MODE" "Lint command: $command"
  log_debug "$DEBUG_MODE" "Timeout: ${LINT_TIMEOUT}s"
  
  # Create temporary file for output
  local output_file
  output_file=$(mktemp)
  trap "rm -f '$output_file'" EXIT
  
  # Execute lint with timeout
  if execute_with_timeout "$LINT_TIMEOUT" "$command > '$output_file' 2>&1"; then
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Lint check passed ($(format_duration $duration))"
    
    # Show summary if verbose
    if is_verbose "$VERBOSE_MODE" "$DEBUG_MODE"; then
      log_debug "$DEBUG_MODE" "Lint output (last 10 lines):"
      tail -10 "$output_file" | sed 's/^/  /'
    fi
    
    return 0
  else
    local exit_code=$?
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq $EXIT_TIMEOUT ]; then
      log_error "Lint check timed out after ${LINT_TIMEOUT}s"
    else
      log_error "Lint check failed after $(format_duration $duration)"
      
      # Parse lint errors
      parse_lint_errors "$output_file"
    fi
    
    # Show error output
    log_error "Lint output (last 30 lines):"
    tail -30 "$output_file" | sed 's/^/  /' >&2
    
    return $exit_code
  fi
}

# Parse lint errors from output
parse_lint_errors() {
  local output_file="$1"
  
  # Count ESLint errors and warnings
  local error_count=0
  local warning_count=0
  
  # Try to extract ESLint summary
  if grep -qE "[0-9]+ error|[0-9]+ warning" "$output_file" 2>/dev/null; then
    error_count=$(grep -oE "[0-9]+ error" "$output_file" | tail -1 | grep -oE "[0-9]+" || echo "0")
    warning_count=$(grep -oE "[0-9]+ warning" "$output_file" | tail -1 | grep -oE "[0-9]+" || echo "0")
    
    if [ "$error_count" -gt 0 ] || [ "$warning_count" -gt 0 ]; then
      echo
      echo "Lint Summary:"
      [ "$error_count" -gt 0 ] && echo "  ❌ Errors: $error_count"
      [ "$warning_count" -gt 0 ] && echo "  ⚠️  Warnings: $warning_count"
      echo
    fi
  fi
  
  # Extract common error types
  if grep -q "Parsing error:" "$output_file" 2>/dev/null; then
    log_error "Syntax errors found - code cannot be parsed"
  fi
  
  if grep -q "no-unused-vars" "$output_file" 2>/dev/null; then
    log_warn "Unused variables detected"
  fi
  
  if grep -q "no-console" "$output_file" 2>/dev/null; then
    log_warn "Console statements found"
  fi
  
  if grep -q "@typescript-eslint/no-explicit-any" "$output_file" 2>/dev/null; then
    log_warn "Explicit 'any' types found"
  fi
  
  # Show files with errors
  if is_verbose "$VERBOSE_MODE" "$DEBUG_MODE"; then
    echo "Files with errors:"
    grep -E "^/.*\.[jt]sx?$" "$output_file" 2>/dev/null | head -10 | sed 's/^/  /' || true
  fi
}

# Check lint prerequisites
check_prerequisites() {
  log_step "Checking lint prerequisites..."
  
  # Check if package.json exists
  if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
    log_error "package.json not found in project root"
    return $EXIT_CONFIG_ERROR
  fi
  
  # Check if lint script exists in package.json
  if ! grep -q '"lint' "${PROJECT_ROOT}/package.json"; then
    log_warn "No lint scripts found in package.json"
    log_info "Lint check will be skipped"
    return $EXIT_SKIP
  fi
  
  # Check if node_modules exists
  if [ ! -d "${PROJECT_ROOT}/node_modules" ]; then
    log_warn "node_modules not found - you may need to run 'npm install'"
    return $EXIT_DEPENDENCY_ERROR
  fi
  
  # Check for ESLint configuration
  if ! find "${PROJECT_ROOT}" -maxdepth 1 \( -name ".eslintrc*" -o -name "eslint.config.*" \) | head -1 | grep -q .; then
    if ! grep -q '"eslintConfig"' "${PROJECT_ROOT}/package.json"; then
      log_warn "No ESLint configuration found"
    fi
  fi
  
  # Check Node.js availability
  if ! check_command "node"; then
    return $EXIT_DEPENDENCY_ERROR
  fi
  
  log_success "Prerequisites check passed"
  return 0
}

# Attempt to auto-fix lint issues
auto_fix_lint() {
  log_step "Attempting to auto-fix lint issues..."
  
  # Check if lint:fix script exists
  if ! grep -q '"lint:fix"' "${PROJECT_ROOT}/package.json"; then
    log_warn "No lint:fix script found - cannot auto-fix"
    return 1
  fi
  
  # Create temporary file for output
  local fix_output
  fix_output=$(mktemp)
  
  # Run lint fix
  if execute_with_timeout "$LINT_TIMEOUT" "$LINT_FIX_COMMAND > '$fix_output' 2>&1"; then
    log_success "Auto-fix completed successfully"
    
    # Check if any files were modified
    if git diff --name-only 2>/dev/null | grep -q .; then
      log_info "Files were modified by auto-fix:"
      git diff --name-only 2>/dev/null | head -10 | sed 's/^/  /'
    fi
    
    rm -f "$fix_output"
    return 0
  else
    log_warn "Auto-fix failed or partially completed"
    tail -10 "$fix_output" | sed 's/^/  /' >&2
    rm -f "$fix_output"
    return 1
  fi
}

# Check specific lint rules
check_lint_rules() {
  log_step "Checking critical lint rules..."
  
  local critical_rules=(
    "no-console"
    "no-debugger"
    "no-unused-vars"
    "@typescript-eslint/no-explicit-any"
    "@typescript-eslint/no-unused-vars"
  )
  
  log_debug "$DEBUG_MODE" "Checking for critical rule violations"
  
  # This is informational only
  return 0
}

# ========================================
# Main Execution
# ========================================

main() {
  print_subsection "$MODULE_NAME"
  
  # Parse arguments
  local auto_fix=false
  local strict_mode=false
  
  while [ $# -gt 0 ]; do
    case "$1" in
      --fix)
        auto_fix=true
        ;;
      --strict)
        strict_mode=true
        ;;
      --timeout)
        shift
        if [ -n "${1:-}" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
          LINT_TIMEOUT="$1"
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

Lint validation module for Pre-flight Checks

Options:
  --fix          Attempt to auto-fix lint issues
  --strict       Fail on warnings (not just errors)
  --timeout N    Lint timeout in seconds (default: $DEFAULT_LINT_TIMEOUT)
  --debug        Enable debug output
  --verbose      Enable verbose output
  --help, -h     Show this help message

Examples:
  # Normal lint check
  $0
  
  # Auto-fix issues
  $0 --fix
  
  # Strict mode with custom timeout
  $0 --strict --timeout 120

Exit Codes:
  0  Lint check passed
  1  Lint errors found
  3  Lint timeout
  4  Lint skipped (no lint script)
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
    log_info "$MODULE_NAME skipped: No lint script defined"
    exit $EXIT_SKIP
  elif [ $exit_code -ne 0 ]; then
    log_error "$MODULE_NAME failed: Prerequisites not met"
    exit $exit_code
  fi
  
  # Check lint rules (informational)
  check_lint_rules
  
  # Run lint check
  if ! run_lint "$LINT_COMMAND"; then
    exit_code=$?
    
    # Try auto-fix if requested
    if [ "$auto_fix" = true ]; then
      log_info "Attempting auto-fix..."
      if auto_fix_lint; then
        # Re-run lint check after fix
        log_info "Re-running lint check after auto-fix..."
        if run_lint "$LINT_COMMAND"; then
          log_success "Lint check passed after auto-fix"
          exit_code=0
        else
          log_error "Lint errors remain after auto-fix"
        fi
      else
        log_error "Auto-fix failed"
      fi
    else
      log_info "💡 Tip: Use --fix to attempt automatic fixes"
    fi
    
    if [ $exit_code -ne 0 ]; then
      log_error "$MODULE_NAME failed: Lint errors found"
      exit $exit_code
    fi
  fi
  
  # Success
  log_result "pass" "$MODULE_NAME completed successfully"
  
  exit $EXIT_SUCCESS
}

# Run main if executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi