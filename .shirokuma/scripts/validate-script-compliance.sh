#!/bin/bash
# Script: validate-script-compliance.sh
# Purpose: Comprehensive validation of script calling patterns with auto-fix capabilities
# Usage: .shirokuma/scripts/validate-script-compliance.sh [options]
# Version: 2.0.0

set -uo pipefail

# Script metadata
readonly SCRIPT_VERSION="2.0.0"
readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_START_TIME="$(date -Iseconds)"

# Get script directory for internal references
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

# Initialize variables
DEBUG_MODE="false"
VERBOSE_MODE="false"
DRY_RUN="false"
QUIET_MODE="false"
FORMAT="console"
OUTPUT_FILE=""
SCAN_PATH="."
AUTO_FIX="false"
GENERATE_MIGRATION_PLAN="false"
FAIL_ON_VIOLATIONS="false"
SHOW_FIX_COMMANDS="false"
RULES="all"
EXCLUDE_PATTERN=""
CONFIG_FILE=""
TEMP_DIR=""

# Violation counters
declare -A VIOLATIONS_BY_TYPE
declare -A VIOLATIONS_BY_SEVERITY
declare -a ALL_VIOLATIONS

# Initialize counters
TOTAL_FILES=0
TOTAL_VIOLATIONS=0
FIXES_AVAILABLE=0
FIXES_APPLIED=0

# Source common utilities
source "${SCRIPT_DIR}/lib/common.sh"

# Violation severity levels
readonly SEVERITY_CRITICAL="critical"
readonly SEVERITY_IMPORTANT="important"
readonly SEVERITY_SUGGESTED="suggested"

# Violation types
readonly VIOLATION_ABSOLUTE_PATH="ABSOLUTE_PATH"
readonly VIOLATION_ENV_VARS="ENV_VARS"
readonly VIOLATION_BASH_WRAPPER="BASH_WRAPPER"
readonly VIOLATION_DIRECT_TOOLS="DIRECT_TOOLS"
readonly VIOLATION_DYNAMIC_PATH="DYNAMIC_PATH"
readonly VIOLATION_MISSING_EXEC="MISSING_EXEC"
readonly VIOLATION_BROKEN_LINK="BROKEN_LINK"

# Regex patterns for validation
readonly PATTERN_VALID_CALL='\.shirokuma/scripts/[^/[:space:]]+\.sh'
readonly PATTERN_ABSOLUTE_PATH='[/~][^[:space:]]*/.shirokuma/scripts/[^/[:space:]]+\.sh'
readonly PATTERN_ENV_VARS='([A-Z_][A-Z0-9_]*=[^[:space:]]+[[:space:]]+)+\.shirokuma/scripts/'
readonly PATTERN_DYNAMIC_PATH='(\$\{[^}]+\}|\$[A-Z_][A-Z0-9_]*|\$\([^)]+\))[^[:space:]]*/\.shirokuma/scripts/'
readonly PATTERN_BASH_WRAPPER='\b(bash|sh)[[:space:]]+\.shirokuma/scripts/[^/[:space:]]+\.sh'
readonly PATTERN_DIRECT_TOOLS='\.shirokuma/(tools|scripts/lib|scripts/modules)/[^/[:space:]]+\.sh'

# Cleanup function
cleanup() {
    local exit_code=$?
    local script_end_time="$(date -Iseconds)"
    
    # Calculate execution time
    local start_epoch=$(date -d "${SCRIPT_START_TIME}" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${SCRIPT_START_TIME%%+*}" +%s)
    local end_epoch=$(date -d "${script_end_time}" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${script_end_time%%+*}" +%s)
    local duration=$((end_epoch - start_epoch))
    
    # Remove temporary files
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}" || log_warn "Failed to remove temporary directory: ${TEMP_DIR}"
    fi
    
    # Log completion with metrics
    if [[ "${QUIET_MODE}" != "true" ]]; then
        if [[ $exit_code -eq 0 ]]; then
            log_info "Script completed successfully (duration: ${duration}s)"
        else
            log_error "Script failed with exit code ${exit_code} (duration: ${duration}s)"
        fi
    fi
    
    exit $exit_code
}

# Signal handlers
handle_interrupt() {
    log_warn "Script interrupted by user (Ctrl+C)"
    exit 130
}

handle_terminate() {
    log_warn "Script terminated by system (SIGTERM)"
    exit 143
}

# Set traps
trap cleanup EXIT
trap handle_interrupt INT
trap handle_terminate TERM

# Enhanced help function
show_help() {
    cat << EOF
Usage: .shirokuma/scripts/${SCRIPT_NAME} [OPTIONS]

Description:
    Comprehensive validation of script calling patterns across the codebase.
    Ensures compliance with SHIROKUMA Script Calling Guidelines, detects violations,
    and provides auto-fix capabilities for safe corrections.

Options:
    -h, --help                    Show this help message
    --version                     Show version information
    -d, --debug                   Enable debug output
    -v, --verbose                 Enable verbose output
    -q, --quiet                   Suppress non-error output
    --dry-run                     Show what would be done without executing
    
    Scanning Options:
    --scan-path=PATH              Path to scan (default: current directory)
    --exclude=PATTERN             Exclude files matching pattern (can be repeated)
    --rules=RULES                 Validation rules to apply: all|critical|important
    --config=FILE                 Load configuration from file
    
    Output Options:
    --format=FORMAT               Output format: console|json|github-actions|junit
    --output=FILE                 Write output to file instead of stdout
    --fail-on-violations          Exit with error code if violations found
    
    Fix Options:
    --auto-fix                    Apply safe auto-fixes for violations
    --show-fix-commands           Show fix commands without executing
    --generate-migration-plan     Generate comprehensive migration plan

Environment:
    No environment variables are used for configuration.
    All options must be provided as command-line arguments.

Examples:
    # Basic validation scan
    .shirokuma/scripts/${SCRIPT_NAME}
    
    # Scan with auto-fix in dry-run mode
    .shirokuma/scripts/${SCRIPT_NAME} --auto-fix --dry-run
    
    # Generate migration plan with JSON output
    .shirokuma/scripts/${SCRIPT_NAME} --generate-migration-plan --format=json --output=migration.json
    
    # CI/CD integration with GitHub Actions
    .shirokuma/scripts/${SCRIPT_NAME} --format=github-actions --fail-on-violations
    
    # Exclude test files and show fix commands
    .shirokuma/scripts/${SCRIPT_NAME} --exclude="*test*" --show-fix-commands

Violation Severities:
    CRITICAL   - Must be fixed immediately (blocks permissions)
    IMPORTANT  - Should be fixed soon (requires manual review)
    SUGGESTED  - Nice to fix (best practices)

Exit Codes:
    0    Success, no violations found
    1    General failure or violations found
    2    Invalid arguments
    3    Critical violations found
    130  Interrupted by user (Ctrl+C)
    143  Terminated (SIGTERM)

For more information:
    See .shirokuma/docs/script-guidelines.md

EOF
}

# Version function
show_version() {
    cat << EOF
${SCRIPT_NAME} version ${SCRIPT_VERSION}

Runtime Information:
  Bash Version: ${BASH_VERSION}
  OS: $(uname -s) $(uname -r)
  Script Location: ${SCRIPT_DIR}/${SCRIPT_NAME}
  
Guidelines Compliance: SHIROKUMA Script Guidelines v1.0
Enhanced Features: Auto-fix, Migration Plans, Multiple Output Formats
EOF
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
            -q|--quiet)
                QUIET_MODE="true"
                shift
                ;;
            --dry-run)
                DRY_RUN="true"
                log_info "Dry run mode enabled"
                shift
                ;;
            --scan-path=*)
                SCAN_PATH="${1#*=}"
                if [[ ! -d "${SCAN_PATH}" ]]; then
                    log_fatal "Scan path does not exist: ${SCAN_PATH}"
                fi
                log_debug "Scan path set to ${SCAN_PATH}"
                shift
                ;;
            --exclude=*)
                EXCLUDE_PATTERN="${EXCLUDE_PATTERN} ${1#*=}"
                log_debug "Added exclude pattern: ${1#*=}"
                shift
                ;;
            --rules=*)
                RULES="${1#*=}"
                if [[ ! "${RULES}" =~ ^(all|critical|important)$ ]]; then
                    log_fatal "Invalid rules: ${RULES}. Must be all, critical, or important."
                fi
                log_debug "Rules set to ${RULES}"
                shift
                ;;
            --config=*)
                CONFIG_FILE="${1#*=}"
                if [[ ! -f "${CONFIG_FILE}" ]]; then
                    log_fatal "Config file does not exist: ${CONFIG_FILE}"
                fi
                log_debug "Config file set to ${CONFIG_FILE}"
                shift
                ;;
            --format=*)
                FORMAT="${1#*=}"
                if [[ ! "${FORMAT}" =~ ^(console|json|github-actions|junit)$ ]]; then
                    log_fatal "Invalid format: ${FORMAT}. Must be console, json, github-actions, or junit."
                fi
                log_debug "Output format set to ${FORMAT}"
                shift
                ;;
            --output=*)
                OUTPUT_FILE="${1#*=}"
                log_debug "Output will be written to ${OUTPUT_FILE}"
                shift
                ;;
            --fail-on-violations)
                FAIL_ON_VIOLATIONS="true"
                log_debug "Will fail on violations"
                shift
                ;;
            --auto-fix)
                AUTO_FIX="true"
                log_info "Auto-fix mode enabled"
                shift
                ;;
            --show-fix-commands)
                SHOW_FIX_COMMANDS="true"
                log_debug "Will show fix commands"
                shift
                ;;
            --generate-migration-plan)
                GENERATE_MIGRATION_PLAN="true"
                log_info "Will generate migration plan"
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
}

# Create temporary directory
create_temp_dir() {
    TEMP_DIR="$(mktemp -d -t "${SCRIPT_NAME}.XXXXXX")"
    if [[ ! -d "${TEMP_DIR}" ]]; then
        log_fatal "Failed to create temporary directory"
    fi
    log_debug "Created temporary directory: ${TEMP_DIR}"
}

# Load configuration file
load_config() {
    if [[ -n "${CONFIG_FILE}" && -f "${CONFIG_FILE}" ]]; then
        log_debug "Loading configuration from ${CONFIG_FILE}"
        # Parse JSON or YAML config file
        # This is a placeholder - implement actual config parsing
        log_warn "Config file loading not yet implemented"
    fi
}

# Check if file should be scanned
should_scan_file() {
    local file="$1"
    
    # Check exclude patterns
    if [[ -n "${EXCLUDE_PATTERN}" ]]; then
        for pattern in ${EXCLUDE_PATTERN}; do
            if [[ "$file" == *${pattern}* ]]; then
                log_debug "File excluded by pattern: $file"
                return 1
            fi
        done
    fi
    
    # Skip binary files
    if [[ "$file" =~ \.(jpg|jpeg|png|gif|pdf|zip|tar|gz|bz2|exe|dll|so|pyc|class|jar|war|ear)$ ]]; then
        return 1
    fi
    
    # Skip certain directories
    if [[ "$file" =~ (node_modules|\.git|dist|build|coverage|\.database) ]]; then
        return 1
    fi
    
    # Include text files that might contain script calls
    if [[ "$file" =~ \.(sh|md|yml|yaml|json|txt|js|ts|jsx|tsx|py|rb|go)$ ]]; then
        return 0
    fi
    
    # Include files in specific directories
    if [[ "$file" =~ ^\.claude/ ]] || [[ "$file" =~ ^\.shirokuma/ ]]; then
        # Extra check for text files only
        if command -v file &>/dev/null; then
            if file --mime-type "$file" 2>/dev/null | grep -q "text/"; then
                return 0
            fi
        else
            # If file command is not available, include all non-binary extensions
            if [[ ! "$file" =~ \.(jpg|jpeg|png|gif|pdf|zip|tar|gz|bz2|exe|dll|so|pyc|class|jar|war|ear)$ ]]; then
                return 0
            fi
        fi
    fi
    
    # Include package.json specifically
    if [[ "$(basename "$file")" == "package.json" ]]; then
        return 0
    fi
    
    return 1
}

# Record a violation
record_violation() {
    local severity="$1"
    local type="$2"
    local file="$3"
    local line_num="$4"
    local line_content="$5"
    local fix_available="$6"
    local fix_command="$7"
    
    # Create violation object
    local violation="{
        \"severity\": \"${severity}\",
        \"type\": \"${type}\",
        \"file\": \"${file}\",
        \"line\": ${line_num},
        \"content\": \"$(echo "$line_content" | sed 's/"/\\"/g')\",
        \"fix_available\": ${fix_available},
        \"fix_command\": \"$(echo "$fix_command" | sed 's/"/\\"/g')\"
    }"
    
    # Add to violations array
    ALL_VIOLATIONS+=("$violation")
    
    # Update counters
    ((TOTAL_VIOLATIONS++))
    VIOLATIONS_BY_TYPE["${type}"]=$((${VIOLATIONS_BY_TYPE["${type}"]:-0} + 1))
    VIOLATIONS_BY_SEVERITY["${severity}"]=$((${VIOLATIONS_BY_SEVERITY["${severity}"]:-0} + 1))
    
    if [[ "${fix_available}" == "true" ]]; then
        ((FIXES_AVAILABLE++))
    fi
}

# Generate fix command for absolute path
generate_absolute_path_fix() {
    local file="$1"
    local line_num="$2"
    local line_content="$3"
    
    # Extract the absolute path
    local abs_path=""
    if [[ "$line_content" =~ (/[^[:space:]]+/.shirokuma/scripts/[^[:space:]]+\.sh) ]]; then
        abs_path="${BASH_REMATCH[1]}"
        local relative_path="${abs_path##*/.shirokuma/}"
        relative_path=".shirokuma/${relative_path}"
        
        # Create sed command for fix
        local fix_command="sed -i.bak '${line_num}s|${abs_path}|${relative_path}|g' '${file}'"
        echo "$fix_command"
    fi
}

# Generate fix command for environment variables
generate_env_var_fix() {
    local file="$1"
    local line_num="$2"
    local line_content="$3"
    
    # Common environment variable mappings
    local fixed_line="$line_content"
    fixed_line="${fixed_line//DEBUG=true /}"
    fixed_line="${fixed_line//DEBUG=1 /}"
    fixed_line="${fixed_line//VERBOSE=true /}"
    fixed_line="${fixed_line//VERBOSE=1 /}"
    fixed_line="${fixed_line//DRY_RUN=true /}"
    fixed_line="${fixed_line//DRY_RUN=1 /}"
    
    # Add corresponding flags
    if [[ "$line_content" =~ DEBUG=(true|1) ]]; then
        fixed_line="${fixed_line%.sh*}.sh --debug${fixed_line#*.sh}"
    fi
    if [[ "$line_content" =~ VERBOSE=(true|1) ]]; then
        fixed_line="${fixed_line%.sh*}.sh --verbose${fixed_line#*.sh}"
    fi
    if [[ "$line_content" =~ DRY_RUN=(true|1) ]]; then
        fixed_line="${fixed_line%.sh*}.sh --dry-run${fixed_line#*.sh}"
    fi
    
    if [[ "$fixed_line" != "$line_content" ]]; then
        echo "sed -i.bak '${line_num}s|$(echo "$line_content" | sed 's/|/\\|/g')|$(echo "$fixed_line" | sed 's/|/\\|/g')|' '${file}'"
    fi
}

# Generate fix command for bash wrapper
generate_bash_wrapper_fix() {
    local file="$1"
    local line_num="$2"
    local line_content="$3"
    
    # Remove bash/sh wrapper
    local fixed_line="$line_content"
    fixed_line="${fixed_line//bash /}"
    fixed_line="${fixed_line//sh /}"
    
    if [[ "$fixed_line" != "$line_content" ]]; then
        echo "sed -i.bak '${line_num}s|$(echo "$line_content" | sed 's/|/\\|/g')|$(echo "$fixed_line" | sed 's/|/\\|/g')|' '${file}'"
    fi
}

# Apply fix if in auto-fix mode
apply_fix() {
    local fix_command="$1"
    local file="$2"
    
    if [[ "${AUTO_FIX}" == "true" ]]; then
        if [[ "${DRY_RUN}" == "true" ]]; then
            log_info "[DRY RUN] Would apply fix: ${fix_command}"
        else
            # Create backup first
            cp "$file" "${file}.compliance-backup" 2>/dev/null || true
            
            # Apply fix
            eval "$fix_command" 2>/dev/null
            if [[ $? -eq 0 ]]; then
                ((FIXES_APPLIED++))
                log_success "Applied fix to ${file}"
                # Remove sed backup file if it exists
                rm -f "${file}.bak" 2>/dev/null || true
            else
                log_warn "Failed to apply fix to ${file}"
                # Restore from backup
                mv "${file}.compliance-backup" "$file" 2>/dev/null || true
            fi
        fi
    fi
}

# Validate a single file
validate_file() {
    local file="$1"
    local line_num=0
    
    log_debug "Validating file: $file"
    
    while IFS= read -r line; do
        ((line_num++))
        
        # Skip empty lines and comments
        [[ -z "$line" ]] && continue
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Check for absolute paths (CRITICAL)
        if [[ "${RULES}" == "all" || "${RULES}" == "critical" ]]; then
            if [[ "$line" =~ ${PATTERN_ABSOLUTE_PATH} ]]; then
                local fix_command=$(generate_absolute_path_fix "$file" "$line_num" "$line")
                local fix_available="false"
                [[ -n "$fix_command" ]] && fix_available="true"
                
                record_violation "${SEVERITY_CRITICAL}" "${VIOLATION_ABSOLUTE_PATH}" \
                    "$file" "$line_num" "$line" "$fix_available" "$fix_command"
                
                if [[ "${SHOW_FIX_COMMANDS}" == "true" && -n "$fix_command" ]]; then
                    echo "Fix: $fix_command"
                fi
                
                apply_fix "$fix_command" "$file"
            fi
        fi
        
        # Check for environment variables (CRITICAL)
        if [[ "${RULES}" == "all" || "${RULES}" == "critical" ]]; then
            if [[ "$line" =~ ${PATTERN_ENV_VARS} ]]; then
                local fix_command=$(generate_env_var_fix "$file" "$line_num" "$line")
                local fix_available="false"
                [[ -n "$fix_command" ]] && fix_available="true"
                
                record_violation "${SEVERITY_CRITICAL}" "${VIOLATION_ENV_VARS}" \
                    "$file" "$line_num" "$line" "$fix_available" "$fix_command"
                
                if [[ "${SHOW_FIX_COMMANDS}" == "true" && -n "$fix_command" ]]; then
                    echo "Fix: $fix_command"
                fi
                
                apply_fix "$fix_command" "$file"
            fi
        fi
        
        # Check for dynamic paths (CRITICAL)
        if [[ "${RULES}" == "all" || "${RULES}" == "critical" ]]; then
            if [[ "$line" =~ ${PATTERN_DYNAMIC_PATH} ]]; then
                record_violation "${SEVERITY_CRITICAL}" "${VIOLATION_DYNAMIC_PATH}" \
                    "$file" "$line_num" "$line" "false" ""
            fi
        fi
        
        # Check for bash wrapper (IMPORTANT)
        if [[ "${RULES}" == "all" || "${RULES}" == "important" ]]; then
            if [[ "$line" =~ ${PATTERN_BASH_WRAPPER} ]]; then
                local fix_command=$(generate_bash_wrapper_fix "$file" "$line_num" "$line")
                local fix_available="false"
                [[ -n "$fix_command" ]] && fix_available="true"
                
                record_violation "${SEVERITY_IMPORTANT}" "${VIOLATION_BASH_WRAPPER}" \
                    "$file" "$line_num" "$line" "$fix_available" "$fix_command"
                
                if [[ "${SHOW_FIX_COMMANDS}" == "true" && -n "$fix_command" ]]; then
                    echo "Fix: $fix_command"
                fi
                
                apply_fix "$fix_command" "$file"
            fi
        fi
        
        # Check for direct tool calling (IMPORTANT)
        if [[ "${RULES}" == "all" || "${RULES}" == "important" ]]; then
            if [[ "$line" =~ ${PATTERN_DIRECT_TOOLS} ]]; then
                record_violation "${SEVERITY_IMPORTANT}" "${VIOLATION_DIRECT_TOOLS}" \
                    "$file" "$line_num" "$line" "false" ""
            fi
        fi
    done < <(cat "$file" 2>/dev/null || true)
}

# Check script file permissions
check_script_permissions() {
    # Determine the scripts directory based on SCAN_PATH
    local scripts_dir
    if [[ "${SCAN_PATH}" == ".shirokuma/scripts" ]]; then
        scripts_dir="${SCAN_PATH}"
    elif [[ "${SCAN_PATH}" == "." ]]; then
        scripts_dir=".shirokuma/scripts"
    else
        scripts_dir="${SCAN_PATH}/.shirokuma/scripts"
    fi
    
    if [[ -d "$scripts_dir" ]]; then
        log_debug "Checking script permissions in $scripts_dir"
        
        find "$scripts_dir" -name "*.sh" -type f 2>/dev/null | while read -r script; do
            if [[ ! -x "$script" ]]; then
                record_violation "${SEVERITY_SUGGESTED}" "${VIOLATION_MISSING_EXEC}" \
                    "$script" "0" "Missing execute permission" "true" "chmod +x '$script'"
                
                if [[ "${AUTO_FIX}" == "true" ]]; then
                    if [[ "${DRY_RUN}" == "true" ]]; then
                        log_info "[DRY RUN] Would add execute permission to $script"
                    else
                        chmod +x "$script"
                        ((FIXES_APPLIED++))
                        log_success "Added execute permission to $script"
                    fi
                fi
            fi
        done
    fi
}

# Output in console format
output_console() {
    if [[ "${QUIET_MODE}" == "true" ]]; then
        return
    fi
    
    echo ""
    echo "════════════════════════════════════════════════"
    echo "   SCRIPT COMPLIANCE VALIDATION REPORT"
    echo "════════════════════════════════════════════════"
    echo ""
    
    # Display violations by severity
    local has_critical=$((${VIOLATIONS_BY_SEVERITY["${SEVERITY_CRITICAL}"]:-0}))
    local has_important=$((${VIOLATIONS_BY_SEVERITY["${SEVERITY_IMPORTANT}"]:-0}))
    local has_suggested=$((${VIOLATIONS_BY_SEVERITY["${SEVERITY_SUGGESTED}"]:-0}))
    
    if [[ $has_critical -gt 0 ]]; then
        echo -e "${COLOR_RED}━━━ CRITICAL VIOLATIONS (Must Fix) ━━━${COLOR_RESET}"
        echo ""
        for violation in "${ALL_VIOLATIONS[@]}"; do
            if echo "$violation" | grep -q "\"severity\": \"${SEVERITY_CRITICAL}\""; then
                local file=$(echo "$violation" | grep -o '"file": "[^"]*"' | cut -d'"' -f4)
                local line=$(echo "$violation" | grep -o '"line": [0-9]*' | cut -d' ' -f2)
                local type=$(echo "$violation" | grep -o '"type": "[^"]*"' | cut -d'"' -f4)
                local content=$(echo "$violation" | grep -o '"content": "[^"]*"' | cut -d'"' -f4)
                
                echo -e "  ${COLOR_RED}✗${COLOR_RESET} ${file}:${line}"
                echo "    Type: ${type}"
                echo "    Line: ${content}"
                
                if [[ "${SHOW_FIX_COMMANDS}" == "true" ]]; then
                    local fix_cmd=$(echo "$violation" | grep -o '"fix_command": "[^"]*"' | cut -d'"' -f4)
                    if [[ -n "$fix_cmd" && "$fix_cmd" != "null" ]]; then
                        echo -e "    ${COLOR_GREEN}Fix:${COLOR_RESET} ${fix_cmd}"
                    fi
                fi
                echo ""
            fi
        done
    fi
    
    if [[ $has_important -gt 0 ]]; then
        echo -e "${COLOR_YELLOW}━━━ IMPORTANT VIOLATIONS (Should Fix) ━━━${COLOR_RESET}"
        echo ""
        for violation in "${ALL_VIOLATIONS[@]}"; do
            if echo "$violation" | grep -q "\"severity\": \"${SEVERITY_IMPORTANT}\""; then
                local file=$(echo "$violation" | grep -o '"file": "[^"]*"' | cut -d'"' -f4)
                local line=$(echo "$violation" | grep -o '"line": [0-9]*' | cut -d' ' -f2)
                local type=$(echo "$violation" | grep -o '"type": "[^"]*"' | cut -d'"' -f4)
                local content=$(echo "$violation" | grep -o '"content": "[^"]*"' | cut -d'"' -f4)
                
                echo -e "  ${COLOR_YELLOW}⚠${COLOR_RESET} ${file}:${line}"
                echo "    Type: ${type}"
                echo "    Line: ${content}"
                
                if [[ "${SHOW_FIX_COMMANDS}" == "true" ]]; then
                    local fix_cmd=$(echo "$violation" | grep -o '"fix_command": "[^"]*"' | cut -d'"' -f4)
                    if [[ -n "$fix_cmd" && "$fix_cmd" != "null" ]]; then
                        echo -e "    ${COLOR_GREEN}Fix:${COLOR_RESET} ${fix_cmd}"
                    fi
                fi
                echo ""
            fi
        done
    fi
    
    if [[ $has_suggested -gt 0 ]]; then
        echo -e "${COLOR_BLUE}━━━ SUGGESTED IMPROVEMENTS ━━━${COLOR_RESET}"
        echo ""
        for violation in "${ALL_VIOLATIONS[@]}"; do
            if echo "$violation" | grep -q "\"severity\": \"${SEVERITY_SUGGESTED}\""; then
                local file=$(echo "$violation" | grep -o '"file": "[^"]*"' | cut -d'"' -f4)
                local type=$(echo "$violation" | grep -o '"type": "[^"]*"' | cut -d'"' -f4)
                
                echo -e "  ${COLOR_BLUE}ℹ${COLOR_RESET} ${file}"
                echo "    Type: ${type}"
                echo ""
            fi
        done
    fi
    
    # Summary
    echo "════════════════════════════════════════════════"
    echo "   SUMMARY"
    echo "════════════════════════════════════════════════"
    echo ""
    echo "  Files Scanned:        ${TOTAL_FILES}"
    echo "  Total Violations:     ${TOTAL_VIOLATIONS}"
    echo ""
    echo "  By Severity:"
    echo "    Critical:          ${has_critical}"
    echo "    Important:         ${has_important}"
    echo "    Suggested:         ${has_suggested}"
    echo ""
    echo "  Auto-Fix:"
    echo "    Available:         ${FIXES_AVAILABLE}"
    echo "    Applied:           ${FIXES_APPLIED}"
    echo ""
    
    # Final status
    if [[ ${TOTAL_VIOLATIONS} -eq 0 ]]; then
        echo -e "${COLOR_GREEN}✓ All script calls are compliant!${COLOR_RESET}"
    elif [[ $has_critical -gt 0 ]]; then
        echo -e "${COLOR_RED}✗ Critical violations found - must be fixed!${COLOR_RESET}"
        echo ""
        echo "Run with --auto-fix to apply safe corrections automatically."
    elif [[ $has_important -gt 0 ]]; then
        echo -e "${COLOR_YELLOW}⚠ Important violations found - should be addressed.${COLOR_RESET}"
    else
        echo -e "${COLOR_BLUE}ℹ Only suggested improvements found.${COLOR_RESET}"
    fi
    
    echo ""
    echo "For detailed guidelines: .shirokuma/docs/script-guidelines.md"
    echo "════════════════════════════════════════════════"
}

# Output in JSON format
output_json() {
    cat << EOF
{
  "metadata": {
    "version": "${SCRIPT_VERSION}",
    "timestamp": "${SCRIPT_START_TIME}",
    "scan_path": "${SCAN_PATH}",
    "rules": "${RULES}"
  },
  "summary": {
    "files_scanned": ${TOTAL_FILES},
    "total_violations": ${TOTAL_VIOLATIONS},
    "violations_by_severity": {
      "critical": ${VIOLATIONS_BY_SEVERITY["${SEVERITY_CRITICAL}"]:-0},
      "important": ${VIOLATIONS_BY_SEVERITY["${SEVERITY_IMPORTANT}"]:-0},
      "suggested": ${VIOLATIONS_BY_SEVERITY["${SEVERITY_SUGGESTED}"]:-0}
    },
    "violations_by_type": {
      "absolute_path": ${VIOLATIONS_BY_TYPE["${VIOLATION_ABSOLUTE_PATH}"]:-0},
      "env_vars": ${VIOLATIONS_BY_TYPE["${VIOLATION_ENV_VARS}"]:-0},
      "bash_wrapper": ${VIOLATIONS_BY_TYPE["${VIOLATION_BASH_WRAPPER}"]:-0},
      "direct_tools": ${VIOLATIONS_BY_TYPE["${VIOLATION_DIRECT_TOOLS}"]:-0},
      "dynamic_path": ${VIOLATIONS_BY_TYPE["${VIOLATION_DYNAMIC_PATH}"]:-0},
      "missing_exec": ${VIOLATIONS_BY_TYPE["${VIOLATION_MISSING_EXEC}"]:-0}
    },
    "fixes": {
      "available": ${FIXES_AVAILABLE},
      "applied": ${FIXES_APPLIED}
    }
  },
  "violations": [
$(IFS=','; echo "    ${ALL_VIOLATIONS[*]}")
  ]
}
EOF
}

# Output in GitHub Actions format
output_github_actions() {
    for violation in "${ALL_VIOLATIONS[@]}"; do
        local severity=$(echo "$violation" | grep -o '"severity": "[^"]*"' | cut -d'"' -f4)
        local file=$(echo "$violation" | grep -o '"file": "[^"]*"' | cut -d'"' -f4)
        local line=$(echo "$violation" | grep -o '"line": [0-9]*' | cut -d' ' -f2)
        local type=$(echo "$violation" | grep -o '"type": "[^"]*"' | cut -d'"' -f4)
        local content=$(echo "$violation" | grep -o '"content": "[^"]*"' | cut -d'"' -f4)
        
        local level="warning"
        [[ "$severity" == "${SEVERITY_CRITICAL}" ]] && level="error"
        [[ "$severity" == "${SEVERITY_SUGGESTED}" ]] && level="notice"
        
        echo "::${level} file=${file},line=${line}::${type}: ${content}"
    done
}

# Output in JUnit format
output_junit() {
    local test_time=$(date +%s)
    
    cat << EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Script Compliance Validation" tests="${TOTAL_FILES}" failures="${TOTAL_VIOLATIONS}" time="${test_time}">
  <testsuite name="Compliance Checks" tests="${TOTAL_FILES}" failures="${TOTAL_VIOLATIONS}">
EOF
    
    # Group violations by file
    declare -A file_violations
    for violation in "${ALL_VIOLATIONS[@]}"; do
        local file=$(echo "$violation" | grep -o '"file": "[^"]*"' | cut -d'"' -f4)
        file_violations["$file"]="${file_violations["$file"]}${violation}|||"
    done
    
    # Output test cases
    for file in "${!file_violations[@]}"; do
        local violations="${file_violations[$file]}"
        local failure_count=$(echo "$violations" | grep -o "|||" | wc -l)
        
        if [[ $failure_count -gt 0 ]]; then
            echo "    <testcase classname=\"ScriptCompliance\" name=\"${file}\" time=\"0\">"
            echo "      <failure message=\"${failure_count} violations found\">"
            
            IFS='|||' read -ra VIOLATION_LIST <<< "$violations"
            for v in "${VIOLATION_LIST[@]}"; do
                if [[ -n "$v" ]]; then
                    local type=$(echo "$v" | grep -o '"type": "[^"]*"' | cut -d'"' -f4)
                    local line=$(echo "$v" | grep -o '"line": [0-9]*' | cut -d' ' -f2)
                    echo "        Line ${line}: ${type}"
                fi
            done
            
            echo "      </failure>"
            echo "    </testcase>"
        else
            echo "    <testcase classname=\"ScriptCompliance\" name=\"${file}\" time=\"0\"/>"
        fi
    done
    
    cat << EOF
  </testsuite>
</testsuites>
EOF
}

# Generate migration plan
generate_migration_plan() {
    log_info "Generating migration plan..."
    
    local plan_file="${TEMP_DIR}/migration_plan.md"
    
    cat > "$plan_file" << EOF
# Script Compliance Migration Plan

Generated: ${SCRIPT_START_TIME}
Scan Path: ${SCAN_PATH}

## Summary

- **Total Violations**: ${TOTAL_VIOLATIONS}
- **Critical**: ${VIOLATIONS_BY_SEVERITY["${SEVERITY_CRITICAL}"]:-0}
- **Important**: ${VIOLATIONS_BY_SEVERITY["${SEVERITY_IMPORTANT}"]:-0}
- **Suggested**: ${VIOLATIONS_BY_SEVERITY["${SEVERITY_SUGGESTED}"]:-0}

## Phase 1: Critical Fixes (Immediate)

These violations block Claude Code permissions and must be fixed immediately.

EOF
    
    # Add critical violations
    for violation in "${ALL_VIOLATIONS[@]}"; do
        if echo "$violation" | grep -q "\"severity\": \"${SEVERITY_CRITICAL}\""; then
            local file=$(echo "$violation" | grep -o '"file": "[^"]*"' | cut -d'"' -f4)
            local line=$(echo "$violation" | grep -o '"line": [0-9]*' | cut -d' ' -f2)
            local type=$(echo "$violation" | grep -o '"type": "[^"]*"' | cut -d'"' -f4)
            local fix_cmd=$(echo "$violation" | grep -o '"fix_command": "[^"]*"' | cut -d'"' -f4)
            
            echo "### ${file}:${line}" >> "$plan_file"
            echo "- **Type**: ${type}" >> "$plan_file"
            if [[ -n "$fix_cmd" && "$fix_cmd" != "null" ]]; then
                echo "- **Auto-Fix Available**: Yes" >> "$plan_file"
                echo '```bash' >> "$plan_file"
                echo "$fix_cmd" >> "$plan_file"
                echo '```' >> "$plan_file"
            else
                echo "- **Auto-Fix Available**: No (manual fix required)" >> "$plan_file"
            fi
            echo "" >> "$plan_file"
        fi
    done
    
    cat >> "$plan_file" << EOF

## Phase 2: Important Fixes (1 Week)

These violations should be addressed soon for better maintainability.

EOF
    
    # Add important violations
    for violation in "${ALL_VIOLATIONS[@]}"; do
        if echo "$violation" | grep -q "\"severity\": \"${SEVERITY_IMPORTANT}\""; then
            local file=$(echo "$violation" | grep -o '"file": "[^"]*"' | cut -d'"' -f4)
            local type=$(echo "$violation" | grep -o '"type": "[^"]*"' | cut -d'"' -f4)
            echo "- ${file}: ${type}" >> "$plan_file"
        fi
    done
    
    cat >> "$plan_file" << EOF

## Phase 3: Best Practice Improvements (1 Month)

Optional improvements for following best practices.

EOF
    
    # Add suggested improvements
    for violation in "${ALL_VIOLATIONS[@]}"; do
        if echo "$violation" | grep -q "\"severity\": \"${SEVERITY_SUGGESTED}\""; then
            local file=$(echo "$violation" | grep -o '"file": "[^"]*"' | cut -d'"' -f4)
            local type=$(echo "$violation" | grep -o '"type": "[^"]*"' | cut -d'"' -f4)
            echo "- ${file}: ${type}" >> "$plan_file"
        fi
    done
    
    cat >> "$plan_file" << EOF

## Automation Commands

### Apply All Safe Auto-Fixes
\`\`\`bash
.shirokuma/scripts/validate-script-compliance.sh --auto-fix --scan-path="${SCAN_PATH}"
\`\`\`

### Verify Compliance After Fixes
\`\`\`bash
.shirokuma/scripts/validate-script-compliance.sh --scan-path="${SCAN_PATH}"
\`\`\`

## Next Steps

1. Review and apply critical fixes immediately
2. Schedule important fixes within the next week
3. Plan for gradual best practice improvements
4. Add compliance check to CI/CD pipeline
5. Update team documentation with new guidelines

## Resources

- [Script Guidelines](.shirokuma/docs/script-guidelines.md)
- [Migration Support](.shirokuma/scripts/validate-script-compliance.sh --help)
EOF
    
    if [[ "${FORMAT}" == "console" ]]; then
        cat "$plan_file"
    else
        log_info "Migration plan generated at: ${plan_file}"
    fi
}

# Main validation function
main() {
    if [[ "${QUIET_MODE}" != "true" ]]; then
        log_info "Starting script compliance validation v${SCRIPT_VERSION}"
        log_info "Scanning path: ${SCAN_PATH}"
    fi
    
    # Create temp directory if needed
    create_temp_dir
    
    # Load configuration
    load_config
    
    # Find all files to scan
    local files_to_scan=()
    while IFS= read -r -d '' file; do
        if should_scan_file "$file"; then
            files_to_scan+=("$file")
        fi
    done < <(find "${SCAN_PATH}" -type f -print0 2>/dev/null || true)
    
    log_debug "Found ${#files_to_scan[@]} files to scan"
    
    # Validate each file
    for file in "${files_to_scan[@]}"; do
        ((TOTAL_FILES++))
        validate_file "$file"
    done
    
    # Check script permissions
    if [[ "${RULES}" == "all" ]]; then
        check_script_permissions
    fi
    
    # Generate migration plan if requested
    if [[ "${GENERATE_MIGRATION_PLAN}" == "true" ]]; then
        generate_migration_plan
    fi
    
    # Output results based on format
    case "${FORMAT}" in
        json)
            if [[ -n "${OUTPUT_FILE}" ]]; then
                output_json > "${OUTPUT_FILE}"
                [[ "${QUIET_MODE}" != "true" ]] && log_info "Results written to ${OUTPUT_FILE}"
            else
                output_json
            fi
            ;;
        github-actions)
            output_github_actions
            ;;
        junit)
            if [[ -n "${OUTPUT_FILE}" ]]; then
                output_junit > "${OUTPUT_FILE}"
                [[ "${QUIET_MODE}" != "true" ]] && log_info "Results written to ${OUTPUT_FILE}"
            else
                output_junit
            fi
            ;;
        console|*)
            output_console
            ;;
    esac
    
    # Determine exit code
    local exit_code=0
    if [[ ${VIOLATIONS_BY_SEVERITY["${SEVERITY_CRITICAL}"]:-0} -gt 0 ]]; then
        exit_code=3
    elif [[ ${TOTAL_VIOLATIONS} -gt 0 ]]; then
        exit_code=1
    fi
    
    if [[ "${FAIL_ON_VIOLATIONS}" == "true" && ${TOTAL_VIOLATIONS} -gt 0 ]]; then
        exit $exit_code
    fi
    
    exit 0
}

# Parse arguments and execute
parse_arguments "$@"
main