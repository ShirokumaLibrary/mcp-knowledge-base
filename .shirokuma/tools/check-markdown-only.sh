#!/bin/bash
# Check if changes are markdown-only
# Returns exit code 0 if markdown-only (checks can be skipped)
# Returns exit code 1 if code/config changes (full checks needed)
# Returns exit code 2 if error occurred

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# ========================================
# Main Logic
# ========================================

main() {
  local force_flag=false
  
  # Parse arguments
  for arg in "$@"; do
    if [ "$arg" = "--force" ] || [ "$arg" = "-f" ]; then
      force_flag=true
      log_warn "Force flag detected - full checks will be performed"
    fi
  done
  
  # Check if we're in a git repository
  if ! is_git_repo; then
    log_warn "Not in a git repository - running full checks for safety"
    export SKIP_CHECKS=false
    export CHANGE_TYPE="unknown"
    exit 1
  fi
  
  # Get all changed files
  local changed_files=$(get_all_changes)
  
  # Handle empty or error cases
  if [ -z "$changed_files" ]; then
    log_info "No changes detected - running full checks"
    export SKIP_CHECKS=false
    export CHANGE_TYPE="none"
    export MARKDOWN_COUNT=0
    export CODE_COUNT=0
    exit 1
  fi
  
  # Count file types
  local markdown_count=$(count_markdown_files "$changed_files")
  local code_count=$(count_code_files "$changed_files")
  local total_count=$(echo "$changed_files" | wc -l | tr -d ' ')
  local other_count=$((total_count - markdown_count - code_count))
  
  # Export counts for use by caller
  export MARKDOWN_COUNT=$markdown_count
  export CODE_COUNT=$code_count
  
  # Check for code and config changes
  local has_code=false
  local has_config=false
  
  if has_code_changes "$changed_files"; then
    has_code=true
  fi
  
  if has_config_changes "$changed_files"; then
    has_config=true
  fi
  
  # Force flag overrides everything
  if [ "$force_flag" = true ]; then
    export SKIP_CHECKS=false
    export CHANGE_TYPE="forced"
    exit 1
  fi
  
  # Make skip decision
  if [ "$has_code" = true ] || [ "$has_config" = true ]; then
    log_info "Code/Config changes detected"
    echo "   Code files: $code_count, Config files: detected"
    echo "   Running full pre-flight checks..."
    export SKIP_CHECKS=false
    export CHANGE_TYPE="code"
    exit 1
    
  elif [ $markdown_count -gt 0 ] && [ $other_count -eq 0 ] && [ $code_count -eq 0 ]; then
    log_success "Markdown-only changes detected"
    echo "   Files changed: ${markdown_count} markdown file(s)"
    echo "   ⏱️  Time saved: ~48 seconds"
    echo "   💡 To force full checks: add --force or -f flag"
    
    # Verbose mode - show changed files
    if [ "${VERBOSE:-false}" = true ] || [ "${DEBUG:-false}" = true ]; then
      echo "   Changed files:"
      echo "$changed_files" | grep -E '\.(md|mdx)$' | head -5 | sed 's/^/     - /'
      if [ $markdown_count -gt 5 ]; then
        echo "     ... and $((markdown_count - 5)) more"
      fi
    fi
    
    export SKIP_CHECKS=true
    export CHANGE_TYPE="markdown"
    exit 0
    
  else
    log_info "Mixed changes detected"
    echo "   Markdown: $markdown_count, Code: $code_count, Other: $other_count"
    echo "   Running full pre-flight checks for safety..."
    export SKIP_CHECKS=false
    export CHANGE_TYPE="mixed"
    exit 1
  fi
}

# ========================================
# Edge Case Checks
# ========================================

check_edge_cases() {
  local skip_checks=$1
  
  # Only check edge cases if we think we can skip
  if [ "$skip_checks" = true ]; then
    # Check for symbolic link changes
    if [ -n "$(find . -type l -newer .git/index 2>/dev/null)" ]; then
      log_warn "Symbolic link changes detected - running full checks"
      export SKIP_CHECKS=false
      export CHANGE_TYPE="symlink"
      exit 1
    fi
    
    # Check for submodule changes
    if git submodule status 2>/dev/null | grep -q '^[+-]'; then
      log_warn "Submodule changes detected - running full checks"
      export SKIP_CHECKS=false
      export CHANGE_TYPE="submodule"
      exit 1
    fi
  fi
}

# ========================================
# Execute Main
# ========================================

# Run main logic
main "$@"
exit_code=$?

# If we think we can skip, check edge cases
if [ $exit_code -eq 0 ]; then
  check_edge_cases true
fi

exit $exit_code