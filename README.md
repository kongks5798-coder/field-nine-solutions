
# Field Nine OS - 통합 프로젝트

프론트엔드(Next.js), 백엔드(API/AI), 인프라, 외부 서비스가 하나로 통합된 모노레포 프로젝트입니다.

## 주요 환경변수 예시

`.env`, `.env.local`, `.env.test`에 아래 항목을 실제 값으로 입력하세요:

```
OPENAI_API_KEY=sk-...
GOOGLE_GEMINI_API_KEY=AI...
GROQ_API_KEY=...
ANTHROPIC_API_KEY=...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SENTRY_DSN=https://xxxx@sentry.io/xxxx
VERCEL_PROJECT_ID=prj_...
... (기타 항목은 .env.test 참고)
```

## 통합 실행/테스트/배포

1. 개발 서버 실행: `npm run dev`
2. 통합 테스트: `npx playwright test`
3. 환경변수 변경 시 서버 재시작 필요
4. Sentry 등 모니터링 연동 필수

## 주요 연동 서비스

- OpenAI, Gemini, Groq, Anthropic (AI)
- Supabase (DB)
- Vercel (배포)
- Sentry (모니터링)
- Google/Kakao/Apple OAuth

## 문서/가이드

- 환경변수: `.env.test`, `ENV_SETUP_GUIDE.md`
- 배포: `DEPLOYMENT_GUIDE.md`, `VERCEL_DEPLOYMENT_NOW.md`
- AI: `AI_CHAT_SETUP.md`

---

아래는 Next.js 기본 안내입니다.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
