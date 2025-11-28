# Performance Testing with JMeter

## Overview
We use Apache JMeter to performance test the Airbnb prototype. The test plan simulates multiple concurrent users performing typical actions like Login, Search, and Booking.

## Test Plan
Location: `infra/perf/test_plan.jmx`

### Scenarios
1.  **Login**: POST `/api/auth/login`
2.  **Search Properties**: GET `/api/properties`
3.  **View Property**: GET `/api/properties/:id`

### Configuration
- **Threads (Users)**: 10 (default)
- **Ramp-up**: 5 seconds
- **Loop Count**: Infinite (or specified duration)

## Running Tests
1.  Ensure the application is running (Docker Compose or K8s).
2.  Open JMeter: `jmeter`
3.  Load `infra/perf/test_plan.jmx`.
4.  Adjust `Thread Group` settings if needed.
5.  Click "Start" (Green arrow).
6.  View results in "View Results Tree" or "Summary Report".

## Metrics to Watch
- **Throughput**: Requests per second.
- **Response Time**: Average and 95th percentile.
- **Error Rate**: Should be 0%.

## CI Integration
The test plan can be run in non-GUI mode in CI pipelines:
```bash
jmeter -n -t infra/perf/test_plan.jmx -l results.jtl
```
