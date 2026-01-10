# 🌐 Field Nine 커스텀 도메인 연결 가이드

**도메인**: fieldnine.io  
**플랫폼**: Vercel

---

## 📋 도메인 연결 단계

### 1. Vercel 대시보드에서 도메인 추가

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - Field Nine 프로젝트 선택

2. **Settings > Domains 메뉴**
   - 프로젝트 설정에서 "Domains" 클릭

3. **도메인 추가**
   - "Add Domain" 버튼 클릭
   - `fieldnine.io` 입력
   - "Add" 클릭

4. **DNS 설정 안내 확인**
   - Vercel이 제공하는 DNS 레코드 확인
   - A 레코드 또는 CNAME 레코드 값 확인

---

### 2. DNS 설정 (도메인 등록 업체에서)

도메인 등록 업체(예: GoDaddy, Namecheap, Cloudflare 등)에서 다음 DNS 레코드를 추가:

#### 옵션 A: A 레코드 사용 (권장)
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP - Vercel 대시보드에서 확인)
TTL: 3600
```

#### 옵션 B: CNAME 레코드 사용
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com (Vercel이 제공하는 값)
TTL: 3600
```

#### www 서브도메인 (선택 사항)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

---

### 3. DNS 전파 확인

DNS 변경 사항이 전파되는 데 **최대 48시간** 소요될 수 있습니다.

**확인 방법**:
```bash
# 터미널에서 확인
nslookup fieldnine.io
# 또는
dig fieldnine.io
```

**빠른 확인**:
- https://dnschecker.org 에서 전 세계 DNS 전파 상태 확인

---

### 4. SSL 인증서 자동 발급

Vercel은 도메인 연결 후 **자동으로 SSL 인증서를 발급**합니다.
- Let's Encrypt 사용
- 발급 시간: 약 5-10분

---

### 5. 도메인 연결 확인

1. **Vercel 대시보드에서 확인**
   - Settings > Domains에서 "Valid Configuration" 상태 확인

2. **브라우저에서 확인**
   - https://fieldnine.io 접속
   - SSL 인증서 확인 (자물쇠 아이콘)

---

## 🔧 문제 해결

### 503 에러 발생 시

1. **DNS 전파 확인**
   - DNS 변경 후 최대 48시간 대기
   - dnschecker.org에서 전파 상태 확인

2. **Vercel 재배포**
   ```bash
   npm run deploy
   ```

3. **도메인 설정 재확인**
   - Vercel 대시보드에서 도메인 설정 확인
   - DNS 레코드 값 재확인

### 401 에러 발생 시

1. **환경 변수 확인**
   - Vercel 대시보드 > Settings > Environment Variables
   - 모든 필수 환경 변수 설정 확인

2. **NextAuth 설정 확인**
   - `NEXTAUTH_URL`이 `https://fieldnine.io`로 설정되어 있는지 확인
   - `NEXTAUTH_SECRET` 설정 확인

---

## ✅ 완료 체크리스트

- [ ] Vercel 대시보드에서 도메인 추가
- [ ] DNS 레코드 설정 (A 또는 CNAME)
- [ ] DNS 전파 확인 (dnschecker.org)
- [ ] SSL 인증서 자동 발급 확인
- [ ] https://fieldnine.io 접속 테스트
- [ ] 로그인 기능 테스트
- [ ] AI 데모 페이지 테스트

---

## 📞 지원

문제가 지속되면:
1. Vercel 대시보드의 "Domains" 섹션에서 에러 메시지 확인
2. Vercel 문서: https://vercel.com/docs/concepts/projects/domains
3. DNS 제공업체 지원팀 문의

---

**Field Nine - 비즈니스의 미래를 함께** 🚀
