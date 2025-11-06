# ---------- Stage 1: build Angular ----------
    FROM node:18-alpine AS frontend
    WORKDIR /ui
    COPY frontend/package*.json ./
    RUN npm ci
    COPY frontend/ ./

    RUN npm run build           # يطلع الى dist/<app>/browser
    
    # ---------- Stage 2: build Spring Boot ----------
    FROM maven:3.9.8-eclipse-temurin-21 AS backend-build
    WORKDIR /app

    COPY backend/mvnw backend/.mvn/ ./ 
    RUN chmod +x mvnw
    COPY backend/pom.xml ./
    RUN ./mvnw -q -DskipTests dependency:go-offline
    
 
    COPY backend/src ./src
    RUN rm -rf src/main/resources/static/* && \
        mkdir -p src/main/resources/static && \
        sh -c 'cp -R /ui/dist/*/browser/* src/main/resources/static/'
    
 
    RUN ./mvnw -q -DskipTests package
    
    # ---------- Stage 3: runtime ----------
    FROM eclipse-temurin:21-jre
    WORKDIR /app
    COPY --from=backend-build /app/target/*.jar app.jar
 
    ENV PORT=10000
    EXPOSE 10000
    ENTRYPOINT ["java","-jar","/app/app.jar","--server.port=10000"]
    