# 1️⃣ Build stage using Maven + Java 21
FROM maven:3.9.5-eclipse-temurin-21 AS build

# Set working directory
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the Spring Boot application (skip tests for faster build)
RUN mvn clean package -DskipTests

# 2️⃣ Runtime stage using JDK 21
FROM eclipse-temurin:21-jdk-jammy

# Set working directory
WORKDIR /app

# 🧠 Install netcat (nc) to allow wait-for.sh to work
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Copy the jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Copy the wait-for script into the container
COPY wait-for.sh /wait-for.sh

# Make the script executable
RUN chmod +x /wait-for.sh

# Expose the default Spring Boot port
EXPOSE 8080

# Wait for MySQL before running the app
ENTRYPOINT ["/wait-for.sh", "mysql", "java", "-jar", "app.jar"]
