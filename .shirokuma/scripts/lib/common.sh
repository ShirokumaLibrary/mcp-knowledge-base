#!/bin/bash
# Common functions for SHIROKUMA script guidelines
# Source this file in scripts that need common functionality

# Ensure this is being sourced, not executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "ERROR: This file should be sourced, not executed directly" >&2
    exit 1
fi

# Color codes for output formatting
readonly COLOR_RED='\033[0;31m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_BLUE='\033[0;34m'
readonly COLOR_RESET='\033[0m'

# Structured logging functions with ISO 8601 timestamps
log_timestamp() {
    date -Iseconds
}

log_debug() {
    if [[ "${DEBUG_MODE:-false}" == "true" ]]; then
        printf "[%s] [DEBUG] %s\n" "$(log_timestamp)" "$*"
    fi
}

log_info() {
    printf "[%s] [${COLOR_BLUE}INFO${COLOR_RESET}] %s\n" "$(log_timestamp)" "$*"
}

log_warn() {
    printf "[%s] [${COLOR_YELLOW}WARN${COLOR_RESET}] %s\n" "$(log_timestamp)" "$*"
}

log_error() {
    printf "[%s] [${COLOR_RED}ERROR${COLOR_RESET}] %s\n" "$(log_timestamp)" "$*" >&2
}

log_fatal() {
    printf "[%s] [${COLOR_RED}FATAL${COLOR_RESET}] %s\n" "$(log_timestamp)" "$*" >&2
    exit 1
}

log_success() {
    printf "[%s] [${COLOR_GREEN}SUCCESS${COLOR_RESET}] %s\n" "$(log_timestamp)" "$*"
}

# Utility functions
is_command_available() {
    command -v "$1" &> /dev/null
}

is_directory_writable() {
    local dir="$1"
    [[ -d "$dir" && -w "$dir" ]]
}

is_file_readable() {
    local file="$1"
    [[ -f "$file" && -r "$file" ]]
}

# Safe path handling
resolve_absolute_path() {
    local path="$1"
    cd "$(dirname "$path")" && pwd -P
}

# Validate script compliance patterns
validate_script_call_pattern() {
    local pattern="$1"
    
    # Check if pattern matches required format: .shirokuma/scripts/*.sh
    if [[ "$pattern" =~ ^\.shirokuma/scripts/[^/]+\.sh$ ]]; then
        return 0
    else
        return 1
    fi
}

# Performance metrics helpers
start_timer() {
    echo "$(date +%s.%N)"
}

end_timer() {
    local start_time="$1"
    local end_time="$(date +%s.%N)"
    echo "scale=3; $end_time - $start_time" | bc 2>/dev/null || echo "0"
}

# Safe temporary file/directory creation
create_temp_file() {
    local prefix="${1:-tmp}"
    mktemp -t "${prefix}.XXXXXX"
}

create_temp_dir() {
    local prefix="${1:-tmp}"
    mktemp -d -t "${prefix}.XXXXXX"
}

# Process management
is_process_running() {
    local pid="$1"
    kill -0 "$pid" 2>/dev/null
}

wait_for_process() {
    local pid="$1"
    local timeout="${2:-30}"
    local elapsed=0
    
    while is_process_running "$pid" && (( elapsed < timeout )); do
        sleep 1
        ((elapsed++))
    done
    
    return $([[ $elapsed -lt $timeout ]] && echo 0 || echo 1)
}