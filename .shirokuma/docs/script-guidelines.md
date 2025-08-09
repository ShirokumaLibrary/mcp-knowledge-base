# Script Calling Guidelines

## Overview

This document establishes standardized patterns for script calling in the SHIROKUMA MCP Knowledge Base project to simplify Claude Code permission management and ensure consistency across the codebase.

## Core Principles

### 1. Simplicity First
- One standard way to call scripts
- Minimal permission requirements
- Clear and predictable patterns

### 2. Security by Design
- Relative paths only (no absolute paths)
- Command-line arguments only (no environment variables)
- Clear separation of executable vs library scripts

### 3. Claude Code Compatibility
- Consistent permission model
- Reduced permission dialog frequency
- Predictable behavior across sessions

### 4. Reliability Through Error Handling
- Comprehensive error handling with cleanup
- Graceful interrupt handling (Ctrl+C, SIGTERM)
- Structured logging with consistent formats
- Performance metrics collection

## Directory Structure

```
.shirokuma/
├── scripts/           # 🟢 User-executable scripts (PUBLIC INTERFACE)
│   ├── lib/          # 🟡 Shared libraries (source-only)
│   ├── modules/      # 🟡 Reusable modules (called by main scripts)
│   └── compat/       # 🔶 Backward compatibility wrappers (TEMPORARY)
├── tools/            # 🟡 Internal utilities (called by scripts only)
│   └── lib/         # 🟡 Tool-specific shared functions
└── tests/           # 🔵 Test scripts (development/CI use)
```

### Directory Purposes

**🟢 scripts/** - Public Interface
- User-facing executable scripts
- Called directly by commands, agents, and users
- Must follow all interface requirements (--help, --version, exit codes)

**🟡 Internal** - Implementation Details  
- scripts/lib/, scripts/modules/, tools/, tools/lib/
- Called only by other scripts
- Not directly executed by users or commands

**🔵 tests/** - Development Support
- Test and validation scripts
- Development and CI/CD use only

**🔶 compat/** - Temporary Compatibility (DEPRECATED after 2025-12-01)
- Backward compatibility wrappers for legacy patterns
- Automatic conversion with deprecation warnings
- Removed after 6-month deprecation period

## Calling Standards

### ✅ Standard Format

```bash
# Standard calling pattern (ALWAYS use this)
.shirokuma/scripts/<script-name>.sh [options]
```

### ✅ Correct Examples

```bash
# Pre-flight checks
.shirokuma/scripts/preflight-check.sh --debug --skip-test

# Test execution
.shirokuma/scripts/run-all-tests.sh --junit --parallel

# Environment setup
.shirokuma/scripts/setup-environment.sh --development

# With proper quoting for paths with spaces
.shirokuma/scripts/process-files.sh --input="/path/with spaces/file.txt"
```

### ❌ FORBIDDEN Patterns

```bash
# ❌ Absolute paths
/home/webapp/mcp/.shirokuma/scripts/test.sh
/absolute/path/.shirokuma/scripts/test.sh

# ❌ Dynamic path variables in calls
${SCRIPT_DIR}/preflight-check.sh
$(pwd)/.shirokuma/scripts/test.sh

# ❌ Environment variable configuration
DEBUG=true .shirokuma/scripts/test.sh
export VERBOSE=1; .shirokuma/scripts/test.sh

# ❌ Bash command wrapper (unnecessary)
bash .shirokuma/scripts/test.sh

# ❌ Direct tool calling (bypass public interface)
.shirokuma/tools/check-markdown-only.sh
.shirokuma/scripts/lib/common.sh
```

## Parameter Standards

### ✅ Command-Line Arguments (REQUIRED)

```bash
# Boolean flags
--debug, --verbose, --force, --dry-run, --parallel

# Value parameters  
--timeout=300, --format=json, --output="/path/to/file"
--retries=3, --log-level=info, --config="/etc/config.json"

# Short options (when beneficial)
-h (help), -v (verbose), -d (debug)

# Complex parameters with proper quoting
--exclude-pattern="*.tmp *.log" --include-dirs="src tests"
```

### ❌ Environment Variables (FORBIDDEN)

```bash
# ❌ Never use environment variables for configuration
export DEBUG=true
export TIMEOUT=300
export FORMAT=json
```

## Script Interface Requirements

All scripts in `.shirokuma/scripts/` MUST implement:

### 1. Help System
```bash
# Must respond to --help or -h
.shirokuma/scripts/example.sh --help
.shirokuma/scripts/example.sh -h
```

### 2. Version Information
```bash  
# Must respond to --version
.shirokuma/scripts/example.sh --version
```

### 3. Standard Exit Codes
- `0`: Success
- `1`: General failure  
- `2`: Invalid arguments
- `126`: Permission denied
- `127`: Command not found
- `130`: Interrupted by user (Ctrl+C)
- `143`: Terminated (SIGTERM)

### 4. Structured Logging Output
```bash
# Use consistent log levels with timestamps
[2025-08-09T10:30:45.123Z] [INFO] Processing started...
[2025-08-09T10:30:46.456Z] [WARN] Non-critical issue detected
[2025-08-09T10:30:47.789Z] [ERROR] Fatal error occurred
```

## Internal Script Implementation

### ✅ Allowed Internal Patterns

```bash
# Path resolution within scripts (OK)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Tool calling from within scripts (OK)
"${SCRIPT_DIR}/../tools/check-markdown-only.sh"

# Library sourcing from within scripts (OK)
source "${SCRIPT_DIR}/lib/common.sh"
source "${SCRIPT_DIR}/../tools/lib/common.sh"

# Proper handling of paths with spaces
source "${SCRIPT_DIR}/lib/file utils.sh"
"${SCRIPT_DIR}/../tools/process file.sh" --input="${INPUT_FILE}"
```

## Enhanced Script Template

```bash
#!/bin/bash
# Script: <script-name>.sh  
# Purpose: <brief description>
# Usage: .shirokuma/scripts/<script-name>.sh [options]
# Version: 1.0.0

set -euo pipefail

# Script metadata
readonly SCRIPT_VERSION="1.0.0"
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_START_TIME="$(date -Iseconds)"

# Get script directory for internal references
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

# Initialize variables
DEBUG_MODE="false"
VERBOSE_MODE="false"
DRY_RUN="false"
TEMP_DIR=""
LOCK_FILE=""

# Source common utilities (if needed)
source "${SCRIPT_DIR}/lib/common.sh"

# Comprehensive cleanup function
cleanup() {
    local exit_code=$?
    local script_end_time="$(date -Iseconds)"
    
    # Calculate execution time
    local start_epoch=$(date -d "${SCRIPT_START_TIME}" +%s)
    local end_epoch=$(date -d "${script_end_time}" +%s)
    local duration=$((end_epoch - start_epoch))
    
    # Remove temporary files
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}" || log_warn "Failed to remove temporary directory: ${TEMP_DIR}"
    fi
    
    # Release locks
    if [[ -n "${LOCK_FILE}" && -f "${LOCK_FILE}" ]]; then
        rm -f "${LOCK_FILE}" || log_warn "Failed to remove lock file: ${LOCK_FILE}"
    fi
    
    # Log completion with metrics
    if [[ $exit_code -eq 0 ]]; then
        log_info "Script completed successfully (duration: ${duration}s)"
    else
        log_error "Script failed with exit code ${exit_code} (duration: ${duration}s)"
    fi
    
    exit $exit_code
}

# Signal handlers for graceful termination
handle_interrupt() {
    log_warn "Script interrupted by user (Ctrl+C)"
    exit 130
}

handle_terminate() {
    log_warn "Script terminated by system (SIGTERM)"
    exit 143
}

# Set traps for cleanup and signal handling
trap cleanup EXIT
trap handle_interrupt INT
trap handle_terminate TERM

# Enhanced help function
show_help() {
    cat << EOF
Usage: .shirokuma/scripts/${SCRIPT_NAME} [OPTIONS]

Description:
    Brief description of what this script does.
    Provide examples of common use cases.

Options:
    -h, --help              Show this help message
    --version               Show version information
    -d, --debug             Enable debug output
    -v, --verbose           Enable verbose output
    --dry-run               Show what would be done without executing
    --timeout=SECONDS       Set operation timeout (default: 300)
    --format=FORMAT         Output format: text|json|yaml (default: text)
    --output=FILE           Write output to file instead of stdout
    --force                 Force operation even if risky
    --parallel              Enable parallel processing
    --retries=NUMBER        Number of retries on failure (default: 3)

Environment:
    No environment variables are used for configuration.
    All options must be provided as command-line arguments.

Examples:
    # Basic usage
    .shirokuma/scripts/${SCRIPT_NAME}
    
    # Debug mode with verbose output
    .shirokuma/scripts/${SCRIPT_NAME} --debug --verbose
    
    # Output to JSON file with custom timeout
    .shirokuma/scripts/${SCRIPT_NAME} --format=json --output="/tmp/results.json" --timeout=600
    
    # Dry run to see what would happen
    .shirokuma/scripts/${SCRIPT_NAME} --dry-run --verbose

Exit Codes:
    0    Success
    1    General failure
    2    Invalid arguments
    126  Permission denied
    127  Command not found
    130  Interrupted by user (Ctrl+C)
    143  Terminated (SIGTERM)

EOF
}

# Version function with detailed information
show_version() {
    cat << EOF
${SCRIPT_NAME} version ${SCRIPT_VERSION}

Runtime Information:
  Bash Version: ${BASH_VERSION}
  OS: $(uname -s) $(uname -r)
  Script Location: ${SCRIPT_DIR}/${SCRIPT_NAME}
  
Guidelines Compliance: SHIROKUMA Script Guidelines v1.0
EOF
}

# Parse arguments with comprehensive validation
parse_arguments() {
    local timeout="300"
    local format="text"
    local output_file=""
    local retries="3"
    
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
            -d|--debug)
                DEBUG_MODE="true"
                log_debug "Debug mode enabled"
                shift
                ;;
            -v|--verbose)
                VERBOSE_MODE="true"
                log_info "Verbose mode enabled"
                shift
                ;;
            --dry-run)
                DRY_RUN="true"
                log_info "Dry run mode enabled"
                shift
                ;;
            --timeout=*)
                timeout="${1#*=}"
                if ! [[ "${timeout}" =~ ^[0-9]+$ ]] || (( timeout < 1 )); then
                    log_fatal "Invalid timeout value: ${timeout}. Must be positive integer."
                fi
                log_debug "Timeout set to ${timeout} seconds"
                shift
                ;;
            --format=*)
                format="${1#*=}"
                if [[ ! "${format}" =~ ^(text|json|yaml)$ ]]; then
                    log_fatal "Invalid format: ${format}. Must be text, json, or yaml."
                fi
                log_debug "Output format set to ${format}"
                shift
                ;;
            --output=*)
                output_file="${1#*=}"
                if [[ -z "${output_file}" ]]; then
                    log_fatal "Output file path cannot be empty"
                fi
                log_debug "Output will be written to ${output_file}"
                shift
                ;;
            --retries=*)
                retries="${1#*=}"
                if ! [[ "${retries}" =~ ^[0-9]+$ ]]; then
                    log_fatal "Invalid retries value: ${retries}. Must be non-negative integer."
                fi
                log_debug "Retries set to ${retries}"
                shift
                ;;
            --force)
                FORCE_MODE="true"
                log_warn "Force mode enabled"
                shift
                ;;
            --parallel)
                PARALLEL_MODE="true"
                log_info "Parallel processing enabled"
                shift
                ;;
            -*)
                log_fatal "Unknown option: $1. Use --help for usage information."
                ;;
            *)
                log_fatal "Unexpected argument: $1. Use --help for usage information."
                ;;
        esac
    done
    
    # Export validated values for use in main function
    readonly TIMEOUT="${timeout}"
    readonly FORMAT="${format}"
    readonly OUTPUT_FILE="${output_file}"
    readonly RETRIES="${retries}"
}

# Create secure temporary directory
create_temp_dir() {
    TEMP_DIR="$(mktemp -d -t "${SCRIPT_NAME}.XXXXXX")"
    if [[ ! -d "${TEMP_DIR}" ]]; then
        log_fatal "Failed to create temporary directory"
    fi
    log_debug "Created temporary directory: ${TEMP_DIR}"
}

# Acquire exclusive lock to prevent concurrent execution
acquire_lock() {
    local lock_dir="/tmp/${SCRIPT_NAME}_locks"
    mkdir -p "${lock_dir}" || log_fatal "Failed to create lock directory"
    
    LOCK_FILE="${lock_dir}/${SCRIPT_NAME}.lock"
    
    # Try to acquire lock with timeout
    local lock_timeout=30
    local elapsed=0
    
    while (( elapsed < lock_timeout )); do
        if (set -C; echo $$ > "${LOCK_FILE}") 2>/dev/null; then
            log_debug "Acquired exclusive lock: ${LOCK_FILE}"
            return 0
        fi
        
        local lock_pid=""
        if [[ -f "${LOCK_FILE}" ]]; then
            lock_pid="$(cat "${LOCK_FILE}" 2>/dev/null || echo "unknown")"
        fi
        
        log_debug "Lock held by PID ${lock_pid}, waiting... (${elapsed}s/${lock_timeout}s)"
        sleep 1
        ((elapsed++))
    done
    
    log_fatal "Failed to acquire lock after ${lock_timeout} seconds. Another instance may be running."
}

# Main script logic
main() {
    log_info "Starting ${SCRIPT_NAME} v${SCRIPT_VERSION}"
    
    # Create temporary directory if needed
    create_temp_dir
    
    # Acquire lock for exclusive execution (if needed)
    # acquire_lock
    
    # Validate prerequisites
    validate_environment
    
    # Main implementation goes here
    log_info "Executing main logic..."
    
    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would execute main operations here"
    else
        # Actual implementation
        execute_main_operations
    fi
    
    log_info "Main logic completed successfully"
}

# Validate environment and prerequisites
validate_environment() {
    log_debug "Validating environment..."
    
    # Check required commands
    local required_commands=("grep" "sed" "awk")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "${cmd}" &> /dev/null; then
            log_fatal "Required command not found: ${cmd}"
        fi
    done
    
    # Check required files/directories
    local required_paths=("${SCRIPT_DIR}/../tools")
    for path in "${required_paths[@]}"; do
        if [[ ! -d "${path}" ]]; then
            log_warn "Expected directory not found: ${path}"
        fi
    done
    
    log_debug "Environment validation completed"
}

# Execute main operations with error handling
execute_main_operations() {
    local operation_count=0
    local success_count=0
    local failure_count=0
    
    # Example operations with retry logic
    local operations=("operation1" "operation2" "operation3")
    
    for operation in "${operations[@]}"; do
        ((operation_count++))
        log_info "Executing operation ${operation_count}/${#operations[@]}: ${operation}"
        
        local retry_count=0
        local max_retries="${RETRIES}"
        local success=false
        
        while (( retry_count <= max_retries )); do
            if execute_single_operation "${operation}"; then
                success=true
                ((success_count++))
                log_info "Operation ${operation} completed successfully"
                break
            else
                ((retry_count++))
                if (( retry_count <= max_retries )); then
                    local backoff_delay=$((retry_count * 2))
                    log_warn "Operation ${operation} failed, retrying in ${backoff_delay}s (attempt ${retry_count}/${max_retries})"
                    sleep "${backoff_delay}"
                fi
            fi
        done
        
        if [[ "${success}" == "false" ]]; then
            ((failure_count++))
            log_error "Operation ${operation} failed after ${max_retries} retries"
            
            # Decide whether to continue or fail
            if [[ "${FORCE_MODE:-false}" == "true" ]]; then
                log_warn "Continuing despite failure due to --force mode"
            else
                log_fatal "Stopping execution due to operation failure. Use --force to continue."
            fi
        fi
    done
    
    # Summary report
    log_info "Operations Summary: ${success_count} succeeded, ${failure_count} failed, ${operation_count} total"
    
    if (( failure_count > 0 )); then
        log_warn "Some operations failed. Check logs for details."
        exit 1
    fi
}

# Execute a single operation (placeholder - implement actual logic)
execute_single_operation() {
    local operation="$1"
    
    log_debug "Starting operation: ${operation}"
    
    # Simulate operation with random success/failure for demo
    # Replace this with actual implementation
    if (( RANDOM % 10 < 8 )); then  # 80% success rate
        log_debug "Operation ${operation} succeeded"
        return 0
    else
        log_debug "Operation ${operation} failed"
        return 1
    fi
}

# Parse arguments and execute main function
parse_arguments "$@"
main
```

## Common Library Functions (lib/common.sh)

```bash
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
```

## Backward Compatibility Wrapper Template

```bash
#!/bin/bash
# Legacy compatibility wrapper (DEPRECATED - removes after 2025-12-01)
# Automatically converts old calling patterns to new standard format

set -euo pipefail

readonly WRAPPER_VERSION="1.0.0"
readonly DEPRECATION_DATE="2025-12-01"
readonly CURRENT_DATE="$(date +%Y-%m-%d)"

# Source common utilities for logging
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"

# Show deprecation warning
show_deprecation_warning() {
    local original_call="$1"
    local converted_call="$2"
    
    log_warn "DEPRECATION WARNING: Legacy script calling pattern detected"
    log_warn "Original:  ${original_call}"
    log_warn "Converted: ${converted_call}"
    log_warn "This compatibility wrapper will be removed on ${DEPRECATION_DATE}"
    log_warn "Please update your scripts to use the new format"
    log_warn "For migration help: .shirokuma/scripts/validate-script-compliance.sh --help"
}

# Convert legacy patterns to standard format
convert_legacy_pattern() {
    local original_pattern="$1"
    shift
    local args=("$@")
    
    # Remove absolute path prefixes
    local script_name=""
    if [[ "$original_pattern" =~ /([^/]+\.sh)$ ]]; then
        script_name="${BASH_REMATCH[1]}"
    else
        log_fatal "Cannot extract script name from: $original_pattern"
    fi
    
    # Convert to standard format
    local standard_call=".shirokuma/scripts/${script_name}"
    
    # Convert environment variables to command-line arguments
    local converted_args=()
    for arg in "${args[@]}"; do
        if [[ "$arg" =~ ^([A-Z_]+)=(.+)$ ]]; then
            local var_name="${BASH_REMATCH[1]}"
            local var_value="${BASH_REMATCH[2]}"
            
            # Convert common environment variables to flags
            case "$var_name" in
                DEBUG|VERBOSE)
                    if [[ "$var_value" == "true" || "$var_value" == "1" ]]; then
                        converted_args+=("--$(echo "$var_name" | tr '[:upper:]' '[:lower:]')")
                    fi
                    ;;
                *)
                    # Convert other env vars to --env-var-name=value format
                    local flag_name="$(echo "$var_name" | tr '[:upper:]' '[:lower:]' | tr '_' '-')"
                    converted_args+=("--${flag_name}=${var_value}")
                    ;;
            esac
        else
            converted_args+=("$arg")
        fi
    done
    
    # Show warning and execute converted command
    show_deprecation_warning "$original_pattern ${args[*]}" "$standard_call ${converted_args[*]}"
    
    log_info "Executing converted command..."
    exec "$standard_call" "${converted_args[@]}"
}

# Main compatibility wrapper logic
main() {
    if [[ $# -eq 0 ]]; then
        log_fatal "Usage: $0 <legacy-script-call> [args...]"
    fi
    
    convert_legacy_pattern "$@"
}

main "$@"
```

## Validation and Compliance

### Enhanced Compliance Validation Script Features
The validation script (.shirokuma/scripts/validate-script-compliance.sh) will implement:

1. **Regex Pattern Validation**
   - Path format: `^\.shirokuma/scripts/[^/]+\.sh$`
   - No absolute paths: `!/^[/~].*shirokuma/scripts/`
   - No environment variables: `![A-Z_]+=.*\.shirokuma/scripts/`

2. **Output Formats**
   - Console: Colored output with violation details
   - JSON: Structured data for programmatic use
   - GitHub Actions: Annotations for CI/CD integration

3. **Auto-Fix Suggestions**
   - Convert absolute paths to relative
   - Convert environment variables to command-line flags
   - Identify missing required interface elements

4. **Edge Case Detection**
   - Symbolic links pointing outside allowed directories
   - Paths with spaces requiring proper quoting
   - Concurrent execution conflicts

### CI/CD Integration Examples

```yaml
# GitHub Actions workflow integration
- name: Validate Script Compliance
  run: |
    .shirokuma/scripts/validate-script-compliance.sh \
      --format=github-actions \
      --auto-fix-suggestions \
      --fail-on-violations

# Pre-commit hook
#!/bin/bash
.shirokuma/scripts/validate-script-compliance.sh --format=console --quiet
```

## Migration Guidelines

### For Existing Scripts

1. **Enhanced Audit Process**
   ```bash
   # Find all script calls with context
   .shirokuma/scripts/validate-script-compliance.sh --scan-mode=comprehensive
   
   # Generate migration report
   .shirokuma/scripts/validate-script-compliance.sh --generate-migration-plan
   ```

2. **Gradual Migration with Compatibility**
   - Deploy compatibility wrappers first
   - Update one file at a time with testing
   - Monitor deprecation warnings in logs
   - Remove wrappers after 6-month period

3. **Testing Each Change**
   - Verify script functionality unchanged
   - Test with Claude Code permission system
   - Run compliance validation
   - Check performance impact

### For New Scripts

1. **Use Enhanced Template** (provided above)
2. **Implement Required Interface** (help, version, exit codes, logging)
3. **Validate Before Committing**
4. **Include in Documentation**

## Performance Monitoring

### Metrics Collection
All enhanced scripts collect:
- Execution time with sub-second precision
- Memory usage during peak operation
- File system access patterns
- Claude Code permission dialog frequency
- Error rates and retry statistics

### Reporting Format
```json
{
  "script": "preflight-check.sh",
  "version": "1.0.0",
  "execution_time": 2.345,
  "memory_peak_mb": 45.2,
  "permission_dialogs": 0,
  "operations_total": 15,
  "operations_successful": 15,
  "operations_failed": 0,
  "timestamp": "2025-08-09T10:30:45.123Z"
}
```

## Troubleshooting

### Enhanced Problem Solutions

**Problem**: "Permission denied" with relative paths
**Solution**: 
1. Ensure execute permission: `chmod +x .shirokuma/scripts/script.sh`
2. Verify working directory is project root
3. Check for symbolic link issues
4. Use compatibility wrapper temporarily

**Problem**: Script hangs or doesn't respond to Ctrl+C
**Solution**:
1. Verify trap handlers are implemented
2. Check for infinite loops in script logic
3. Use timeout mechanisms for long operations
4. Implement proper signal handling

**Problem**: Inconsistent behavior across environments
**Solution**:
1. Use enhanced template with comprehensive validation
2. Test in multiple environments (local, CI, Claude Code)
3. Validate all prerequisites in script
4. Use absolute paths internally, relative paths for calls

---

## Summary

The enhanced guidelines provide:

1. **Comprehensive Error Handling** - Trap handlers, cleanup, signal management
2. **Structured Logging** - Consistent timestamps, levels, and formatting
3. **Backward Compatibility** - Automatic conversion with deprecation warnings
4. **Performance Monitoring** - Metrics collection and reporting
5. **Edge Case Management** - Symbolic links, spaces in paths, concurrent execution
6. **Enhanced Validation** - Regex patterns, multiple output formats, auto-fix suggestions

Following these enhanced guidelines ensures reliable, maintainable, and Claude Code-compatible scripts with excellent developer experience and operational visibility.