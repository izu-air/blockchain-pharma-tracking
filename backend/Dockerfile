# syntax=docker/dockerfile:1.6

# ---- Build stage -----------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

# Resolve dependencies first to leverage Docker layer caching across edits.
COPY pom.xml .
RUN mvn -B -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests package \
 && cp target/pharma-supply-chain-*.jar /workspace/app.jar

# ---- Runtime stage ---------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine

# Run as a dedicated non-root user.
RUN addgroup -S spring -g 10001 \
 && adduser  -S spring -G spring -u 10001 -H -D \
 && mkdir -p /app \
 && chown -R spring:spring /app
WORKDIR /app

COPY --from=build --chown=spring:spring /workspace/app.jar /app/app.jar

# Container best practices for JVM in cgroup-restricted environments.
ENV JAVA_OPTS="-Xms128m -Xmx512m \
 -XX:+UseG1GC \
 -XX:+ExitOnOutOfMemoryError \
 -Djava.security.egd=file:/dev/./urandom"

USER spring
EXPOSE 8080

# wget is part of busybox in alpine — used by docker-compose healthcheck.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
