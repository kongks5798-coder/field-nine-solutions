# 🚀 즉시 배포 가이드

## ✅ 배포 준비 완료!

### 1. Vercel 자동 배포 (GitHub 연동)

GitHub에 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "deploy: 차익거래 엔진 배포"
git push origin main
```

### 2. 수동 배포 (Vercel CLI)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### 3. 환경변수 설정

Vercel 대시보드에서 설정:

**프론트엔드:**
```env
NEXT_PUBLIC_ARBITRAGE_API_URL=https://your-api-url.vercel.app
```

**백엔드 API (별도 배포 시):**
```env
DEEPSEEK_API_KEY=sk-...
BINANCE_API_KEY=...
BINANCE_API_SECRET=...
UPBIT_API_KEY=...
UPBIT_API_SECRET=...
```

---

## 📋 배포 체크리스트

- [x] 프론트엔드 빌드 성공
- [x] 배포 스크립트 준비
- [ ] Vercel 환경변수 설정
- [ ] 배포 실행

---

## 🎯 다음 단계

1. **GitHub에 푸시** → Vercel 자동 배포
2. **환경변수 설정** → Vercel 대시보드
3. **배포 확인** → URL 접속 테스트

---

**보스, 배포 준비 완료! 바로 배포 가능합니다!** 🚀
