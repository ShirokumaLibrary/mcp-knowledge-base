#!/bin/bash

# checkpoint-manager.sh - Checkpoint Management Script
# Creates, restores, and manages project checkpoints for safe rollback

set -e

# Default values
COMMAND=""
CHECKPOINT_NAME=""
PROJECT_DIR=""
FORMAT="text"
FORCE=false
VERBOSE=false
ALL=false

# Function to sanitize input
sanitize_input() {
    local input="$1"
    # Remove potentially dangerous characters
    echo "${input//[^a-zA-Z0-9._\/-]/}"
}

# Function to validate path
validate_path() {
    local path="$1"
    # Ensure path doesn't contain .. or start with / (unless it's PWD)
    if [[ "$path" == *".."* ]] || [[ "$path" == /* && "$path" != "$PWD"* ]]; then
        echo "Invalid path: $path" >&2
        exit 1
    fi
    echo "$path"
}

# Color support detection
if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]] && [[ "${TERM:-}" != "dumb" ]] && [[ -z "${CI:-}" ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# Parse command line arguments
COMMAND="$1"
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        --name)
            CHECKPOINT_NAME=$(sanitize_input "$2")
            shift; shift
            ;;
        --project)
            PROJECT_DIR=$(validate_path "$2")
            shift; shift
            ;;
        --format)
            FORMAT=$(sanitize_input "$2")
            if [[ "$FORMAT" != "text" && "$FORMAT" != "json" ]]; then
                echo "Invalid format: $FORMAT" >&2
                exit 1
            fi
            shift; shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --all)
            ALL=true
            shift
            ;;
        --phase)
            PHASE=$(sanitize_input "$2")
            shift; shift
            ;;
        --description)
            DESCRIPTION=$(sanitize_input "$2")
            shift; shift
            ;;
        --no-color)
            # No color output
            export NO_COLOR=1
            RED=''
            GREEN=''
            YELLOW=''
            BLUE=''
            NC=''
            shift
            ;;
        --ci)
            # CI mode
            export CI=true
            RED=''
            GREEN=''
            YELLOW=''
            BLUE=''
            NC=''
            shift
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

# Set project directory (use current directory if not specified)
if [[ -z "$PROJECT_DIR" ]]; then
    PROJECT_DIR="."
fi

# Set checkpoint directory
CHECKPOINT_DIR="$PROJECT_DIR/.checkpoints"

# Ensure checkpoint directory exists
mkdir -p "$CHECKPOINT_DIR"

# Function to generate timestamp-based checkpoint name
generate_checkpoint_name() {
    echo "checkpoint-$(date +%Y%m%d-%H%M%S)"
}

# Function to create checkpoint
create_checkpoint() {
    local name="$1"
    
    # Generate name if not provided
    if [[ -z "$name" ]]; then
        name=$(generate_checkpoint_name)
    fi
    
    local checkpoint_path="$CHECKPOINT_DIR/$name"
    
    # Check if checkpoint already exists
    if [[ -d "$checkpoint_path" ]]; then
        echo "Checkpoint already exists: $name" >&2
        exit 1
    fi
    
    # Create checkpoint directory
    mkdir -p "$checkpoint_path"
    
    # Check if git repo and use git stash for safety
    local git_stash_ref=""
    if [[ -d "$PROJECT_DIR/.git" ]] && command -v git &> /dev/null; then
        # Create a temporary stash
        git_stash_ref=$(cd "$PROJECT_DIR" && git stash create "Checkpoint: $name" 2>/dev/null || echo "")
    fi
    
    # Create metadata with git info
    cat > "$checkpoint_path/metadata.json" <<EOF
{
  "name": "$name",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "phase": "${PHASE:-unknown}",
  "description": "${DESCRIPTION:-Checkpoint created}",
  "git_stash_ref": "$git_stash_ref",
  "files": []
}
EOF
    
    # Create tar archive of project files
    local tar_file="$checkpoint_path/checkpoint.tar.gz"
    if command -v tar &> /dev/null; then
        # Create tar archive excluding .git, node_modules, and .checkpoints
        (cd "$PROJECT_DIR" && tar czf "$tar_file" \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.checkpoints' \
            --exclude='*.log' \
            --exclude='dist' \
            --exclude='build' \
            . 2>/dev/null || true)
    else
        # Fallback to cp if tar is not available
        if [[ -d "$PROJECT_DIR/src" ]]; then
            cp -r "$PROJECT_DIR/src" "$checkpoint_path/" 2>/dev/null || true
        fi
        if [[ -d "$PROJECT_DIR/tests" ]]; then
            cp -r "$PROJECT_DIR/tests" "$checkpoint_path/" 2>/dev/null || true
        fi
        
        # Copy individual files in project root
        find "$PROJECT_DIR" -maxdepth 1 -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" \) -exec cp {} "$checkpoint_path/" \; 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Checkpoint created: $name${NC}"
    
    if [[ "$VERBOSE" == true ]]; then
        echo "  Archive: $tar_file"
        if [[ -n "$git_stash_ref" ]]; then
            echo "  Git stash: $git_stash_ref"
        fi
    fi
    
    echo "Checkpoint '$name' created successfully"
}

# Function to restore checkpoint
restore_checkpoint() {
    local name="$1"
    
    if [[ -z "$name" ]]; then
        echo "Checkpoint name is required for restore" >&2
        exit 1
    fi
    
    local checkpoint_path="$CHECKPOINT_DIR/$name"
    
    # Check if checkpoint exists
    if [[ ! -d "$checkpoint_path" ]]; then
        echo "Checkpoint not found: $name" >&2
        exit 1
    fi
    
    # Create backup before restore (unless forced)
    if [[ "$FORCE" != true ]]; then
        local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
        create_checkpoint "$backup_name"
    fi
    
    # Restore from tar archive if it exists
    local tar_file="$checkpoint_path/checkpoint.tar.gz"
    if [[ -f "$tar_file" ]] && command -v tar &> /dev/null; then
        # Clean project directory (preserve .git and node_modules)
        find "$PROJECT_DIR" -maxdepth 1 \( -name "*.ts" -o -name "*.js" -o -name "*.json" \) -not -name "package-lock.json" -delete 2>/dev/null || true
        if [[ -d "$PROJECT_DIR/src" ]]; then
            rm -rf "$PROJECT_DIR/src" 2>/dev/null || true
        fi
        if [[ -d "$PROJECT_DIR/tests" ]]; then
            rm -rf "$PROJECT_DIR/tests" 2>/dev/null || true
        fi
        
        # Extract tar archive
        (cd "$PROJECT_DIR" && tar xzf "$tar_file" 2>/dev/null || {
            echo "Failed to extract checkpoint archive" >&2
            exit 1
        })
    else
        # Fallback to file copy if no tar archive
        if [[ -d "$checkpoint_path/src" ]]; then
            rm -rf "$PROJECT_DIR/src" 2>/dev/null || true
            cp -r "$checkpoint_path/src" "$PROJECT_DIR/" 2>/dev/null || true
        fi
        if [[ -d "$checkpoint_path/tests" ]]; then
            rm -rf "$PROJECT_DIR/tests" 2>/dev/null || true
            cp -r "$checkpoint_path/tests" "$PROJECT_DIR/" 2>/dev/null || true
        fi
        
        # Restore individual files
        find "$checkpoint_path" -maxdepth 1 -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" \) -not -name "metadata.json" -exec cp {} "$PROJECT_DIR/" \; 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Checkpoint restored: $name${NC}"
    
    if [[ "$VERBOSE" == true ]]; then
        echo "  Restored from: $checkpoint_path"
    fi
}

# Function to list checkpoints
list_checkpoints() {
    local checkpoints_found=false
    
    if [[ "$FORMAT" == "json" ]]; then
        echo "["
        local first=true
    fi
    
    for checkpoint in "$CHECKPOINT_DIR"/*; do
        if [[ -d "$checkpoint" ]] && [[ -f "$checkpoint/metadata.json" ]]; then
            checkpoints_found=true
            local name=$(basename "$checkpoint")
            
            if [[ "$FORMAT" == "json" ]]; then
                if [[ "$first" != true ]]; then
                    echo ","
                fi
                echo -n "  {\"name\": \"$name\", \"metadata\": "
                cat "$checkpoint/metadata.json"
                echo -n "}"
                first=false
            elif [[ "$VERBOSE" == true ]]; then
                local timestamp=$(grep '"timestamp"' "$checkpoint/metadata.json" | cut -d'"' -f4)
                local phase=$(grep '"phase"' "$checkpoint/metadata.json" | cut -d'"' -f4)
                local size=$(du -sh "$checkpoint" 2>/dev/null | cut -f1)
                echo "• $name"
                echo "  timestamp: $timestamp"
                echo "  phase: $phase"
                echo "  size: $size"
            else
                echo "$name"
            fi
        fi
    done
    
    if [[ "$FORMAT" == "json" ]]; then
        echo ""
        echo "]"
    elif [[ "$checkpoints_found" == false ]]; then
        echo "No checkpoints found"
    fi
}

# Function to delete checkpoint
delete_checkpoint() {
    local name="$1"
    
    if [[ "$ALL" == true ]]; then
        # Delete all checkpoints
        if [[ "$FORCE" != true ]]; then
            echo "Are you sure you want to delete all checkpoints? Use --force to confirm" >&2
            exit 1
        fi
        
        rm -rf "$CHECKPOINT_DIR"/*
        echo "All checkpoints deleted"
    else
        # Delete specific checkpoint
        if [[ -z "$name" ]]; then
            echo "Checkpoint name is required for delete (or use --all)" >&2
            exit 1
        fi
        
        local checkpoint_path="$CHECKPOINT_DIR/$name"
        
        if [[ ! -d "$checkpoint_path" ]]; then
            echo "Checkpoint not found: $name" >&2
            exit 1
        fi
        
        rm -rf "$checkpoint_path"
        echo "Checkpoint deleted: $name"
    fi
}

# Function to compare with checkpoint
compare_checkpoint() {
    local name="$1"
    
    if [[ -z "$name" ]]; then
        echo "Checkpoint name is required for compare" >&2
        exit 1
    fi
    
    local checkpoint_path="$CHECKPOINT_DIR/$name"
    
    if [[ ! -d "$checkpoint_path" ]]; then
        echo "Checkpoint not found: $name" >&2
        exit 1
    fi
    
    local has_changes=false
    local tar_file="$checkpoint_path/checkpoint.tar.gz"
    local temp_extract_dir=""
    
    # If tar archive exists, extract it to temporary directory for comparison
    if [[ -f "$tar_file" ]] && command -v tar &> /dev/null; then
        temp_extract_dir=$(mktemp -d)
        (cd "$temp_extract_dir" && tar xzf "$tar_file" 2>/dev/null)
        checkpoint_path="$temp_extract_dir"
    fi
    
    # Check for modified and added files
    for file in "$PROJECT_DIR"/*.ts "$PROJECT_DIR"/*.js "$PROJECT_DIR"/*.json; do
        if [[ -f "$file" ]]; then
            local basename=$(basename "$file")
            # Skip metadata.json and package-lock.json
            if [[ "$basename" == "metadata.json" ]] || [[ "$basename" == "package-lock.json" ]]; then
                continue
            fi
            
            local checkpoint_file="$checkpoint_path/$basename"
            
            if [[ -f "$checkpoint_file" ]]; then
                if ! cmp -s "$file" "$checkpoint_file"; then
                    echo "Modified: $basename"
                    has_changes=true
                fi
            else
                echo "Added: $basename"
                has_changes=true
            fi
        fi
    done
    
    # Check for deleted files
    for file in "$checkpoint_path"/*.ts "$checkpoint_path"/*.js "$checkpoint_path"/*.json; do
        if [[ -f "$file" ]]; then
            local basename=$(basename "$file")
            # Skip metadata.json and package-lock.json
            if [[ "$basename" == "metadata.json" ]] || [[ "$basename" == "package-lock.json" ]]; then
                continue
            fi
            
            local current_file="$PROJECT_DIR/$basename"
            
            if [[ ! -f "$current_file" ]]; then
                echo "Deleted: $basename"
                has_changes=true
            fi
        fi
    done
    
    # Clean up temporary directory if created
    if [[ -n "$temp_extract_dir" ]] && [[ -d "$temp_extract_dir" ]]; then
        rm -rf "$temp_extract_dir"
    fi
    
    if [[ "$has_changes" == false ]]; then
        echo "No differences found"
    fi
}

# Main execution based on command
case "$COMMAND" in
    create)
        create_checkpoint "$CHECKPOINT_NAME"
        ;;
    restore)
        restore_checkpoint "$CHECKPOINT_NAME"
        ;;
    list)
        list_checkpoints
        ;;
    delete)
        delete_checkpoint "$CHECKPOINT_NAME"
        ;;
    compare)
        compare_checkpoint "$CHECKPOINT_NAME"
        ;;
    *)
        echo "Usage: $0 {create|restore|list|delete|compare} [options]" >&2
        echo "Options:" >&2
        echo "  --name <name>      Checkpoint name" >&2
        echo "  --project <dir>    Project directory" >&2
        echo "  --format <format>  Output format (text|json)" >&2
        echo "  --force            Skip confirmations" >&2
        echo "  --verbose          Verbose output" >&2
        echo "  --all              Apply to all checkpoints" >&2
        echo "  --no-color         Disable color output" >&2
        echo "  --ci               CI mode (no colors)" >&2
        exit 1
        ;;
esac