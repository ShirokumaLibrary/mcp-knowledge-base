#!/bin/bash
# Common utility functions for Claude AI commands
# Phase 1: Basic implementation

# ========================================
# Git Operation Functions
# ========================================

# Get all changes (staged, unstaged, and untracked files)
get_all_changes() {
  {
    git diff --name-only HEAD 2>/dev/null
    git diff --cached --name-only 2>/dev/null
    git diff --name-only 2>/dev/null
    git ls-files --others --exclude-standard 2>/dev/null
  } | sort -u
}

# Get staged changes only
get_staged_changes() {
  git diff --cached --name-only 2>/dev/null | sort -u
}

# Get unstaged changes only
get_unstaged_changes() {
  git diff --name-only 2>/dev/null | sort -u
}

# ========================================
# Logging Functions
# ========================================

# Info message (always shown)
log_info() {
  echo "ℹ️  $*"
}

# Error message (always shown)
log_error() {
  echo "❌ $*" >&2
}

# Warning message (always shown)
log_warn() {
  echo "⚠️  $*"
}

# Debug message (only shown when DEBUG=true)
log_debug() {
  if [ "${DEBUG:-false}" = true ]; then
    echo "🔍 [DEBUG] $*"
  fi
}

# Success message
log_success() {
  echo "✅ $*"
}

# ========================================
# Error Handling Functions
# ========================================

# Check if a command exists
check_command_exists() {
  local cmd=$1
  if ! command -v "$cmd" &> /dev/null; then
    log_error "Command '$cmd' not found"
    return 1
  fi
  return 0
}

# Capture error output
capture_error() {
  local cmd=$1
  local output
  local exit_code
  
  # Execute command and capture stderr
  output=$("$@" 2>&1)
  exit_code=$?
  
  if [ $exit_code -ne 0 ]; then
    log_error "Command failed: $cmd"
    if [ -n "$output" ]; then
      echo "$output" | head -10 | sed 's/^/   /'
    fi
  fi
  
  return $exit_code
}

# ========================================
# File Type Detection Functions
# ========================================

# Check if files contain code changes
has_code_changes() {
  local files=$1
  echo "$files" | grep -qE '\.(ts|js|tsx|jsx|mjs|cjs)$'
}

# Check if files contain config changes
has_config_changes() {
  local files=$1
  echo "$files" | grep -qE '(package\.json|package-lock\.json|tsconfig.*\.json|jest\.config\.|rollup\.config\.|webpack\.config\.|\.eslintrc|\.prettierrc)'
}

# Count markdown files
count_markdown_files() {
  local files=$1
  if [ -z "$files" ]; then
    echo 0
    return
  fi
  local count=$(echo "$files" | grep -E '\.(md|mdx)$' | wc -l | tr -d ' ')
  echo "${count:-0}"
}

# Count code files
count_code_files() {
  local files=$1
  if [ -z "$files" ]; then
    echo 0
    return
  fi
  local count=$(echo "$files" | grep -E '\.(ts|js|tsx|jsx|mjs|cjs)$' | wc -l | tr -d ' ')
  echo "${count:-0}"
}

# ========================================
# Utility Functions
# ========================================

# Check if we're in a git repository
is_git_repo() {
  git rev-parse --git-dir > /dev/null 2>&1
}

# Get current branch name
get_current_branch() {
  git branch --show-current 2>/dev/null
}

# Check if there are uncommitted changes
has_uncommitted_changes() {
  ! git diff-index --quiet HEAD -- 2>/dev/null
}

# ========================================
# Export Functions
# ========================================

# Export all functions for use in other scripts
export -f get_all_changes
export -f get_staged_changes
export -f get_unstaged_changes
export -f log_info
export -f log_error
export -f log_warn
export -f log_debug
export -f log_success
export -f check_command_exists
export -f capture_error
export -f has_code_changes
export -f has_config_changes
export -f count_markdown_files
export -f count_code_files
export -f is_git_repo
export -f get_current_branch
export -f has_uncommitted_changes