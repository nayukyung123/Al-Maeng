# 1단계: 빌드 스테이지
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app

# [핵심] 그래들 래퍼와 설정 파일만 먼저 복사 (캐시 활용)
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# 실행 권한 부여 및 의존성만 미리 다운로드 (여기서 도커 캐시가 생성됨!)
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon

# 실제 소스 코드 복사 및 빌드 (의존성은 이미 받아져 있어서 매우 빠름)
COPY src src
RUN ./gradlew build -x test --no-daemon

# 2단계: 실행 스테이지
FROM eclipse-temurin:17-jre
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/build/libs/*-SNAPSHOT.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]