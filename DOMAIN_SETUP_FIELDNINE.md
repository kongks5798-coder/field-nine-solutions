# 🌐 fieldnine.io 도메인 설정 가이드

## 🎯 목표
fieldnine.io 도메인으로 배포하고 차익거래 기능이 완벽하게 작동하도록 설정

---

## 📋 Step 1: Vercel에 도메인 추가

### 1-1. Vercel 대시보드 접속
1. **Vercel 대시보드 접속**
   ```
   https://vercel.com/dashboard
   ```

2. **프로젝트 선택**
   - `field-nine-solutions` 프로젝트 선택

### 1-2. Domains 설정
1. **Settings → Domains 이동**
   - 상단 네비게이션: **Settings** 클릭
   - 왼쪽 사이드바: **Domains** 클릭

2. **도메인 추가**
   - "Add Domain" 버튼 클릭
   - `fieldnine.io` 입력
   - "Add" 클릭

3. **도메인 검증**
   - Vercel이 도메인 소유권을 확인
   - DNS 설정 안내가 표시됨

---

## 📋 Step 2: DNS 설정

### 2-1. DNS 제공업체 접속
- Cloudflare, GoDaddy, Namecheap 등
- fieldnine.io 도메인 관리 페이지 접속

### 2-2. DNS 레코드 추가
Vercel에서 제공하는 DNS 레코드를 추가:

#### A 레코드 (IPv4)
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

#### CNAME 레코드 (서브도메인)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

또는 Vercel이 제공하는 정확한 DNS 레코드 사용

---

## 📋 Step 3: SSL 인증서 자동 설정

### 3-1. 자동 SSL
- Vercel이 자동으로 SSL 인증서 발급
- 약 5-10분 소요

### 3-2. SSL 확인
- Settings → Domains에서 SSL 상태 확인
- "Valid" 상태가 되면 완료

---

## 📋 Step 4: 환경변수 업데이트

### 4-1. 환경변수 수정
1. **Settings → Environment Variables 이동**
2. **`NEXT_PUBLIC_ARBITRAGE_API_URL` 수정**
   - 기존 값: `https://field-nine-solutions.vercel.app`
   - 새 값: `https://fieldnine.io`

3. **Save 클릭**

### 4-2. Redeploy 실행
1. **Deployments → 최신 배포 → ... → Redeploy**
2. 배포 완료 대기 (2-3분)

---

## 📋 Step 5: 최종 확인

### 5-1. 도메인 접속 테스트
```
https://fieldnine.io
```
- 메인 페이지 접속 확인

### 5-2. 차익거래 페이지 접속
```
https://fieldnine.io/arbitrage
```
- 차익거래 대시보드 확인

### 5-3. API 연결 확인
- 브라우저 개발자 도구 (F12)
- Console 탭에서 오류 확인
- Network 탭에서 API 요청 확인

---

## ✅ 완료 체크리스트

- [ ] Vercel에 fieldnine.io 도메인 추가 완료
- [ ] DNS 레코드 설정 완료
- [ ] SSL 인증서 발급 완료
- [ ] 환경변수 업데이트 완료
- [ ] Redeploy 실행 완료
- [ ] fieldnine.io 접속 확인
- [ ] 차익거래 페이지 작동 확인

---

**보스, 이 가이드대로 따라하시면 fieldnine.io로 완벽하게 배포됩니다!** 🚀

---

**인프라 연결까지 완벽하게 준비되었습니다!** ✅
