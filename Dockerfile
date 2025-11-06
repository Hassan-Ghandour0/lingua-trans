# ========= STAGE 1: Build Angular =========
FROM node:18-bullseye AS ngbuild
WORKDIR /ui
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ========= STAGE 2: Build Spring Boot (JAR) =========
FROM maven:3.9.6-eclipse-temurin-21 AS springbuild
WORKDIR /app


COPY backend/pom.xml .
COPY backend/.mvn .mvn
COPY backend/mvnw .

RUN ./mvnw -q -Dmaven.test.skip dependency:go-offline

COPY backend/ .


RUN rm -rf src/main/resources/static/*


COPY --from=ngbuild /ui/dist/**/browser/ src/main/resources/static/


RUN ./mvnw -q -DskipTests package


FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=springbuild /app/target/*.jar app.jar


EXPOSE 10000


ENTRYPOINT ["java","-jar","/app/app.jar"]
