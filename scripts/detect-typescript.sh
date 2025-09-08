#!/bin/bash

# TypeScript code detection script for SHIROKUMA command files
# Detects TypeScript/JavaScript code blocks that need to be converted to YAML/Markdown

echo "=== TypeScript Code Detection Report ==="
echo "Date: $(date)"
echo ""

# Function to check file for TypeScript patterns
check_file() {
    local file="$1"
    local rel_path="${file#./}"
    
    # Check for TypeScript code fence blocks
    ts_blocks=$(grep -n "^\`\`\`typescript" "$file" 2>/dev/null | wc -l)
    js_blocks=$(grep -n "^\`\`\`javascript" "$file" 2>/dev/null | wc -l)
    
    # Check for inline TypeScript patterns
    has_import=$(grep -E "^import\s+\{|\simport\s+\{" "$file" 2>/dev/null | wc -l)
    has_const_func=$(grep -E "^const\s+\w+\s*=\s*(async\s+)?\(" "$file" 2>/dev/null | wc -l)
    has_function=$(grep -E "^(async\s+)?function\s+\w+" "$file" 2>/dev/null | wc -l)
    has_interface=$(grep -E "^interface\s+\w+" "$file" 2>/dev/null | wc -l)
    has_mcp_calls=$(grep -E "mcp\.\w+\(|create_item\(|search_items\(|get_item\(" "$file" 2>/dev/null | wc -l)
    has_task_tool=$(grep -E "Task\.tool\(|await\s+Task" "$file" 2>/dev/null | wc -l)
    
    total=$((ts_blocks + js_blocks + has_import + has_const_func + has_function + has_interface + has_mcp_calls + has_task_tool))
    
    if [ $total -gt 0 ]; then
        echo "## $rel_path"
        echo "   TypeScript blocks: $ts_blocks"
        echo "   JavaScript blocks: $js_blocks"
        if [ $has_import -gt 0 ]; then echo "   Import statements: $has_import"; fi
        if [ $has_const_func -gt 0 ]; then echo "   Const functions: $has_const_func"; fi
        if [ $has_function -gt 0 ]; then echo "   Function declarations: $has_function"; fi
        if [ $has_interface -gt 0 ]; then echo "   Interface declarations: $has_interface"; fi
        if [ $has_mcp_calls -gt 0 ]; then echo "   MCP API calls: $has_mcp_calls"; fi
        if [ $has_task_tool -gt 0 ]; then echo "   Task tool calls: $has_task_tool"; fi
        echo "   ---"
        
        # Show line numbers of code blocks
        if [ $ts_blocks -gt 0 ] || [ $js_blocks -gt 0 ]; then
            echo "   Code block locations:"
            grep -n "^\`\`\`\(typescript\|javascript\)" "$file" | head -5
        fi
        echo ""
        return 0
    fi
    return 1
}

# Check command files
echo "=== COMMAND FILES ==="
echo ""
files_with_code=0
for file in .shirokuma/commands/kuma/**/*.md .shirokuma/commands/kuma/*.md; do
    if [ -f "$file" ]; then
        if check_file "$file"; then
            ((files_with_code++))
        fi
    fi
done

# Check shared files
echo "=== SHARED FILES ==="
echo ""
for file in .shirokuma/commands/shared/*.markdown; do
    if [ -f "$file" ]; then
        if check_file "$file"; then
            ((files_with_code++))
        fi
    fi
done

# Check agent files
echo "=== AGENT FILES ==="
echo ""
for file in .claude/agents/*.md; do
    if [ -f "$file" ]; then
        if check_file "$file"; then
            ((files_with_code++))
        fi
    fi
done

echo "=== SUMMARY ==="
echo "Total files with TypeScript/JavaScript code: $files_with_code"
echo ""

# Generate conversion checklist
if [ $files_with_code -gt 0 ]; then
    echo "=== FILES REQUIRING CONVERSION ==="
    echo ""
    for file in .shirokuma/commands/kuma/**/*.md .shirokuma/commands/kuma/*.md .shirokuma/commands/shared/*.markdown .claude/agents/*.md; do
        if [ -f "$file" ]; then
            if grep -qE "\`\`\`(typescript|javascript)|import\s+\{|const\s+\w+\s*=|function\s+\w+|interface\s+\w+|mcp\.\w+|Task\.tool" "$file" 2>/dev/null; then
                echo "- [ ] ${file#./}"
            fi
        fi
    done
fi