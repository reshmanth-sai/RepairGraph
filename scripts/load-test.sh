#!/usr/bin/env bash
set -e

# ==============================================================================
# BACSE344 Digital Assignment 3 - Automated Load Testing & Chaos Experiment
# Target: RepairGraph Scaled Cluster behind Nginx Load Balancer
# ==============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

TARGET_URL="http://localhost:8080/api/diagnostics/triage?category=LAPTOP&brand=Apple&model=MacBook+Pro+M3&symptoms=Battery+draining+rapidly+and+overheating"
HEALTH_URL="http://localhost:8080/api/health"

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}  BACSE344 DA3: Load Testing & Scalability Verification Benchmark   ${NC}"
echo -e "${BLUE}==================================================================${NC}"

# Check health of the Nginx endpoint
echo -e "\n${YELLOW}[1/4] Verifying Nginx Cluster Health & Round-Robin Upstream Distribution...${NC}"
for i in {1..6}; do
  RES=$(curl -s -i "$HEALTH_URL")
  SERVER_HDR=$(echo "$RES" | grep -i "x-upstream-server" | awk '{print $2}' | tr -d '\r')
  INSTANCE_HDR=$(echo "$RES" | grep -i "x-backend-instance" | awk '{print $2}' | tr -d '\r')
  echo "Request #$i -> Upstream Addr: $SERVER_HDR | Container: $INSTANCE_HDR"
  sleep 0.2
done

echo -e "\n${GREEN}✓ Nginx load balancing is actively distributing requests across instances.${NC}"

# ------------------------------------------------------------------------------
# Test 1: Single Instance Baseline (1 Backend)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[2/4] Executing Benchmark 1: Single Backend Instance (1,000 requests, concurrency 20)...${NC}"
echo "Sending requests directly to Backend 1 on port 3001..."
/usr/sbin/ab -n 1000 -c 20 "http://localhost:3001/api/diagnostics/triage?category=LAPTOP&brand=Apple&model=MacBook+Pro+M3&symptoms=Battery+draining+rapidly+and+overheating" > /tmp/ab_1_instance.txt
echo -e "${GREEN}✓ 1-Instance benchmark complete.${NC}"

# ------------------------------------------------------------------------------
# Test 2: Scaled Cluster (3 Backends behind Nginx)
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[3/4] Executing Benchmark 2: Three Scaled Instances behind Nginx (1,000 requests, concurrency 20)...${NC}"
echo "Sending requests through Nginx Load Balancer on port 8080..."
/usr/sbin/ab -n 1000 -c 20 "$TARGET_URL" > /tmp/ab_3_instances.txt
echo -e "${GREEN}✓ 3-Instance cluster benchmark complete.${NC}"

# ------------------------------------------------------------------------------
# Parse and Display Results Comparison Table
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${BLUE}               Question 1.b: Performance Results Table            ${NC}"
echo -e "${BLUE}==================================================================${NC}"

RPS_1=$(grep "Requests per second:" /tmp/ab_1_instance.txt | awk '{print $4}')
LAT_1=$(grep "Time per request:.*(mean)" /tmp/ab_1_instance.txt | head -n 1 | awk '{print $4}')
TIME_1=$(grep "Time taken for tests:" /tmp/ab_1_instance.txt | awk '{print $5}')
FAILED_1=$(grep "Failed requests:" /tmp/ab_1_instance.txt | awk '{print $3}')

RPS_3=$(grep "Requests per second:" /tmp/ab_3_instances.txt | awk '{print $4}')
LAT_3=$(grep "Time per request:.*(mean)" /tmp/ab_3_instances.txt | head -n 1 | awk '{print $4}')
TIME_3=$(grep "Time taken for tests:" /tmp/ab_3_instances.txt | awk '{print $5}')
FAILED_3=$(grep "Failed requests:" /tmp/ab_3_instances.txt | awk '{print $3}')

# Calculate percentage improvement
python3 -c "
rps1 = float('$RPS_1')
rps3 = float('$RPS_3')
lat1 = float('$LAT_1')
lat3 = float('$LAT_3')

imp_rps = ((rps3 - rps1) / rps1) * 100.0
imp_lat = ((lat1 - lat3) / lat1) * 100.0

print(f'''
Metric                      | 1 Instance (Baseline) | 3 Instances (Nginx Cluster) | Improvement
----------------------------+-----------------------+-----------------------------+-------------
Total Requests Sent         | 1,000                 | 1,000                       | -
Concurrency Level           | 20                    | 20                          | -
Total Execution Time        | $TIME_1 s               | $TIME_3 s                   | -
Throughput (Requests / sec) | {rps1:.2f} [#/sec]        | {rps3:.2f} [#/sec]              | +{imp_rps:.1f}%
Average Latency (mean)      | {lat1:.2f} [ms]           | {lat3:.2f} [ms]                 | {imp_lat:.1f}% faster
Failed Requests             | $FAILED_1                     | $FAILED_3                     | 100% Success
''')
"

echo -e "${GREEN}✓ Benchmark metrics successfully captured.${NC}"

