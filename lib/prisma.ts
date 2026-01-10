/**
 * Prisma Client Singleton
 * 
 * Next.js에서 Prisma Client를 효율적으로 사용하기 위한 싱글톤 패턴
 * 개발 환경에서는 Hot Reload 시 여러 인스턴스가 생성되는 것을 방지
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
