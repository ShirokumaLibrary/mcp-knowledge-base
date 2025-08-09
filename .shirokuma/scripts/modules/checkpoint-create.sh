#!/bin/bash
# Checkpoint creation module for Pre-flight Checks
# Creates validation checkpoints for successful check runs
# NO ENVIRONMENT VARIABLES for configuration - uses command-line arguments only

set -euo pipefail

# Source common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/preflight-common.sh"

# ========================================
# Module Configuration
# ========================================

readonly MODULE_NAME="Checkpoint Creation"
readonly CHECKPOINT_DIR="${PROJECT_ROOT}/.shirokuma/checkpoints"

# Default settings (can be overridden with command-line args)
DEBUG_MODE="false"
VERBOSE_MODE="false"
BUILD_PASSED="false"
TEST_PASSED="false"
LINT_PASSED="false"

# ========================================
# Checkpoint Functions
# ========================================

# Generate checkpoint name
generate_checkpoint_name() {
  local prefix="${1:-preflight}"
  local timestamp
  timestamp=$(date '+%Y%m%d_%H%M%S')
  echo "${prefix}_${timestamp}"
}

# Create checkpoint directory
ensure_checkpoint_dir() {
  if [ ! -d "$CHECKPOINT_DIR" ]; then
    log_debug "$DEBUG_MODE" "Creating checkpoint directory: $CHECKPOINT_DIR"
    mkdir -p "$CHECKPOINT_DIR"
  fi
}

# Create checkpoint file
create_checkpoint_file() {
  local checkpoint_name="$1"
  local checkpoint_file="${CHECKPOINT_DIR}/${checkpoint_name}.json"
  
  log_step "Creating checkpoint: $checkpoint_name"
  
  # Gather system information
  local git_commit git_branch node_version npm_version project_type
  git_commit=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
  git_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
  node_version=$(node --version 2>/dev/null || echo "unknown")
  npm_version=$(npm --version 2>/dev/null || echo "unknown")
  project_type=$(get_project_type)
  
  # Gather file statistics
  local total_files changed_files
  total_files=$(find "${PROJECT_ROOT}" -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" 2>/dev/null | wc -l || echo "0")
  changed_files=$(git diff --name-only 2>/dev/null | wc -l || echo "0")
  
  # Create JSON checkpoint
  cat > "$checkpoint_file" <<EOF
{
  "checkpoint": {
    "name": "${checkpoint_name}",
    "timestamp": "$(get_iso_timestamp)",
    "type": "preflight"
  },
  "validation": {
    "build_passed": ${BUILD_PASSED},
    "test_passed": ${TEST_PASSED},
    "lint_passed": ${LINT_PASSED},
    "all_passed": $([ "$BUILD_PASSED" = "true" ] && [ "$TEST_PASSED" = "true" ] && [ "$LINT_PASSED" = "true" ] && echo "true" || echo "false")
  },
  "repository": {
    "git_commit": "${git_commit}",
    "git_branch": "${git_branch}",
    "changed_files": ${changed_files},
    "total_source_files": ${total_files}
  },
  "environment": {
    "node_version": "${node_version}",
    "npm_version": "${npm_version}",
    "project_type": "${project_type}",
    "platform": "$(uname -s)",
    "architecture": "$(uname -m)"
  },
  "metadata": {
    "created_by": "preflight-check",
    "version": "2.0.0"
  }
}
EOF
  
  if [ -f "$checkpoint_file" ]; then
    log_success "Checkpoint created: $checkpoint_file"
    
    if is_verbose "$VERBOSE_MODE" "$DEBUG_MODE"; then
      echo "Checkpoint details:"
      echo "  Build: ${BUILD_PASSED}"
      echo "  Tests: ${TEST_PASSED}"
      echo "  Lint: ${LINT_PASSED}"
      echo "  Branch: ${git_branch}"
      echo "  Commit: ${git_commit:0:8}"
    fi
    
    return 0
  else
    log_error "Failed to create checkpoint file"
    return 1
  fi
}

# List existing checkpoints
list_checkpoints() {
  log_step "Listing existing checkpoints..."
  
  if [ ! -d "$CHECKPOINT_DIR" ]; then
    log_info "No checkpoints directory found"
    return 0
  fi
  
  local count
  count=$(find "$CHECKPOINT_DIR" -name "*.json" -type f 2>/dev/null | wc -l || echo "0")
  
  if [ "$count" -eq 0 ]; then
    log_info "No checkpoints found"
    return 0
  fi
  
  log_info "Found $count checkpoint(s):"
  
  # List recent checkpoints
  find "$CHECKPOINT_DIR" -name "*.json" -type f -printf "%T@ %p\n" 2>/dev/null | \
    sort -rn | \
    head -10 | \
    while read -r timestamp file; do
      local name
      name=$(basename "$file" .json)
      local date
      date=$(date -d "@${timestamp%.*}" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "unknown")
      echo "  • $name ($date)"
    done
}

# Clean old checkpoints
clean_old_checkpoints() {
  local days="${1:-7}"
  
  log_step "Cleaning checkpoints older than $days days..."
  
  if [ ! -d "$CHECKPOINT_DIR" ]; then
    log_debug "$DEBUG_MODE" "No checkpoints directory to clean"
    return 0
  fi
  
  local count
  count=$(find "$CHECKPOINT_DIR" -name "*.json" -type f -mtime +"$days" 2>/dev/null | wc -l || echo "0")
  
  if [ "$count" -eq 0 ]; then
    log_info "No old checkpoints to clean"
    return 0
  fi
  
  log_info "Removing $count old checkpoint(s)..."
  find "$CHECKPOINT_DIR" -name "*.json" -type f -mtime +"$days" -delete 2>/dev/null
  log_success "Old checkpoints cleaned"
}

# Verify checkpoint
verify_checkpoint() {
  local checkpoint_name="$1"
  local checkpoint_file="${CHECKPOINT_DIR}/${checkpoint_name}.json"
  
  if [ ! -f "$checkpoint_file" ]; then
    log_error "Checkpoint not found: $checkpoint_name"
    return 1
  fi
  
  # Validate JSON structure
  if command -v jq &> /dev/null; then
    if jq empty "$checkpoint_file" 2>/dev/null; then
      log_success "Checkpoint is valid JSON"
    else
      log_error "Checkpoint has invalid JSON structure"
      return 1
    fi
  else
    log_debug "$DEBUG_MODE" "jq not available, skipping JSON validation"
  fi
  
  return 0
}

# ========================================
# Main Execution
# ========================================

main() {
  print_subsection "$MODULE_NAME"
  
  # Parse arguments
  local checkpoint_name=""
  local list_mode=false
  local clean_mode=false
  local clean_days=7
  
  while [ $# -gt 0 ]; do
    case "$1" in
      --name)
        shift
        checkpoint_name="${1:-}"
        ;;
      --build-passed=*)
        BUILD_PASSED="${1#*=}"
        ;;
      --test-passed=*)
        TEST_PASSED="${1#*=}"
        ;;
      --lint-passed=*)
        LINT_PASSED="${1#*=}"
        ;;
      --list)
        list_mode=true
        ;;
      --clean)
        clean_mode=true
        ;;
      --clean-days)
        shift
        clean_days="${1:-7}"
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

Checkpoint creation module for Pre-flight Checks

Options:
  --name NAME              Custom checkpoint name (default: auto-generated)
  --build-passed=BOOL      Build check result (true/false)
  --test-passed=BOOL       Test check result (true/false)
  --lint-passed=BOOL       Lint check result (true/false)
  --list                   List existing checkpoints
  --clean                  Clean old checkpoints
  --clean-days N           Days to keep checkpoints (default: 7)
  --debug                  Enable debug output
  --verbose                Enable verbose output
  --help, -h               Show this help message

Examples:
  # Create checkpoint with results
  $0 --build-passed=true --test-passed=true --lint-passed=true
  
  # Create named checkpoint
  $0 --name "release_v1.0" --build-passed=true
  
  # List checkpoints
  $0 --list
  
  # Clean old checkpoints
  $0 --clean --clean-days 30

Exit Codes:
  0  Checkpoint created successfully
  1  Checkpoint creation failed
  5  General error
  6  Configuration error
EOF
        exit 0
        ;;
      *)
        if [[ "$1" == --*=* ]]; then
          # Handle any unrecognized option with = format
          log_debug "$DEBUG_MODE" "Ignoring unrecognized option: $1"
        else
          log_error "Unknown option: $1"
          echo "Use --help for usage information"
          exit $EXIT_CONFIG_ERROR
        fi
        ;;
    esac
    shift
  done
  
  # Handle different modes
  if [ "$list_mode" = true ]; then
    list_checkpoints
    exit $EXIT_SUCCESS
  fi
  
  if [ "$clean_mode" = true ]; then
    clean_old_checkpoints "$clean_days"
    exit $EXIT_SUCCESS
  fi
  
  # Ensure checkpoint directory exists
  ensure_checkpoint_dir
  
  # Generate checkpoint name if not provided
  if [ -z "$checkpoint_name" ]; then
    checkpoint_name=$(generate_checkpoint_name)
  fi
  
  # Create checkpoint
  if create_checkpoint_file "$checkpoint_name"; then
    # Verify the checkpoint was created correctly
    if verify_checkpoint "$checkpoint_name"; then
      log_result "pass" "$MODULE_NAME completed successfully"
      exit $EXIT_SUCCESS
    else
      log_error "Checkpoint verification failed"
      exit $EXIT_FAIL
    fi
  else
    log_error "$MODULE_NAME failed: Could not create checkpoint"
    exit $EXIT_FAIL
  fi
}

# Run main if executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
  main "$@"
fi