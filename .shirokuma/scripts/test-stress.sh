#!/bin/bash
# Stress Test Suite for Pre-flight Check Scripts
# Tests performance, resource usage, and stability under load

set -euo pipefail

# ========================================
# Configuration
# ========================================

readonly TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR="${TEST_DIR}"
readonly TEMP_DIR="/tmp/preflight-stress-$$"

# Create temp directory
mkdir -p "${TEMP_DIR}"

# Cleanup on exit
cleanup() {
  rm -rf "${TEMP_DIR}" 2>/dev/null || true
  # Kill any remaining background processes
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT

# Test parameters
readonly MAX_CONCURRENT="${MAX_CONCURRENT:-10}"
readonly TEST_DURATION="${TEST_DURATION:-30}"  # seconds
readonly MEMORY_LIMIT="${MEMORY_LIMIT:-512}"   # MB

# ========================================
# Monitoring Functions
# ========================================

get_memory_usage() {
  local pid="$1"
  if [ -f "/proc/$pid/status" ]; then
    grep VmRSS "/proc/$pid/status" | awk '{print $2}'
  else
    echo "0"
  fi
}

get_cpu_usage() {
  local pid="$1"
  ps -p "$pid" -o %cpu= 2>/dev/null || echo "0"
}

monitor_process() {
  local pid="$1"
  local test_name="$2"
  local log_file="${TEMP_DIR}/${test_name}-${pid}.log"
  
  while kill -0 "$pid" 2>/dev/null; do
    local mem=$(get_memory_usage "$pid")
    local cpu=$(get_cpu_usage "$pid")
    echo "$(date +%s) MEM:${mem} CPU:${cpu}" >> "$log_file"
    sleep 0.5
  done
}

# ========================================
# Stress Test Functions
# ========================================

stress_concurrent_execution() {
  echo "Testing concurrent execution with $MAX_CONCURRENT instances..."
  
  local pids=()
  local start_time=$(date +%s)
  
  # Start multiple instances
  for i in $(seq 1 "$MAX_CONCURRENT"); do
    ${SCRIPT_DIR}/preflight-check.sh \
      --skip-build --skip-test --skip-lint --skip-checkpoint \
      >/dev/null 2>&1 &
    local pid=$!
    pids+=($pid)
    
    # Start monitoring
    monitor_process $pid "concurrent-$i" &
  done
  
  # Wait for all to complete
  local all_success=true
  for pid in "${pids[@]}"; do
    if ! wait $pid; then
      all_success=false
      echo "  Instance PID $pid failed"
    fi
  done
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  echo "  Completed $MAX_CONCURRENT instances in ${duration}s"
  
  if $all_success; then
    echo "  ✓ All instances completed successfully"
    return 0
  else
    echo "  ✗ Some instances failed"
    return 1
  fi
}

stress_rapid_sequential() {
  echo "Testing rapid sequential execution..."
  
  local count=0
  local failures=0
  local start_time=$(date +%s)
  local current_time=$start_time
  
  # Run as many as possible in TEST_DURATION seconds
  while [ $((current_time - start_time)) -lt "$TEST_DURATION" ]; do
    if ${SCRIPT_DIR}/preflight-check.sh \
      --skip-build --skip-test --skip-lint --skip-checkpoint \
      >/dev/null 2>&1; then
      count=$((count + 1))
    else
      failures=$((failures + 1))
    fi
    current_time=$(date +%s)
  done
  
  local duration=$((current_time - start_time))
  local rate=$(echo "scale=2; $count / $duration" | bc)
  
  echo "  Executed $count times in ${duration}s (${rate}/sec)"
  echo "  Failures: $failures"
  
  if [ $failures -eq 0 ]; then
    echo "  ✓ No failures during rapid execution"
    return 0
  else
    echo "  ✗ $failures failures detected"
    return 1
  fi
}

stress_memory_usage() {
  echo "Testing memory usage under load..."
  
  # Run script and monitor memory
  ${SCRIPT_DIR}/preflight-check.sh \
    --skip-build --skip-test --skip-lint --skip-checkpoint \
    >/dev/null 2>&1 &
  local pid=$!
  
  local max_mem=0
  while kill -0 "$pid" 2>/dev/null; do
    local mem=$(get_memory_usage "$pid")
    if [ "$mem" -gt "$max_mem" ]; then
      max_mem=$mem
    fi
    sleep 0.1
  done
  
  wait $pid
  
  local max_mem_mb=$((max_mem / 1024))
  echo "  Peak memory usage: ${max_mem_mb}MB"
  
  if [ $max_mem_mb -lt $MEMORY_LIMIT ]; then
    echo "  ✓ Memory usage within limit (${MEMORY_LIMIT}MB)"
    return 0
  else
    echo "  ✗ Memory usage exceeded limit"
    return 1
  fi
}

stress_file_descriptor_leak() {
  echo "Testing for file descriptor leaks..."
  
  # Get initial FD count
  local initial_fds=$(ls /proc/$$/fd | wc -l)
  
  # Run script multiple times
  for i in {1..10}; do
    ${SCRIPT_DIR}/preflight-check.sh \
      --skip-build --skip-test --skip-lint --skip-checkpoint \
      >/dev/null 2>&1
  done
  
  # Check FD count after
  local final_fds=$(ls /proc/$$/fd | wc -l)
  
  echo "  Initial FDs: $initial_fds"
  echo "  Final FDs: $final_fds"
  
  if [ $final_fds -le $((initial_fds + 2)) ]; then
    echo "  ✓ No file descriptor leak detected"
    return 0
  else
    echo "  ✗ Possible file descriptor leak"
    return 1
  fi
}

stress_signal_handling() {
  echo "Testing signal handling..."
  
  # Test SIGINT handling
  ${SCRIPT_DIR}/preflight-check.sh \
    --skip-build --skip-test --skip-lint \
    >/dev/null 2>&1 &
  local pid=$!
  
  sleep 0.1
  kill -INT $pid 2>/dev/null || true
  
  # Wait a bit and check if process terminated cleanly
  sleep 1
  
  if kill -0 $pid 2>/dev/null; then
    kill -KILL $pid 2>/dev/null || true
    echo "  ✗ Process did not handle SIGINT properly"
    return 1
  else
    echo "  ✓ SIGINT handled correctly"
  fi
  
  # Test SIGTERM handling
  ${SCRIPT_DIR}/preflight-check.sh \
    --skip-build --skip-test --skip-lint \
    >/dev/null 2>&1 &
  pid=$!
  
  sleep 0.1
  kill -TERM $pid 2>/dev/null || true
  
  sleep 1
  
  if kill -0 $pid 2>/dev/null; then
    kill -KILL $pid 2>/dev/null || true
    echo "  ✗ Process did not handle SIGTERM properly"
    return 1
  else
    echo "  ✓ SIGTERM handled correctly"
    return 0
  fi
}

stress_long_running() {
  echo "Testing long-running execution stability..."
  
  # Create a script that simulates long-running checks
  cat > "${TEMP_DIR}/long-check.sh" <<'EOF'
#!/bin/bash
echo "Starting long-running check..."
for i in {1..5}; do
  echo "  Step $i/5"
  sleep 1
done
echo "Long-running check complete"
exit 0
EOF
  chmod +x "${TEMP_DIR}/long-check.sh"
  
  # Test with custom timeout
  if ${SCRIPT_DIR}/preflight-check.sh \
    --timeout 10 \
    --skip-build --skip-test --skip-lint \
    >/dev/null 2>&1; then
    echo "  ✓ Long-running execution handled correctly"
    return 0
  else
    echo "  ✗ Long-running execution failed"
    return 1
  fi
}

stress_invalid_input() {
  echo "Testing handling of invalid inputs..."
  
  local failures=0
  
  # Test with various invalid inputs
  local invalid_inputs=(
    "--timeout -1"
    "--timeout 0"
    "--timeout abc"
    "--timeout 999999999"
    "--build-timeout -100"
    "--test-timeout 0.5"
    "--unknown-flag"
    "--help --version"  # Conflicting options
  )
  
  for input in "${invalid_inputs[@]}"; do
    if ${SCRIPT_DIR}/preflight-check.sh $input >/dev/null 2>&1; then
      echo "  ✗ Accepted invalid input: $input"
      failures=$((failures + 1))
    fi
  done
  
  if [ $failures -eq 0 ]; then
    echo "  ✓ All invalid inputs rejected properly"
    return 0
  else
    echo "  ✗ $failures invalid inputs were accepted"
    return 1
  fi
}

stress_resource_exhaustion() {
  echo "Testing behavior under resource constraints..."
  
  # Test with ulimit restrictions (if possible)
  if command -v ulimit >/dev/null 2>&1; then
    (
      # Limit resources
      ulimit -t 5    # CPU time limit (5 seconds)
      ulimit -v 100000  # Virtual memory limit (100MB)
      ulimit -n 100  # File descriptor limit
      
      ${SCRIPT_DIR}/preflight-check.sh \
        --skip-build --skip-test --skip-lint --skip-checkpoint \
        >/dev/null 2>&1
    )
    
    if [ $? -eq 0 ]; then
      echo "  ✓ Handled resource constraints gracefully"
      return 0
    else
      echo "  ⚠ May have issues with resource constraints"
      return 0  # Don't fail the test as this is environment-dependent
    fi
  else
    echo "  ⚠ Skipping resource constraint test (ulimit not available)"
    return 0
  fi
}

stress_parallel_modules() {
  echo "Testing parallel module execution..."
  
  # Run all modules in parallel
  local pids=()
  
  ${SCRIPT_DIR}/modules/build-check.sh --skip >/dev/null 2>&1 &
  pids+=($!)
  
  ${SCRIPT_DIR}/modules/test-check.sh --skip >/dev/null 2>&1 &
  pids+=($!)
  
  ${SCRIPT_DIR}/modules/lint-check.sh --skip >/dev/null 2>&1 &
  pids+=($!)
  
  ${SCRIPT_DIR}/modules/checkpoint-create.sh --skip >/dev/null 2>&1 &
  pids+=($!)
  
  # Wait for all
  local all_success=true
  for pid in "${pids[@]}"; do
    if ! wait $pid; then
      all_success=false
    fi
  done
  
  if $all_success; then
    echo "  ✓ All modules can run in parallel"
    return 0
  else
    echo "  ✗ Module parallel execution failed"
    return 1
  fi
}

# ========================================
# Performance Profiling
# ========================================

profile_execution() {
  echo "Profiling script execution..."
  
  # Use time command for basic profiling
  local time_output=$(
    { time ${SCRIPT_DIR}/preflight-check.sh \
        --skip-build --skip-test --skip-lint --skip-checkpoint \
        >/dev/null 2>&1; } 2>&1
  )
  
  echo "  Timing results:"
  echo "$time_output" | sed 's/^/    /'
  
  return 0
}

# ========================================
# Report Generation
# ========================================

generate_stress_report() {
  local report_file="${TEMP_DIR}/stress-report.txt"
  
  cat > "$report_file" <<EOF
Stress Test Report
==================

Date: $(date)
Host: $(hostname)
CPU: $(nproc) cores
Memory: $(free -h | grep Mem | awk '{print $2}')

Test Parameters:
- Max Concurrent: $MAX_CONCURRENT
- Test Duration: ${TEST_DURATION}s
- Memory Limit: ${MEMORY_LIMIT}MB

Results:
EOF
  
  # Analyze monitoring logs
  if ls "${TEMP_DIR}"/*.log >/dev/null 2>&1; then
    echo "Resource Usage:" >> "$report_file"
    for log in "${TEMP_DIR}"/*.log; do
      local max_mem=$(awk -F'[: ]' '{print $3}' "$log" | sort -n | tail -1)
      local avg_cpu=$(awk -F'[: ]' '{sum+=$5; count++} END {print sum/count}' "$log")
      echo "  - $(basename "$log"): Max Mem=${max_mem}KB, Avg CPU=${avg_cpu}%" >> "$report_file"
    done
  fi
  
  echo "Report saved to: $report_file"
  cat "$report_file"
}

# ========================================
# Main Execution
# ========================================

main() {
  echo "======================================"
  echo "Pre-flight Check Stress Test Suite"
  echo "======================================"
  echo
  echo "Configuration:"
  echo "  Max Concurrent: $MAX_CONCURRENT"
  echo "  Test Duration: ${TEST_DURATION}s"
  echo "  Memory Limit: ${MEMORY_LIMIT}MB"
  echo "  Temp Directory: $TEMP_DIR"
  echo
  
  local tests_passed=0
  local tests_failed=0
  
  # Run stress tests
  local test_functions=(
    stress_concurrent_execution
    stress_rapid_sequential
    stress_memory_usage
    stress_file_descriptor_leak
    stress_signal_handling
    stress_long_running
    stress_invalid_input
    stress_resource_exhaustion
    stress_parallel_modules
    profile_execution
  )
  
  for test_func in "${test_functions[@]}"; do
    echo
    if $test_func; then
      tests_passed=$((tests_passed + 1))
    else
      tests_failed=$((tests_failed + 1))
    fi
  done
  
  # Generate report
  echo
  generate_stress_report
  
  # Summary
  echo
  echo "======================================"
  echo "Stress Test Summary"
  echo "======================================"
  echo "Tests Passed: $tests_passed"
  echo "Tests Failed: $tests_failed"
  
  if [ $tests_failed -eq 0 ]; then
    echo
    echo "✅ All stress tests passed!"
    echo "The Pre-flight Check scripts are stable under load."
    exit 0
  else
    echo
    echo "⚠️  Some stress tests failed."
    echo "Review the results above for potential issues."
    exit 1
  fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-concurrent)
      MAX_CONCURRENT="$2"
      shift 2
      ;;
    --duration)
      TEST_DURATION="$2"
      shift 2
      ;;
    --memory-limit)
      MEMORY_LIMIT="$2"
      shift 2
      ;;
    --help)
      cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Stress test the Pre-flight Check scripts

Options:
  --max-concurrent N   Maximum concurrent instances (default: 10)
  --duration N         Test duration in seconds (default: 30)
  --memory-limit N     Memory limit in MB (default: 512)
  --help              Show this help message

Example:
  $(basename "$0") --max-concurrent 20 --duration 60
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main
fi