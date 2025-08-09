#!/bin/bash
# Build validation module for Pre-flight Checks
# Validates that the project builds successfully
# NO ENVIRONMENT VARIABLES for configuration - uses command-line arguments only

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/preflight-common.sh"

# ========================================
# Module Configuration
# ========================================

readonly MODULE_NAME="Build Check"
readonly BUILD_COMMAND="npm run build"

# Default settings (can be overridden with command-line args)
BUILD_TIMEOUT="$DEFAULT_BUILD_TIMEOUT"
DEBUG_MODE="false"
VERBOSE_MODE="false"

# ========================================
# Build Functions
# ========================================

# Run build command
run_build() {
  local start_time
  start_time=$(date +%s)
  
  log_step "Starting build process..."
  log_debug "$DEBUG_MODE" "Build command: $BUILD_COMMAND"
  log_debug "$DEBUG_MODE" "Timeout: ${BUILD_TIMEOUT}s"
  
  # Create temporary file for output
  local output_file
  output_file=$(mktemp)
  trap "rm -f '$output_file'" EXIT
  
  # Execute build with timeout
  if execute_with_timeout "$BUILD_TIMEOUT" "$BUILD_COMMAND > '$output_file' 2>&1"; then
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Build completed successfully ($(format_duration $duration))"
    
    # Show summary if verbose
    if is_verbose "$VERBOSE_MODE" "$DEBUG_MODE"; then
      log_debug "$DEBUG_MODE" "Build output (last 10 lines):"
      tail -10 "$output_file" | sed 's/^/  /'
    fi
    
    return 0
  else
    local exit_code=$?
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ $exit_code -eq $EXIT_TIMEOUT ]; then
      log_error "Build timed out after ${BUILD_TIMEOUT}s"
    else
      log_error "Build failed after $(format_duration $duration)"
    fi
    
    # Show error output
    log_error "Build output (last 20 lines):"
    tail -20 "$output_file" | sed 's/^/  /' >&2
    
    return $exit_code
  fi
}

# Check build prerequisites
check_prerequisites() {
  log_step "Checking build prerequisites..."
  
  # Check if package.json exists
  if [ ! -f "${PROJECT_ROOT}/package.json" ]; then
    log_error "package.json not found in project root"
    return $EXIT_CONFIG_ERROR
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

# Clean build artifacts
clean_build() {
  log_step "Cleaning build artifacts..."
  
  # Common build output directories
  local build_dirs=("dist" "build" "out" ".next" "coverage")
  
  for dir in "${build_dirs[@]}"; do
    if [ -d "${PROJECT_ROOT}/${dir}" ]; then
      log_debug "$DEBUG_MODE" "Removing ${dir}/"
      rm -rf "${PROJECT_ROOT:?}/${dir}"
    fi
  done
  
  # Clean TypeScript build info
  if [ -f "${PROJECT_ROOT}/tsconfig.tsbuildinfo" ]; then
    log_debug "$DEBUG_MODE" "Removing tsconfig.tsbuildinfo"
    rm -f "${PROJECT_ROOT}/tsconfig.tsbuildinfo"
  fi
  
  log_success "Build artifacts cleaned"
}

# Verify build output
verify_build_output() {
  log_step "Verifying build output..."
  
  # Check if dist directory exists (most common output)
  if [ -d "${PROJECT_ROOT}/dist" ]; then
    local file_count
    file_count=$(find "${PROJECT_ROOT}/dist" -type f | wc -l)
    
    if [ "$file_count" -gt 0 ]; then
      log_success "Build output verified: $file_count files in dist/"
      return 0
    else
      log_error "Build output directory is empty"
      return $EXIT_FAIL
    fi
  fi
  
  # Check alternative build directories
  for dir in build out .next; do
    if [ -d "${PROJECT_ROOT}/${dir}" ]; then
      log_success "Build output found in ${dir}/"
      return 0
    fi
  done
  
  log_warn "No standard build output directory found (dist/, build/, out/, .next/)"
  # This is a warning, not an error - some projects might output elsewhere
  return 0
}

# ========================================
# Main Execution
# ========================================

main() {
  print_subsection "$MODULE_NAME"
  
  # Parse arguments
  local clean_build_flag=false
  local skip_verify=false
  
  while [ $# -gt 0 ]; do
    case "$1" in
      --clean)
        clean_build_flag=true
        ;;
      --skip-verify)
        skip_verify=true
        ;;
      --timeout)
        shift
        if [ -n "${1:-}" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
          BUILD_TIMEOUT="$1"
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

Build validation module for Pre-flight Checks

Options:
  --clean        Clean build artifacts before building
  --skip-verify  Skip build output verification
  --timeout N    Build timeout in seconds (default: $DEFAULT_BUILD_TIMEOUT)
  --debug        Enable debug output
  --verbose      Enable verbose output
  --help, -h     Show this help message

Examples:
  # Normal build check
  $0
  
  # Clean build with custom timeout
  $0 --clean --timeout 300
  
  # Debug mode with verification skip
  $0 --debug --skip-verify

Exit Codes:
  0  Build successful
  1  Build failed
  3  Build timeout
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
  if ! check_prerequisites; then
    exit_code=$?
    log_error "$MODULE_NAME failed: Prerequisites not met"
    exit $exit_code
  fi
  
  # Clean if requested
  if [ "$clean_build_flag" = true ]; then
    clean_build
  fi
  
  # Run build
  if ! run_build; then
    exit_code=$?
    log_error "$MODULE_NAME failed: Build process failed"
    exit $exit_code
  fi
  
  # Verify output unless skipped
  if [ "$skip_verify" = false ]; then
    if ! verify_build_output; then
      exit_code=$?
      log_error "$MODULE_NAME failed: Build verification failed"
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