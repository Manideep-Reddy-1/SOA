# Stage 1: Build all Maven modules
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY pom.xml .
COPY eureka-server/pom.xml eureka-server/
COPY api-gateway/pom.xml api-gateway/
COPY auth-service/pom.xml auth-service/
COPY room-service/pom.xml room-service/
COPY booking-service/pom.xml booking-service/
COPY payment-service/pom.xml payment-service/
COPY . .

RUN mvn -B clean package -DskipTests

# Stage 2: Minimal runtime image
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN apt-get update && apt-get install -y curl bash && rm -rf /var/lib/apt/lists/*

COPY --from=build /workspace/eureka-server/target/*.jar eureka-server.jar
COPY --from=build /workspace/auth-service/target/*.jar auth-service.jar
COPY --from=build /workspace/room-service/target/*.jar room-service.jar
COPY --from=build /workspace/booking-service/target/*.jar booking-service.jar
COPY --from=build /workspace/payment-service/target/*.jar payment-service.jar
COPY --from=build /workspace/api-gateway/target/*.jar api-gateway.jar

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/bin/bash", "/app/entrypoint.sh"]
