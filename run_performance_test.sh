#!/bin/bash
set -e

# Check for JMeter
if ! command -v jmeter &> /dev/null; then
    echo "❌ JMeter not found. Please install Apache JMeter and add it to your PATH."
    echo "   Mac: brew install jmeter"
    exit 1
fi

# 1. Generate Data
echo "📊 Generating Test Data (Users)..."
# Check if python3 is available
if command -v python3 &> /dev/null; then
    python3 generate_test_data.py
else
    echo "❌ python3 not found."
    exit 1
fi

# 2. Run Tests
mkdir -p results

run_test() {
    USERS=$1
    echo "🚀 Running Test with $USERS Users..."
    
    # Clean previous run
    rm -rf results/report_$USERS
    rm -f results/results_$USERS.jtl
    
    # Run JMeter
    # -n: non-gui
    # -t: test plan
    # -Jusers: property 'users' for Travelers
    # -Jowners: property 'owners' (10% of users)
    # -l: log file
    # -e -o: generate dashboard
    
    OWNERS=$((USERS / 10))
    if [ "$OWNERS" -lt 1 ]; then OWNERS=1; fi
    
    jmeter -n -t airbnb_performance_test.jmx \
        -Jusers=$USERS \
        -Jowners=$OWNERS \
        -l results/results_$USERS.jtl \
        -e -o results/report_$USERS
        
    echo "✅ Test $USERS complete. Report: results/report_$USERS/index.html"
}

# Run for 100, 200, 300, 400, 500
run_test 100
run_test 200
run_test 300
run_test 400
run_test 500

echo "🎉 All performance tests completed!"
