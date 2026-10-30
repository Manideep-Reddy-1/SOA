FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -B -pl payment-service -am package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/payment-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
