
    FROM node:18-alpine AS frontend
    WORKDIR /ui
    COPY frontend/package*.json ./
    RUN npm ci
    COPY frontend/ ./
   
    RUN npm run build   # الناتج dist/<app>/browser
    

    FROM maven:3.9.8-eclipse-temurin-21 AS backend-build
    WORKDIR /app
    
 
    COPY backend/pom.xml ./
    RUN mvn -q -DskipTests dependency:go-offline
    

    COPY backend/src ./src
    

    COPY --from=frontend /ui/dist /tmp/dist
    RUN rm -rf src/main/resources/static/* && \
        mkdir -p src/main/resources/static && \
        sh -c 'cp -R /tmp/dist/*/browser/* src/main/resources/static/'
    

    RUN mvn -q -DskipTests package
    
  
    FROM eclipse-temurin:21-jre
    WORKDIR /app
    COPY --from=backend-build /app/target/*.jar app.jar
    ENV PORT=10000
    EXPOSE 10000
    ENTRYPOINT ["java","-jar","/app/app.jar","--server.port=10000"]
    