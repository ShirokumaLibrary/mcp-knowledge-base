#!/bin/bash
# Shared utilities for Pre-flight Check scripts
# Provides common functions and variables for all modules

# ========================================
# Shell Options & Error Handling
# ========================================

set -euo pipefail
IFS=$'\n\t'

# ========================================
# Common Variables
# ========================================

# Script metadata
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# Color codes for output (only when terminal is interactive)
if [ -t 1 ]; then
  readonly RED='\033[0;31m'
  readonly GREEN='\033[0;32m'
  readonly YELLOW='\033[1;33m'
  readonly BLUE='\033[0;34m'
  readonly CYAN='\033[0;36m'
  readonly GRAY='\033[0;90m'
  readonly BOLD='\033[1m'
  readonly NC='\033[0m' # No Color
else
  readonly RED=''
  readonly GREEN=''
  readonly YELLOW=''
  readonly BLUE=''
  readonly CYAN=''
  readonly GRAY=''
  readonly BOLD=''
  readonly NC=''
fi

# Timeout defaults (in seconds) - can be overridden via command-line arguments
readonly DEFAULT_BUILD_TIMEOUT=180
readonly DEFAULT_TEST_TIMEOUT=300
readonly DEFAULT_LINT_TIMEOUT=60
readonly DEFAULT_GLOBAL_TIMEOUT=600

# Exit codes
readonly EXIT_SUCCESS=0
readonly EXIT_FAIL=1
readonly EXIT_MARKDOWN_ONLY=2
readonly EXIT_TIMEOUT=3
readonly EXIT_SKIP=4
readonly EXIT_ERROR=5
readonly EXIT_CONFIG_ERROR=6
readonly EXIT_DEPENDENCY_ERROR=7

# ========================================
# Timestamp Functions
# ========================================

# Get current timestamp
get_timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

# Get ISO 8601 timestamp
get_iso_timestamp() {
  date '+%Y-%m-%dT%H:%M:%S%z'
}

# ========================================
# Logging Functions
# ========================================

# Info message with timestamp
log_info() {
  echo -e "${CYAN}[$(get_timestamp)] ℹ️  $*${NC}"
}

# Success message with timestamp
log_success() {
  echo -e "${GREEN}[$(get_timestamp)] ✅ $*${NC}"
}

# Warning message with timestamp
log_warn() {
  echo -e "${YELLOW}[$(get_timestamp)] ⚠️  $*${NC}"
}

# Error message with timestamp (to stderr)
log_error() {
  echo -e "${RED}[$(get_timestamp)] ❌ $*${NC}" >&2
}

# Debug message (only shown when debug mode is enabled)
# Pass debug flag as first argument: log_debug "true" "message"
log_debug() {
  local debug_mode="${1:-false}"
  shift
  if [ "$debug_mode" = "true" ]; then
    echo -e "${GRAY}[$(get_timestamp)] 🔍 [DEBUG] $*${NC}"
  fi
}

# Step message (for progress indication)
log_step() {
  echo -e "${BLUE}[$(get_timestamp)] ▶️  $*${NC}"
}

# Result message (for test/check results)
log_result() {
  local status=$1
  shift
  if [ "$status" = "pass" ]; then
    echo -e "${GREEN}[$(get_timestamp)] ✓ $*${NC}"
  else
    echo -e "${RED}[$(get_timestamp)] ✗ $*${NC}"
  fi
}

# ========================================
# Path Sanitization Functions
# ========================================

# Sanitize path (remove quotes, expand ~, make absolute)
sanitize_path() {
  local path="${1:-}"
  
  # Remove surrounding quotes if present
  path="${path%\"}"
  path="${path#\"}"
  path="${path%\'}"
  path="${path#\'}"
  
  # Expand tilde
  if [[ "$path" == "~"* ]]; then
    path="${HOME}${path:1}"
  fi
  
  # Make absolute if relative
  if [[ "$path" != /* ]]; then
    path="${PWD}/${path}"
  fi
  
  # Resolve symlinks and normalize
  if [ -e "$path" ]; then
    path="$(cd "$(dirname "$path")" && pwd)/$(basename "$path")"
  fi
  
  echo "$path"
}

# Validate file exists
validate_file() {
  local file="$1"
  if [ ! -f "$file" ]; then
    log_error "File not found: $file"
    return 1
  fi
  return 0
}

# Validate directory exists
validate_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then
    log_error "Directory not found: $dir"
    return 1
  fi
  return 0
}

# ========================================
# Command Execution Functions
# ========================================

# Check if command exists
check_command() {
  local cmd="$1"
  if ! command -v "$cmd" &> /dev/null; then
    log_error "Command not found: $cmd"
    return 1
  fi
  return 0
}

# Execute command with timeout
execute_with_timeout() {
  local timeout="${1:-60}"
  shift
  local cmd="$*"
  
  log_debug "Executing with ${timeout}s timeout: $cmd"
  
  if command -v timeout &> /dev/null; then
    # GNU timeout available
    if timeout --preserve-status "$timeout" bash -c "$cmd"; then
      return 0
    else
      local exit_code=$?
      if [ $exit_code -eq 124 ] || [ $exit_code -eq 137 ]; then
        log_error "Command timed out after ${timeout}s: $cmd"
        return $EXIT_TIMEOUT
      else
        return $exit_code
      fi
    fi
  else
    # Fallback to basic execution without timeout
    log_debug "timeout command not available, executing without timeout"
    eval "$cmd"
  fi
}

# ========================================
# Output Formatting Functions
# ========================================

# Print a horizontal line
print_line() {
  local char="${1:--}"
  local width="${2:-60}"
  printf '%*s\n' "$width" '' | tr ' ' "$char"
}

# Print section header
print_section() {
  echo
  print_line "=" 60
  echo -e "${BOLD}$*${NC}"
  print_line "=" 60
}

# Print subsection header
print_subsection() {
  echo
  echo -e "${BOLD}$*${NC}"
  print_line "-" 40
}

# Format duration from seconds
format_duration() {
  local seconds="$1"
  local minutes=$((seconds / 60))
  local remaining=$((seconds % 60))
  
  if [ $minutes -gt 0 ]; then
    echo "${minutes}m ${remaining}s"
  else
    echo "${seconds}s"
  fi
}

# ========================================
# Environment Functions
# ========================================

# Parse timeout from arguments (e.g., --timeout 300)
parse_timeout() {
  local default_timeout="$1"
  shift
  
  while [ $# -gt 0 ]; do
    case "$1" in
      --timeout|-t)
        if [ -n "${2:-}" ] && [[ "${2}" =~ ^[0-9]+$ ]]; then
          echo "$2"
          return 0
        fi
        ;;
    esac
    shift
  done
  
  echo "$default_timeout"
}

# Check if running in CI environment
# Note: Still checks CI env vars as these are system-level, not config
is_ci() {
  # These are not configuration env vars but CI system detection
  if [ "${CI:-false}" = "true" ] || [ -n "${GITHUB_ACTIONS:-}" ] || [ -n "${JENKINS_HOME:-}" ]; then
    return 0
  fi
  return 1
}

# Check if verbose mode is enabled
# Pass verbose and debug flags as arguments
is_verbose() {
  local verbose_mode="${1:-false}"
  local debug_mode="${2:-false}"
  [ "$verbose_mode" = "true" ] || [ "$debug_mode" = "true" ]
}

# ========================================
# Project Detection Functions
# ========================================

# Check if in git repository
is_git_repo() {
  git rev-parse --git-dir > /dev/null 2>&1
}

# Get project type (npm, yarn, etc.)
get_project_type() {
  if [ -f "${PROJECT_ROOT}/package.json" ]; then
    if [ -f "${PROJECT_ROOT}/yarn.lock" ]; then
      echo "yarn"
    elif [ -f "${PROJECT_ROOT}/pnpm-lock.yaml" ]; then
      echo "pnpm"
    else
      echo "npm"
    fi
  else
    echo "unknown"
  fi
}

# Get package manager command
get_package_manager() {
  local project_type
  project_type="$(get_project_type)"
  
  case "$project_type" in
    yarn) echo "yarn" ;;
    pnpm) echo "pnpm" ;;
    npm) echo "npm" ;;
    *) echo "npm" ;; # Default to npm
  esac
}

# ========================================
# Checkpoint Functions
# ========================================

# Create checkpoint file
# Pass check results as arguments: create_checkpoint "name" "build_passed" "test_passed" "lint_passed"
create_checkpoint() {
  local checkpoint_name="${1:-preflight}"
  local build_passed="${2:-false}"
  local test_passed="${3:-false}"
  local lint_passed="${4:-false}"
  local checkpoint_dir="${PROJECT_ROOT}/.shirokuma/checkpoints"
  
  mkdir -p "$checkpoint_dir"
  
  local checkpoint_file="${checkpoint_dir}/${checkpoint_name}.json"
  
  cat > "$checkpoint_file" <<EOF
{
  "name": "${checkpoint_name}",
  "timestamp": "$(get_iso_timestamp)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "checks_passed": {
    "build": ${build_passed},
    "test": ${test_passed},
    "lint": ${lint_passed}
  },
  "environment": {
    "node_version": "$(node --version 2>/dev/null || echo 'unknown')",
    "npm_version": "$(npm --version 2>/dev/null || echo 'unknown')",
    "project_type": "$(get_project_type)"
  }
}
EOF
  
  log_success "Checkpoint created: $checkpoint_file"
}

# Check if checkpoint exists
checkpoint_exists() {
  local checkpoint_name="$1"
  local checkpoint_file="${PROJECT_ROOT}/.shirokuma/checkpoints/${checkpoint_name}.json"
  
  [ -f "$checkpoint_file" ]
}

# ========================================
# Export Functions
# ========================================

# Export all logging functions
export -f get_timestamp
export -f get_iso_timestamp
export -f log_info
export -f log_success
export -f log_warn
export -f log_error
export -f log_debug
export -f log_step
export -f log_result

# Export utility functions
export -f sanitize_path
export -f validate_file
export -f validate_dir
export -f check_command
export -f execute_with_timeout
export -f print_line
export -f print_section
export -f print_subsection
export -f format_duration
export -f parse_timeout
export -f is_ci
export -f is_verbose
export -f is_git_repo
export -f get_project_type
export -f get_package_manager
export -f create_checkpoint
export -f checkpoint_exists

# Export variables
export PROJECT_ROOT
export EXIT_SUCCESS EXIT_FAIL EXIT_MARKDOWN_ONLY EXIT_TIMEOUT
export EXIT_SKIP EXIT_ERROR EXIT_CONFIG_ERROR EXIT_DEPENDENCY_ERROR
export DEFAULT_BUILD_TIMEOUT DEFAULT_TEST_TIMEOUT DEFAULT_LINT_TIMEOUT DEFAULT_GLOBAL_TIMEOUT