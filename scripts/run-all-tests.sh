#!/bin/bash

# 🚀 JobPing Complete Pilot Test Suite
# Runs all pilot testing scripts and provides comprehensive summary

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${1:-"http://localhost:3000"}
TEST_MODE=${2:-"test"}

echo -e "${BLUE}🚀 JobPing Complete Pilot Test Suite${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Base URL: ${BASE_URL}"
echo -e "Test Mode: ${TEST_MODE}"
echo ""

# Function to run test and capture results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local test_file="$3"
    
    echo -e "${BLUE}Running ${test_name}...${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ ${test_name}: PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ ${test_name}: FAILED${NC}"
        return 1
    fi
}

# Initialize counters
total_tests=0
passed_tests=0
failed_tests=0

# Test 1: Pilot Smoke Test
total_tests=$((total_tests + 1))
if run_test "Pilot Smoke Test" "JOBPING_TEST_MODE=1 NODE_ENV=test npx tsx scripts/pilot-smoke.ts --base ${BASE_URL}" "PILOT_SMOKE.md"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

echo ""

# Test 2: Lock & Rate Limit Harness
total_tests=$((total_tests + 1))
if run_test "Lock & Rate Limit Harness" "JOBPING_TEST_MODE=1 NODE_ENV=test npx tsx scripts/lock-and-rl-check.ts --base ${BASE_URL}"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

echo ""

# Test 3: Legacy Pilot Testing
total_tests=$((total_tests + 1))
if run_test "Legacy Pilot Testing" "JOBPING_TEST_MODE=1 NODE_ENV=test node scripts/pilot-testing.js"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

echo ""
echo -e "${BLUE}📊 FINAL SUMMARY${NC}"
echo -e "${BLUE}================${NC}"
echo -e "Total Tests: ${total_tests}"
echo -e "${GREEN}✅ Passed: ${passed_tests}${NC}"
echo -e "${RED}❌ Failed: ${failed_tests}${NC}"

# Calculate success rate
if [ $total_tests -gt 0 ]; then
    success_rate=$((passed_tests * 100 / total_tests))
    echo -e "Success Rate: ${success_rate}%"
else
    success_rate=0
    echo -e "Success Rate: 0%"
fi

echo ""

# Determine pilot readiness
if [ $success_rate -ge 90 ]; then
    echo -e "${GREEN}🎉 PILOT READY! Success rate: ${success_rate}%${NC}"
    echo -e "${GREEN}System is ready for 150-user pilot launch.${NC}"
    exit_code=0
elif [ $success_rate -ge 70 ]; then
    echo -e "${YELLOW}⚠️ PILOT READY WITH CAUTION. Success rate: ${success_rate}%${NC}"
    echo -e "${YELLOW}Consider fixing failed tests before proceeding.${NC}"
    exit_code=0
else
    echo -e "${RED}❌ NOT READY FOR PILOT. Success rate: ${success_rate}%${NC}"
    echo -e "${RED}Fix critical issues before proceeding with pilot.${NC}"
    exit_code=1
fi

echo ""

# Show generated reports
if [ -f "PILOT_SMOKE.md" ]; then
    echo -e "${BLUE}📄 Generated Reports:${NC}"
    echo -e "  - PILOT_SMOKE.md (Comprehensive smoke test report)"
    echo ""
    echo -e "${BLUE}📋 Quick Report Preview:${NC}"
    echo "----------------------------------------"
    head -20 PILOT_SMOKE.md
    echo "----------------------------------------"
fi

echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
if [ $failed_tests -gt 0 ]; then
    echo -e "1. Review failed tests and fix underlying issues"
    echo -e "2. Check system logs for detailed error information"
    echo -e "3. Verify environment configuration and API keys"
    echo -e "4. Test individual components to isolate issues"
    echo -e "5. Re-run test suite after fixes are applied"
else
    echo -e "1. ✅ All tests passed successfully"
    echo -e "2. 🚀 System is ready for pilot launch"
    echo -e "3. 📊 Monitor system performance during pilot"
    echo -e "4. 📈 Scale up gradually based on pilot results"
fi

echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "  - scripts/README.md (Complete documentation)"
echo -e "  - PILOT_SMOKE.md (Detailed test report)"

exit $exit_code
