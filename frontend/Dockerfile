# 1. 빌드 단계 (Build Stage)
FROM node:24-alpine AS builder
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build 

# 2. 실행 단계 (Production Stage): 이미지 용량 최적화
FROM node:24-alpine AS runner
WORKDIR /app

# 프로덕션 환경 설정
ENV NODE_ENV=production

# 실행에 필요한 최소한의 파일만 추출해서 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Next.js 기본 포트 노출
EXPOSE 3000

CMD ["npm", "start"]