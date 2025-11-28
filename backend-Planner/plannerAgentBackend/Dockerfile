# 1️⃣ Build stage: Maven + Java 21
FROM maven:3.9.5-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom and source code
COPY pom.xml .
COPY src ./src

# Build the Spring Boot app
RUN mvn clean package -DskipTests

# 2️⃣ Runtime stage: JDK 21
FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

# Install Python and netcat
RUN apt-get update && \
    apt-get install -y netcat-openbsd python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Copy Spring Boot jar
COPY --from=build /app/target/*.jar app.jar

# Copy wait-for script
COPY wait-for.sh /wait-for.sh
RUN chmod +x /wait-for.sh

# Copy solver folder (Python scripts)
COPY solver /app/solver

# Expose Spring Boot port
EXPOSE 8080

# Wait for MySQL before starting
ENTRYPOINT ["/wait-for.sh", "mysql", "java", "-jar", "app.jar"]
