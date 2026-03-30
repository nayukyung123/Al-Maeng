# 1. 빌드 단계
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 환경 변수 설정
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_KAKAO_CLIENT_ID
ARG NEXT_PUBLIC_NAVER_CLIENT_ID
ARG NEXT_PUBLIC_GTM_ID

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_KAKAO_CLIENT_ID=$NEXT_PUBLIC_KAKAO_CLIENT_ID
ENV NEXT_PUBLIC_NAVER_CLIENT_ID=$NEXT_PUBLIC_NAVER_CLIENT_ID
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID

RUN npm run build

# 2. 실행 단계
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# standalone 모드 결과물과 정적 파일 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# 빌드된 server.js 직접 실행
CMD ["node", "server.js"]