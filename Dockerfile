# Multi-stage build for production optimization
# Stage 1: Builder - 빌드 환경
FROM node:20-alpine AS builder
WORKDIR /app

# 의존성 파일만 먼저 복사 (캐시 최적화)
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# 소스 코드 복사 및 빌드
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Runner - 프로덕션 실행 환경
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 보안을 위해 'root(왕)'가 아닌 'nextjs(일반 시민)' 권한으로 실행
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 빌드된 파일만 복사 (캐시 충돌 방지)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/monitor || exit 1

# 서버 시작!
CMD ["node", "server.js"]
