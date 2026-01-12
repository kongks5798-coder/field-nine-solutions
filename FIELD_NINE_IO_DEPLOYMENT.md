# 🚀 fieldnine.io 완벽 배포 가이드

## 🎯 목표
fieldnine.io 도메인으로 배포하고 차익거래 기능이 완벽하게 작동하도록 설정

---

## ✅ 완료된 작업

### 1. 코드 수정 완료
- [x] 메인 페이지를 차익거래 페이지로 자동 리다이렉트
- [x] API URL 자동 감지 로직 추가 (프로덕션/개발 환경 자동 구분)
- [x] 차익거래 페이지 컴포넌트 확인

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
   - "Add Domain" 또는 "Add" 버튼 클릭
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

#### 방법 1: Vercel 네임서버 사용 (권장)
```
Vercel이 제공하는 네임서버로 변경
```

#### 방법 2: A 레코드 추가
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

#### 방법 3: CNAME 레코드 추가
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: Auto
```

**⚠️ 주의**: Vercel 대시보드에서 정확한 DNS 레코드를 확인하세요!

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
   - 기존 값 확인
   - 새 값: `https://fieldnine.io`
   - 또는 환경변수 제거 (자동 감지 로직 사용)

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
- 메인 페이지가 차익거래 페이지로 자동 리다이렉트되는지 확인

### 5-2. 차익거래 페이지 접속
```
https://fieldnine.io/arbitrage
```
- 차익거래 대시보드가 정상적으로 표시되는지 확인
- WebSocket 연결 확인
- 실시간 데이터 업데이트 확인

### 5-3. API 연결 확인
1. **브라우저 개발자 도구 (F12)**
2. **Console 탭**
   - 오류 메시지 확인
   - 환경변수 값 확인
3. **Network 탭**
   - API 요청이 정상적으로 전송되는지 확인
   - 200 상태 코드 확인

---

## ✅ 완료 체크리스트

### 도메인 설정
- [ ] Vercel에 fieldnine.io 도메인 추가 완료
- [ ] DNS 레코드 설정 완료
- [ ] SSL 인증서 발급 완료

### 환경변수
- [ ] 환경변수 업데이트 완료 (또는 자동 감지 사용)
- [ ] Redeploy 실행 완료

### 기능 확인
- [ ] fieldnine.io 접속 확인
- [ ] 메인 페이지 → 차익거래 페이지 리다이렉트 확인
- [ ] 차익거래 대시보드 표시 확인
- [ ] WebSocket 연결 확인
- [ ] 실시간 데이터 업데이트 확인
- [ ] API 요청 정상 작동 확인

---

## 🚨 문제 해결

### 문제 1: 도메인이 연결되지 않음
**해결**:
1. DNS 레코드 설정 확인
2. DNS 전파 대기 (최대 48시간, 보통 몇 분)
3. Vercel 대시보드에서 도메인 상태 확인

### 문제 2: SSL 인증서 발급 실패
**해결**:
1. DNS 레코드가 정확한지 확인
2. Vercel 대시보드에서 SSL 상태 확인
3. 몇 분 더 대기 후 재확인

### 문제 3: 차익거래 페이지가 작동하지 않음
**해결**:
1. 브라우저 개발자 도구에서 오류 확인
2. API URL이 정확한지 확인
3. 환경변수 재확인 및 Redeploy

---

## 🎉 완료!

**보스, 이 가이드대로 따라하시면 fieldnine.io로 완벽하게 배포됩니다!** 🚀

모든 기능이 정상적으로 작동할 겁니다! ✅

---

**인프라 연결까지 완벽하게 준비되었습니다!** ✅
