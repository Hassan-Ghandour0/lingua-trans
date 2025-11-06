# ---------- 1) Build Angular ----------
    FROM node:18-alpine AS ngbuild
    WORKDIR /ui
    COPY frontend/package*.json ./
    RUN npm ci
    COPY frontend/ ./
    RUN npm run build
    
    # ---------- 2) Build Spring Boot ----------
    FROM maven:3.9.6-eclipse-temurin-21 AS mvnbuild
    WORKDIR /build
    COPY backend/pom.xml backend/pom.xml
    # go offline (download deps) — not strictly required but faster on re-builds
    RUN --mount=type=cache,target=/root/.m2 mvn -f backend/pom.xml -q -DskipTests dependency:go-offline
    # copy sources + angular build into static
    COPY backend/ backend/
    COPY --from=ngbuild /ui/dist/**/browser/ backend/src/main/resources/static/
    # build the jar
    RUN --mount=type=cache,target=/root/.m2 mvn -f backend/pom.xml -q -DskipTests package
    
    # ---------- 3) Runtime image ----------
    FROM eclipse-temurin:21-jre-alpine
    # Render will inject PORT. Keep a sane default for local run.
    ENV PORT=10000
    WORKDIR /app
    # copy the fat jar
    COPY --from=mvnbuild /build/backend/target/*.jar /app/app.jar
    EXPOSE 10000
    # force Spring to bind to $PORT (Render)
    CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar /app/app.jar"]
    