# ---------- Build Angular ----------
    FROM node:20-alpine AS frontend
    WORKDIR /app/frontend
    COPY frontend/package*.json ./
    RUN npm ci
    COPY frontend/ ./
    RUN npm run build -- --configuration=production --base-href "/"
    
    # ---------- Build Spring Boot ----------
    FROM maven:3.9.6-eclipse-temurin-21 AS backend
    WORKDIR /app
    COPY backend/pom.xml backend/mvnw backend/.mvn/ ./backend/
    RUN mvn -f backend/pom.xml -q -DskipTests dependency:go-offline
    COPY backend/ ./backend/

    RUN rm -rf backend/src/main/resources/static/* && \
        mkdir -p backend/src/main/resources/static && \
        cp -r /app/frontend/dist/*/browser/* backend/src/main/resources/static/
    RUN mvn -f backend/pom.xml -DskipTests clean package
    
    # ---------- Runtime ----------
    FROM eclipse-temurin:21-jre
    WORKDIR /app
    COPY --from=backend /app/backend/target/*.jar app.jar
    EXPOSE 10000
    ENV PORT=10000
    ENTRYPOINT ["java","-jar","app.jar","--server.port=${PORT}"]
    