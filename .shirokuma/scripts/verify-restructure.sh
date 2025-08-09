#!/bin/bash
# verify-restructure.sh - Configuration restructure verification script

echo "=== Configuration Restructure Verification ==="
echo "Date: $(date)"
echo ""

# Initialize error counter
ERRORS=0
WARNINGS=0

# 1. Check that rules directory exists
echo "1. Checking rules directory..."
if [[ -d .shirokuma/rules ]]; then
    echo "   ✅ rules directory exists"
else
    echo "   ❌ ERROR: rules directory not found"
    ((ERRORS++))
fi

# 2. Check that moved files exist in rules
echo "2. Checking files in rules directory..."
for file in tdd-methodology.md mcp-rules.md; do
    if [[ -f .shirokuma/rules/$file ]]; then
        LINES=$(wc -l < .shirokuma/rules/$file)
        echo "   ✅ $file exists ($LINES lines)"
    else
        echo "   ❌ ERROR: $file not found in rules/"
        ((ERRORS++))
    fi
done

# 3. Check that old references are removed (excluding .bak files)
echo "3. Checking for old references..."
OLD_TDD_REFS=$(grep -r "@\.shirokuma/configs/tdd-methodology\.md" .claude/ --exclude="*.bak" 2>/dev/null | wc -l)
OLD_MCP_REFS=$(grep -r "@\.shirokuma/configs/mcp-rules\.md" .claude/ --exclude="*.bak" 2>/dev/null | wc -l)

if [[ $OLD_TDD_REFS -eq 0 ]] && [[ $OLD_MCP_REFS -eq 0 ]]; then
    echo "   ✅ No old references found"
else
    echo "   ❌ ERROR: Found old references"
    [[ $OLD_TDD_REFS -gt 0 ]] && echo "      - tdd-methodology: $OLD_TDD_REFS references"
    [[ $OLD_MCP_REFS -gt 0 ]] && echo "      - mcp-rules: $OLD_MCP_REFS references"
    ((ERRORS++))
fi

# 4. Check that new references exist
echo "4. Checking new references..."
NEW_TDD_REFS=$(grep -r "@\.shirokuma/rules/tdd-methodology\.md" .claude/ 2>/dev/null | wc -l)
NEW_MCP_REFS=$(grep -r "@\.shirokuma/rules/mcp-rules\.md" .claude/ 2>/dev/null | wc -l)
EXPECTED_MIN=8  # Minimum expected references

if [[ $NEW_TDD_REFS -ge $EXPECTED_MIN ]] && [[ $NEW_MCP_REFS -ge $EXPECTED_MIN ]]; then
    echo "   ✅ New references found"
    echo "      - tdd-methodology: $NEW_TDD_REFS references"
    echo "      - mcp-rules: $NEW_MCP_REFS references"
else
    echo "   ⚠️  WARNING: Fewer references than expected"
    echo "      - tdd-methodology: $NEW_TDD_REFS references (expected >= $EXPECTED_MIN)"
    echo "      - mcp-rules: $NEW_MCP_REFS references (expected >= $EXPECTED_MIN)"
    ((WARNINGS++))
fi

# 5. Check file content integrity
echo "5. Checking file content integrity..."
if [[ -f .shirokuma/configs.backup/tdd-methodology.md ]] && [[ -f .shirokuma/rules/tdd-methodology.md ]]; then
    if diff -q .shirokuma/configs.backup/tdd-methodology.md .shirokuma/rules/tdd-methodology.md > /dev/null; then
        echo "   ✅ tdd-methodology.md content matches original"
    else
        echo "   ❌ ERROR: tdd-methodology.md content differs from original"
        ((ERRORS++))
    fi
fi

if [[ -f .shirokuma/configs.backup/mcp-rules.md ]] && [[ -f .shirokuma/rules/mcp-rules.md ]]; then
    if diff -q .shirokuma/configs.backup/mcp-rules.md .shirokuma/rules/mcp-rules.md > /dev/null; then
        echo "   ✅ mcp-rules.md content matches original"
    else
        echo "   ❌ ERROR: mcp-rules.md content differs from original"
        ((ERRORS++))
    fi
fi

# 6. Check that old files still exist (for now)
echo "6. Checking cleanup status..."
if [[ -f .shirokuma/configs/tdd-methodology.md ]] || [[ -f .shirokuma/configs/mcp-rules.md ]]; then
    echo "   ⚠️  Old files still exist in configs/ (cleanup pending)"
    echo "      To remove: rm .shirokuma/configs/tdd-methodology.md .shirokuma/configs/mcp-rules.md"
    ((WARNINGS++))
else
    echo "   ✅ Old files removed from configs/"
fi

# Summary
echo ""
echo "=== Verification Summary ==="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"

if [[ $ERRORS -eq 0 ]]; then
    echo ""
    echo "✅ Verification PASSED - Configuration restructure successful!"
    echo ""
    echo "Next steps:"
    echo "1. Test a few commands to ensure they work correctly"
    echo "2. Remove old files: rm .shirokuma/configs/tdd-methodology.md .shirokuma/configs/mcp-rules.md"
    echo "3. Clean up backup files: find . -name '*.bak' -delete"
    exit 0
else
    echo ""
    echo "❌ Verification FAILED - $ERRORS error(s) found"
    echo ""
    echo "To rollback:"
    echo "1. Restore from .bak files: for f in .claude/**/*.bak; do mv \"\$f\" \"\${f%.bak}\"; done"
    echo "2. Restore configs: cp .shirokuma/configs.backup/* .shirokuma/configs/"
    echo "3. Remove rules directory: rm -rf .shirokuma/rules"
    exit 1
fi