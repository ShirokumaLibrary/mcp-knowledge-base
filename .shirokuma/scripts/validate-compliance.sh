#!/bin/bash
# Script: validate-compliance.sh
# Purpose: Validate script calling patterns compliance with SHIROKUMA guidelines
# Usage: .shirokuma/scripts/validate-compliance.sh [options]
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
QUIET_MODE="false"
FORMAT="console"
OUTPUT_FILE=""
SCAN_PATH="."
SEVERITY="warning"
MAX_DEPTH=""  # Empty means no limit

# Counters
TOTAL_FILES=0
TOTAL_VIOLATIONS=0
CRITICAL_VIOLATIONS=0
WARNING_VIOLATIONS=0
INFO_VIOLATIONS=0

# Source common utilities
source "${SCRIPT_DIR}/lib/common.sh"

# Regex patterns for validation
readonly PATTERN_VALID_CALL='\.shirokuma/scripts/[^/[:space:]]+\.sh'
readonly PATTERN_ABSOLUTE_PATH='[/~][^[:space:]]*/.shirokuma/scripts/[^/[:space:]]+\.sh'
readonly PATTERN_ENV_VARS='([A-Z_][A-Z0-9_]*=[^[:space:]]+[[:space:]]+)+\.shirokuma/scripts/'
readonly PATTERN_DYNAMIC_PATH='(\$\{[^}]+\}|\$[A-Z_][A-Z0-9_]*|\$\([^)]+\))[^[:space:]]*/\.shirokuma/scripts/'
readonly PATTERN_BASH_WRAPPER='\bbash[[:space:]]+\.shirokuma/scripts/[^/[:space:]]+\.sh'
readonly PATTERN_DIRECT_TOOLS='\.shirokuma/(tools|scripts/lib|scripts/modules)/[^/[:space:]]+\.sh'

# Help function
show_help() {
    cat << EOF
Usage: .shirokuma/scripts/${SCRIPT_NAME} [OPTIONS]

Description:
    Validates script calling patterns across the codebase to ensure compliance
    with SHIROKUMA Script Calling Guidelines. Detects violations such as absolute
    paths, environment variables, and direct tool calling.

Options:
    -h, --help              Show this help message
    --version               Show version information
    -d, --debug             Enable debug output
    -v, --verbose           Enable verbose output
    -q, --quiet             Suppress non-error output
    --scan-path=PATH        Path to scan (default: current directory)
    --format=FORMAT         Output format: console|json (default: console)
    --output=FILE           Write output to file instead of stdout
    --severity=LEVEL        Minimum severity: critical|warning|info (default: warning)
    --max-depth=N           Maximum directory depth to scan (default: unlimited)

Examples:
    # Basic usage - scan current directory
    .shirokuma/scripts/${SCRIPT_NAME}
    
    # Scan specific directory with verbose output
    .shirokuma/scripts/${SCRIPT_NAME} --scan-path=.claude/commands --verbose
    
    # Output violations in JSON format
    .shirokuma/scripts/${SCRIPT_NAME} --format=json --output=violations.json
    
    # Show only critical violations
    .shirokuma/scripts/${SCRIPT_NAME} --severity=critical

Exit Codes:
    0    No violations found
    1    Violations found
    2    Invalid arguments
    3    Critical violations found

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
                shift
                ;;
            -v|--verbose)
                VERBOSE_MODE="true"
                shift
                ;;
            -q|--quiet)
                QUIET_MODE="true"
                shift
                ;;
            --scan-path=*)
                SCAN_PATH="${1#*=}"
                if [[ ! -d "${SCAN_PATH}" ]]; then
                    log_fatal "Scan path does not exist: ${SCAN_PATH}"
                fi
                shift
                ;;
            --format=*)
                FORMAT="${1#*=}"
                if [[ ! "${FORMAT}" =~ ^(console|json)$ ]]; then
                    log_fatal "Invalid format: ${FORMAT}. Must be console or json."
                fi
                shift
                ;;
            --output=*)
                OUTPUT_FILE="${1#*=}"
                shift
                ;;
            --severity=*)
                SEVERITY="${1#*=}"
                if [[ ! "${SEVERITY}" =~ ^(critical|warning|info)$ ]]; then
                    log_fatal "Invalid severity: ${SEVERITY}. Must be critical, warning, or info."
                fi
                shift
                ;;
            --max-depth=*)
                MAX_DEPTH="${1#*=}"
                if ! [[ "${MAX_DEPTH}" =~ ^[0-9]+$ ]]; then
                    log_fatal "Invalid max-depth: ${MAX_DEPTH}. Must be a positive integer."
                fi
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

# Check if file should be scanned
should_scan_file() {
    local file="$1"
    
    # Skip known binary extensions first (performance optimization)
    if [[ "$file" =~ \.(jpg|jpeg|png|gif|pdf|zip|tar|gz|bz2|exe|dll|so|pyc|class|jar|war|ear)$ ]]; then
        return 1
    fi
    
    # Skip binary files (only for unknown extensions)
    local ext="${file##*.}"
    if [[ "$ext" != "sh" && "$ext" != "md" && "$ext" != "yml" && "$ext" != "yaml" && 
          "$ext" != "json" && "$ext" != "txt" && "$ext" != "xml" && "$ext" != "html" && 
          "$ext" != "css" && "$ext" != "js" && "$ext" != "ts" && "$ext" != "py" ]]; then
        if file --mime-type "$file" 2>/dev/null | grep -q "charset=binary"; then
            return 1
        fi
    fi
    
    # Skip certain directories
    if [[ "$file" =~ (node_modules|\.git|dist|build|coverage) ]]; then
        return 1
    fi
    
    
    # Include shell scripts, markdown, and configuration files
    if [[ "$file" =~ \.(sh|md|yml|yaml|json|txt)$ ]] || [[ -x "$file" ]]; then
        return 0
    fi
    
    # Include files in specific directories
    if [[ "$file" =~ ^\.claude/commands/ ]] || [[ "$file" =~ ^\.shirokuma/ ]]; then
        return 0
    fi
    
    return 1
}

# Validate a single file
validate_file() {
    local file="$1"
    local line_num=0
    local file_violations=0
    
    [[ "${DEBUG_MODE}" == "true" ]] && log_debug "Validating file: $file"
    
    while IFS= read -r line; do
        ((line_num++))
        
        # Skip empty lines and comments
        [[ -z "$line" ]] && continue
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Check for absolute paths (CRITICAL)
        if [[ "$line" =~ ${PATTERN_ABSOLUTE_PATH} ]]; then
            ((CRITICAL_VIOLATIONS++))
            ((file_violations++))
            if [[ "${QUIET_MODE}" != "true" ]]; then
                echo -e "${COLOR_RED}[CRITICAL]${COLOR_RESET} ${file}:${line_num}"
                echo "  Rule: ABSOLUTE_PATH"
                echo "  Line: ${line}"
                echo ""
            fi
        fi
        
        # Check for environment variables (CRITICAL)
        if [[ "$line" =~ ${PATTERN_ENV_VARS} ]]; then
            ((CRITICAL_VIOLATIONS++))
            ((file_violations++))
            if [[ "${QUIET_MODE}" != "true" ]]; then
                echo -e "${COLOR_RED}[CRITICAL]${COLOR_RESET} ${file}:${line_num}"
                echo "  Rule: ENV_VARS"
                echo "  Line: ${line}"
                echo ""
            fi
        fi
        
        # Check for dynamic paths (CRITICAL)
        if [[ "$line" =~ ${PATTERN_DYNAMIC_PATH} ]]; then
            ((CRITICAL_VIOLATIONS++))
            ((file_violations++))
            if [[ "${QUIET_MODE}" != "true" ]]; then
                echo -e "${COLOR_RED}[CRITICAL]${COLOR_RESET} ${file}:${line_num}"
                echo "  Rule: DYNAMIC_PATHS"
                echo "  Line: ${line}"
                echo ""
            fi
        fi
        
        # Check for bash wrapper (WARNING)
        if [[ "${SEVERITY}" != "critical" ]] && [[ "$line" =~ ${PATTERN_BASH_WRAPPER} ]]; then
            ((WARNING_VIOLATIONS++))
            ((file_violations++))
            if [[ "${QUIET_MODE}" != "true" ]]; then
                echo -e "${COLOR_YELLOW}[WARNING]${COLOR_RESET} ${file}:${line_num}"
                echo "  Rule: BASH_WRAPPER"
                echo "  Line: ${line}"
                echo ""
            fi
        fi
        
        # Check for direct tool calling (WARNING)
        if [[ "${SEVERITY}" != "critical" ]] && [[ "$line" =~ ${PATTERN_DIRECT_TOOLS} ]]; then
            ((WARNING_VIOLATIONS++))
            ((file_violations++))
            if [[ "${QUIET_MODE}" != "true" ]]; then
                echo -e "${COLOR_YELLOW}[WARNING]${COLOR_RESET} ${file}:${line_num}"
                echo "  Rule: DIRECT_TOOLS"
                echo "  Line: ${line}"
                echo ""
            fi
        fi
        
    done < "$file"
    
    [[ "${DEBUG_MODE}" == "true" ]] && log_debug "Finished processing $file, found $file_violations violations"
    
    if [[ "${VERBOSE_MODE}" == "true" ]] && [[ $file_violations -eq 0 ]]; then
        log_debug "✓ ${file} - No violations"
    fi
    
    # Update the global total
    ((TOTAL_VIOLATIONS += file_violations))
}

# Output JSON format
output_json() {
    local compliance_percentage
    if [[ $TOTAL_FILES -gt 0 ]]; then
        compliance_percentage=$(echo "scale=1; 100 - (100 * $TOTAL_VIOLATIONS / $TOTAL_FILES)" | bc 2>/dev/null || echo "0")
    else
        compliance_percentage="100.0"
    fi
    
    cat << EOF
{
  "validation_run": {
    "timestamp": "${SCRIPT_START_TIME}",
    "version": "${SCRIPT_VERSION}",
    "scan_path": "${SCAN_PATH}",
    "total_files_scanned": ${TOTAL_FILES},
    "total_violations": ${TOTAL_VIOLATIONS},
    "critical_violations": ${CRITICAL_VIOLATIONS},
    "warning_violations": ${WARNING_VIOLATIONS},
    "info_violations": ${INFO_VIOLATIONS}
  },
  "summary": {
    "compliance_percentage": ${compliance_percentage},
    "severity_filter": "${SEVERITY}"
  }
}
EOF
}

# Main function
main() {
    if [[ "${QUIET_MODE}" != "true" ]]; then
        log_info "Starting script compliance validation v${SCRIPT_VERSION}"
        log_info "Scanning path: ${SCAN_PATH}"
        [[ "${VERBOSE_MODE}" == "true" ]] && log_info "Severity filter: ${SEVERITY}"
    fi
    
    # Build find command with proper structure
    local files_to_scan=()
    
    # Simplified find approach for better reliability
    if [[ -n "${MAX_DEPTH}" ]]; then
        [[ "${DEBUG_MODE}" == "true" ]] && log_debug "Using maxdepth=${MAX_DEPTH}"
        mapfile -d '' found_files < <(find "${SCAN_PATH}" -maxdepth "${MAX_DEPTH}" -type f -print0 2>/dev/null)
    else
        [[ "${DEBUG_MODE}" == "true" ]] && log_debug "No maxdepth limit"
        mapfile -d '' found_files < <(find "${SCAN_PATH}" -type f -print0 2>/dev/null)
    fi
    
    # Filter files
    for file in "${found_files[@]}"; do
        if [[ -z "$file" ]]; then
            continue
        fi
        [[ "${DEBUG_MODE}" == "true" ]] && log_debug "Found file from find: $file"
        if should_scan_file "$file"; then
            [[ "${DEBUG_MODE}" == "true" ]] && log_debug "File passes should_scan: $file"
            files_to_scan+=("$file")
        else
            [[ "${DEBUG_MODE}" == "true" ]] && log_debug "File skipped by should_scan: $file"
        fi
    done
    
    [[ "${VERBOSE_MODE}" == "true" ]] && log_info "Found ${#files_to_scan[@]} files to scan"
    
    # Debug: Show files found
    if [[ "${DEBUG_MODE}" == "true" ]]; then
        log_debug "Files to scan:"
        for f in "${files_to_scan[@]}"; do
            log_debug "  - $f"
        done
        log_debug "Starting validation loop..."
    fi
    
    # Validate each file
    [[ "${DEBUG_MODE}" == "true" ]] && log_debug "Array size: ${#files_to_scan[@]}"
    for file in "${files_to_scan[@]}"; do
        [[ "${DEBUG_MODE}" == "true" ]] && log_debug "Processing file from array: $file"
        ((TOTAL_FILES++))
        [[ "${DEBUG_MODE}" == "true" ]] && log_debug "About to validate file: $file"
        # Call validate_file directly - it will update the global violation counters
        validate_file "$file"
        [[ "${DEBUG_MODE}" == "true" ]] && log_debug "Completed validation of file: $file"
    done
    [[ "${DEBUG_MODE}" == "true" ]] && log_debug "Finished validation loop"
    
    # Output results based on format
    if [[ "${FORMAT}" == "json" ]]; then
        if [[ -n "${OUTPUT_FILE}" ]]; then
            output_json > "${OUTPUT_FILE}"
            [[ "${QUIET_MODE}" != "true" ]] && log_info "Results written to ${OUTPUT_FILE}"
        else
            output_json
        fi
    else
        # Console format summary
        if [[ "${QUIET_MODE}" != "true" ]]; then
            echo ""
            echo "========================================="
            echo "VALIDATION SUMMARY"
            echo "========================================="
            echo "Files scanned:        ${TOTAL_FILES}"
            echo "Total violations:     ${TOTAL_VIOLATIONS}"
            echo "  Critical:          ${CRITICAL_VIOLATIONS}"
            echo "  Warning:           ${WARNING_VIOLATIONS}"
            echo "  Info:              ${INFO_VIOLATIONS}"
            echo "========================================="
            
            if [[ ${TOTAL_VIOLATIONS} -eq 0 ]]; then
                log_success "✓ No violations found! All script calls are compliant."
            else
                if [[ ${CRITICAL_VIOLATIONS} -gt 0 ]]; then
                    log_error "✗ Found ${CRITICAL_VIOLATIONS} critical violations that must be fixed."
                elif [[ ${WARNING_VIOLATIONS} -gt 0 ]]; then
                    log_warn "⚠ Found ${WARNING_VIOLATIONS} warning violations that should be addressed."
                fi
                echo ""
                echo "Run with --help to see how to fix violations."
                echo "See .shirokuma/docs/script-guidelines.md for complete guidelines."
            fi
        fi
    fi
    
    # Exit with appropriate code
    if [[ ${CRITICAL_VIOLATIONS} -gt 0 ]]; then
        exit 3
    elif [[ ${TOTAL_VIOLATIONS} -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Parse arguments and execute
parse_arguments "$@"
main