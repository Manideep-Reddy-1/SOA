FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -B -pl room-service -am package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /workspace/room-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
