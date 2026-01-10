# 🔧 Vercel 배포 실패 해결 가이드

**문제**: "요청한 버전의 Next.js가 설치되지 않았습니다!"

**원인**: 
1. Next.js 버전 불일치
2. package.json의 engines 설정 문제
3. Vercel 빌드 캐시 문제

**해결 방법**:

## 1. Next.js 버전 확인 및 수정

`package.json`에서 Next.js 버전을 명시적으로 지정:

```json
{
  "dependencies": {
    "next": "15.0.3"
  }
}
```

## 2. Vercel 빌드 설정 확인

`vercel.json`에서 빌드 명령 확인:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci --legacy-peer-deps"
}
```

## 3. 환경 변수 설정 (Vercel Dashboard)

Vercel Dashboard > Settings > Environment Variables에서 다음 변수 설정:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXTAUTH_URL` (프로덕션 URL)
- `NEXTAUTH_SECRET`
- `KAKAO_CLIENT_ID` (선택)
- `KAKAO_CLIENT_SECRET` (선택)
- `GOOGLE_CLIENT_ID` (선택)
- `GOOGLE_CLIENT_SECRET` (선택)

## 4. 빌드 캐시 클리어

Vercel Dashboard > Deployments > Settings > Clear Build Cache

## 5. 재배포

```bash
npm run deploy
```
