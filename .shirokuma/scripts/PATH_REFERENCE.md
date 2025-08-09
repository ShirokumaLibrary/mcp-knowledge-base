# Path Reference Guide for Pre-flight Scripts

## Consistent Path Usage

### Standard Variables
```bash
# Always define at the top of your script
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
```

### Referencing Scripts

#### ✅ CORRECT - Using variables
```bash
"${SCRIPT_DIR}/preflight-check.sh"
"${SCRIPT_DIR}/modules/build-check.sh"
"${SCRIPT_DIR}/test-preflight.sh"
```

#### ❌ INCORRECT - Hardcoded or relative paths
```bash
./.shirokuma/scripts/preflight-check.sh        # Relative path
/absolute/path/.shirokuma/scripts/test.sh      # Hardcoded absolute
../scripts/modules/build-check.sh              # Complex relative
```

### Example Usage in Tests

```bash
#!/bin/bash
set -euo pipefail

# Define once at the top
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Use consistently throughout
test_build_module() {
  "${SCRIPT_DIR}/modules/build-check.sh" --help
}

test_main_script() {
  "${SCRIPT_DIR}/preflight-check.sh" --version
}
```

## Benefits of Consistent Paths

1. **Portability**: Scripts work regardless of where they're called from
2. **Maintainability**: Easy to move or rename directories
3. **Clarity**: Clear what's being referenced
4. **CI/CD Compatibility**: Works in different environments

## Quick Reference

| Component | Path Variable |
|-----------|--------------|
| Main script | `${SCRIPT_DIR}/preflight-check.sh` |
| Build module | `${SCRIPT_DIR}/modules/build-check.sh` |
| Test module | `${SCRIPT_DIR}/modules/test-check.sh` |
| Lint module | `${SCRIPT_DIR}/modules/lint-check.sh` |
| Checkpoint module | `${SCRIPT_DIR}/modules/checkpoint-create.sh` |
| Test scripts | `${SCRIPT_DIR}/test-*.sh` |
| Project root | `${PROJECT_ROOT}` |
