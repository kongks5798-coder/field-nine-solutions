// prisma.config.ts for Prisma v7+ (Field Nine)
export default {
  datasource: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
    },
  },
};
