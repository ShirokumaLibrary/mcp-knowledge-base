#!/bin/bash
# Mock Environment Setup for Pre-flight Check Testing
# Creates mock npm commands and test scenarios for comprehensive testing

set -euo pipefail

# ========================================
# Configuration
# ========================================

readonly MOCK_DIR="/tmp/preflight-mock-$$"
readonly ORIGINAL_PATH="$PATH"

# Create mock directory
mkdir -p "${MOCK_DIR}/bin"

# ========================================
# Mock Command Creation
# ========================================

# Create a mock npm command that can simulate different behaviors
create_mock_npm() {
  local behavior="${1:-success}"
  
  cat > "${MOCK_DIR}/bin/npm" <<'EOF'
#!/bin/bash
# Mock npm command for testing

# Parse the command
COMMAND="$1"
shift

case "$COMMAND" in
  "run")
    SCRIPT="$1"
    shift
    
    # Check for behavior control via environment variable
    case "${NPM_MOCK_BEHAVIOR:-success}" in
      "success")
        echo "Mock: npm run $SCRIPT completed successfully"
        exit 0
        ;;
      "fail")
        echo "Mock: npm run $SCRIPT failed" >&2
        exit 1
        ;;
      "timeout")
        echo "Mock: npm run $SCRIPT starting..."
        sleep 300  # Sleep for 5 minutes to trigger timeout
        ;;
      "slow")
        echo "Mock: npm run $SCRIPT running slowly..."
        sleep 2
        echo "Mock: npm run $SCRIPT completed"
        exit 0
        ;;
      "error")
        echo "Mock: npm run $SCRIPT encountered an error" >&2
        exit 5
        ;;
      "missing-dep")
        echo "Mock: Cannot find module 'some-dependency'" >&2
        exit 7
        ;;
      *)
        echo "Mock: Unknown behavior: ${NPM_MOCK_BEHAVIOR}" >&2
        exit 1
        ;;
    esac
    ;;
    
  "test")
    case "${NPM_MOCK_BEHAVIOR:-success}" in
      "success")
        cat <<TEST_OUTPUT
> shirokuma-knowledge-base@1.0.0 test
> jest

PASS  src/test1.spec.ts
PASS  src/test2.spec.ts
PASS  src/test3.spec.ts

Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        2.345s
TEST_OUTPUT
        exit 0
        ;;
      "fail")
        cat <<TEST_FAIL >&2
> shirokuma-knowledge-base@1.0.0 test
> jest

FAIL  src/test1.spec.ts
  ● Test suite failed

Test Suites: 1 failed, 2 passed, 3 total
Tests:       1 failed, 14 passed, 15 total
TEST_FAIL
        exit 1
        ;;
      *)
        exit 1
        ;;
    esac
    ;;
    
  *)
    echo "Mock npm: $COMMAND $*"
    exit 0
    ;;
esac
EOF
  
  chmod +x "${MOCK_DIR}/bin/npm"
}

# Create a mock git command for testing markdown detection
create_mock_git() {
  cat > "${MOCK_DIR}/bin/git" <<'EOF'
#!/bin/bash
# Mock git command for testing

case "$1" in
  "diff")
    # Check for markdown-only behavior
    case "${GIT_MOCK_BEHAVIOR:-mixed}" in
      "markdown-only")
        echo "README.md"
        echo "docs/guide.md"
        ;;
      "mixed")
        echo "README.md"
        echo "src/index.ts"
        ;;
      "code-only")
        echo "src/index.ts"
        echo "src/utils.ts"
        ;;
      *)
        ;;
    esac
    ;;
  "status")
    echo "On branch main"
    echo "nothing to commit, working tree clean"
    ;;
  *)
    # Pass through to real git for other commands
    /usr/bin/git "$@"
    ;;
esac
EOF
  
  chmod +x "${MOCK_DIR}/bin/git"
}

# ========================================
# Test Scenario Setup
# ========================================

# Setup environment for testing
setup_test_environment() {
  local scenario="${1:-default}"
  
  echo "Setting up test environment: $scenario"
  
  # Add mock directory to PATH
  export PATH="${MOCK_DIR}/bin:${ORIGINAL_PATH}"
  
  case "$scenario" in
    "all-pass")
      export NPM_MOCK_BEHAVIOR="success"
      export GIT_MOCK_BEHAVIOR="mixed"
      ;;
      
    "build-fail")
      export NPM_MOCK_BEHAVIOR="fail"
      export GIT_MOCK_BEHAVIOR="mixed"
      ;;
      
    "timeout")
      export NPM_MOCK_BEHAVIOR="timeout"
      export GIT_MOCK_BEHAVIOR="mixed"
      ;;
      
    "markdown-only")
      export NPM_MOCK_BEHAVIOR="success"
      export GIT_MOCK_BEHAVIOR="markdown-only"
      ;;
      
    "slow-execution")
      export NPM_MOCK_BEHAVIOR="slow"
      export GIT_MOCK_BEHAVIOR="mixed"
      ;;
      
    "missing-dependency")
      export NPM_MOCK_BEHAVIOR="missing-dep"
      export GIT_MOCK_BEHAVIOR="mixed"
      ;;
      
    *)
      export NPM_MOCK_BEHAVIOR="success"
      export GIT_MOCK_BEHAVIOR="mixed"
      ;;
  esac
  
  # Create mock commands
  create_mock_npm
  create_mock_git
  
  echo "Mock environment ready at: ${MOCK_DIR}"
  echo "NPM behavior: ${NPM_MOCK_BEHAVIOR}"
  echo "Git behavior: ${GIT_MOCK_BEHAVIOR}"
}

# Cleanup mock environment
cleanup_test_environment() {
  echo "Cleaning up mock environment..."
  
  # Restore original PATH
  export PATH="${ORIGINAL_PATH}"
  
  # Remove mock directory
  rm -rf "${MOCK_DIR}"
  
  # Unset mock variables
  unset NPM_MOCK_BEHAVIOR
  unset GIT_MOCK_BEHAVIOR
  
  echo "Mock environment cleaned up"
}

# ========================================
# Test Execution Helper
# ========================================

run_with_mock() {
  local scenario="$1"
  shift
  local command="$@"
  
  # Setup mock environment
  setup_test_environment "$scenario"
  
  # Run the command
  local exit_code=0
  $command || exit_code=$?
  
  # Cleanup
  cleanup_test_environment
  
  return $exit_code
}

# ========================================
# Main
# ========================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  # Script is being run directly
  
  case "${1:-help}" in
    "setup")
      setup_test_environment "${2:-default}"
      echo "Run 'source $0' to use the mock environment"
      ;;
      
    "cleanup")
      cleanup_test_environment
      ;;
      
    "run")
      shift
      scenario="${1:-default}"
      shift
      run_with_mock "$scenario" "$@"
      ;;
      
    "help"|*)
      cat <<HELP
Mock Environment for Pre-flight Check Testing

Usage:
  $(basename "$0") setup [scenario]     Setup mock environment
  $(basename "$0") cleanup              Cleanup mock environment
  $(basename "$0") run [scenario] cmd   Run command with mock environment
  
Scenarios:
  all-pass           All npm commands succeed
  build-fail         Build command fails
  timeout            Commands timeout
  markdown-only      Only markdown files changed
  slow-execution     Commands run slowly but succeed
  missing-dependency Missing npm dependencies

Example:
  $(basename "$0") run build-fail ./preflight-check.sh
  
Or source this script to use interactively:
  source $(basename "$0")
  setup_test_environment "build-fail"
  # Run your tests
  cleanup_test_environment
HELP
      ;;
  esac
fi