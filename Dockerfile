# ---------- Stage 1: Build Angular ----------
    FROM node:18-alpine AS ui
    WORKDIR /ui
    COPY frontend/package*.json ./
    RUN npm ci
    COPY frontend/ ./
    RUN npm run build
    
    # ---------- Stage 2: Build Spring Boot (with mvnw) ----------
    FROM eclipse-temurin:17-jdk-alpine AS backend-build
    WORKDIR /app
    
    # copy only mvnw, pom and .mvn first to cache deps
    COPY backend/mvnw backend/pom.xml ./
    COPY backend/.mvn .mvn
    
    # fix CRLF if committed from Windows + make executable
    RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
    
    # now copy sources
    COPY backend/src ./src
    
    # copy built Angular into static resources
    COPY --from=ui /ui/dist/**/browser ./src/main/resources/static/
    
    # build jar
    RUN ./mvnw -q -DskipTests package
    
    # ---------- Stage 3: Runtime ----------
    FROM eclipse-temurin:17-jre-alpine
    WORKDIR /app
    # copy the built jar (adjust name pattern if different)
    COPY --from=backend-build /app/target/*-SNAPSHOT.jar app.jar
    
    # Render uses port 10000
    ENV PORT=10000
    EXPOSE 10000
    
    # If you don't already have it in application.properties:
    # server.port=${PORT:8080}
    
    ENTRYPOINT ["sh","-c","java -jar app.jar"]
    