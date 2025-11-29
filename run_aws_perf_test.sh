#!/bin/bash
set -e

# Usage: ./run_aws_perf_test.sh <PUBLIC_IP>

if [ -z "$1" ]; then
    echo "Usage: $0 <PUBLIC_IP>"
    echo "Example: $0 54.123.45.67"
    exit 1
fi

HOST=$1

# Function to install Java
install_java() {
    echo "☕ Java not found. Installing..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y default-jre
    elif command -v yum &> /dev/null; then
        sudo yum install -y java-17-amazon-corretto-headless || sudo yum install -y java-1.8.0-openjdk
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y java-17-amazon-corretto-headless
    else
        echo "❌ Could not install Java. Please install Java manually."
        exit 1
    fi
}

# Check Java
if ! command -v java &> /dev/null; then
    install_java
fi

# Check JMeter
if ! command -v jmeter &> /dev/null; then
    echo "⚠️ JMeter not found in PATH."
    
    # Check if we already downloaded it locally
    if [ -d "apache-jmeter-5.6.3" ]; then
        echo "✅ Found local JMeter directory."
        JMETER_BIN="$(pwd)/apache-jmeter-5.6.3/bin/jmeter"
    else
        echo "⬇️ Downloading Apache JMeter 5.6.3..."
        # Check for wget or curl
        if command -v wget &> /dev/null; then
            wget -q https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz
        else
            curl -O https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz
        fi
        
        echo "📦 Extracting..."
        tar -xzf apache-jmeter-5.6.3.tgz
        JMETER_BIN="$(pwd)/apache-jmeter-5.6.3/bin/jmeter"
    fi
else
    JMETER_BIN="jmeter"
fi

echo "🚀 Starting AWS Performance Test against $HOST..."

# 1. Generate Test Data
echo "📊 Generating Test Data (Travelers & Owners)..."

# Check for requests library
if ! python3 -c "import requests" &> /dev/null; then
    echo "⚠️ Python 'requests' library not found. Installing..."
    pip3 install requests
fi

if ! python3 generate_test_data.py --host $HOST; then
    echo "❌ Failed to generate test data. Ensure 'requests' library is installed (pip install requests)."
    exit 1
fi

# 2. Run Tests
mkdir -p results

run_test() {
    USERS=$1
    echo "🏃 Running test with $USERS users..."
    
    # Run JMeter in non-GUI mode
    # -n: non-GUI mode
    # -t: test plan
    # -l: log file (results)
    # -e: generate report
    # -o: output folder for report
    # -Jhost: pass host property
    # -Jusers: pass users property
    
    REPORT_DIR="results/report_${USERS}_users"
    rm -rf $REPORT_DIR
    
    $JMETER_BIN -n \
        -t aws_performance_test.jmx \
        -l results/results_${USERS}.csv \
        -e -o $REPORT_DIR \
        -Jhost=$HOST \
        -Jusers=$USERS \
        -Jowners=$((USERS/10)) # 10% owners
        
    echo "✅ Test with $USERS users complete. Report: $REPORT_DIR/index.html"
}

# Run for 100, 200, 300, 400, 500 users
for u in 100 200 300 400 500; do
    run_test $u
    # Cool down
    echo "Sleeping for 10s..."
    sleep 10
done

echo "🎉 All tests complete!"
echo "Open the reports in 'results/' to view the graphs."
