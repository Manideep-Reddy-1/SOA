#!/bin/bash
set -e

echo "=== Starting GrandVista Hospitality Platform ==="
GATEWAY_PORT=${PORT:-8080}
echo "Railway assigned gateway port: $GATEWAY_PORT"

# 1. Start Eureka Server strictly on port 8761
echo "Starting Eureka Server on port 8761..."
java -Xms128m -Xmx256m -Dserver.port=8761 -Deureka.instance.hostname=localhost -jar eureka-server.jar &

# Wait for Eureka to be healthy
echo "Waiting for Eureka Server to initialize on port 8761..."
for i in $(seq 1 30); do
    if curl -s http://localhost:8761/actuator/health | grep -q "UP"; then
        echo "Eureka Server is UP on port 8761!"
        break
    fi
    sleep 1
done

# 2. Start Core Services with fixed internal ports
echo "Starting Auth Service on port 8081..."
java -Xms128m -Xmx256m -Dserver.port=8081 -jar auth-service.jar &

echo "Starting Room Service on port 8082..."
java -Xms128m -Xmx256m -Dserver.port=8082 -jar room-service.jar &

echo "Starting Payment Service on port 8084..."
java -Xms128m -Xmx256m -Dserver.port=8084 -jar payment-service.jar &

echo "Starting Booking Service on port 8083..."
java -Xms128m -Xmx256m -Dserver.port=8083 -jar booking-service.jar &

# Give background microservices a few seconds to register with Eureka
sleep 8

# 3. Start API Gateway on Railway's $PORT as the primary foreground process
echo "Starting API Gateway on public port $GATEWAY_PORT..."
exec java -Xms128m -Xmx256m -Dserver.port=$GATEWAY_PORT -jar api-gateway.jar
