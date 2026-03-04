# 1단계: 빌드 스테이지 (Node 24 사용)
FROM node:24-alpine AS builder
WORKDIR /app

# [핵심] package.json을 먼저 복사하여 의존성 캐시 활용
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# 소스 복사 및 정적 파일 빌드
COPY . .
RUN npm run build

# 2단계: 실행 스테이지 (Nginx)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# 아래에서 작성할 커스텀 Nginx 설정 파일 주입
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]