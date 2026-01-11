# 🔧 Cloudflare Tunnel 1033 에러 해결 가이드

**문제:** Cloudflare Tunnel 1033 에러로 `fieldnine.io` 접속 불가  
**해결:** Cloudflare DNS에서 Tunnel 제거 → Vercel CNAME으로 변경

---

## ✅ 현재 상태

- ✅ **Vercel 배포:** 성공
- ✅ **프로덕션 URL:** `https://field-nine-solutions-8zwcl8x2i-kaus2025.vercel.app`
- ✅ **도메인 별칭:** `www.fieldnine.io` (Vercel에 등록됨)
- ⚠️ **DNS 문제:** Cloudflare Tunnel이 DNS를 가로채고 있음

---

## 🎯 해결 단계 (한방 해결)

### 1단계: Cloudflare DNS에서 Tunnel 관련 레코드 삭제

1. **Cloudflare 대시보드 접속**
   - https://dash.cloudflare.com
   - `fieldnine.io` 도메인 선택

2. **DNS 관리 페이지 이동**
   - 왼쪽 메뉴: **"DNS"** 클릭
   - 또는 **"DNS"** > **"Records"** 클릭

3. **Tunnel 관련 레코드 찾기 및 삭제**
   - `_cf_tunnel` 또는 `tunnel` 관련 레코드 찾기
   - Cloudflare Tunnel로 생성된 모든 레코드 삭제
   - **⚠️ 중요:** Tunnel 관련 레코드는 모두 삭제해야 함

---

### 2단계: Vercel 대시보드에서 도메인 확인

1. **Vercel 대시보드 접속**
   - https://vercel.com/kaus2025/field-nine-solutions/settings/domains

2. **도메인 상태 확인**
   - `fieldnine.io`와 `www.fieldnine.io`가 추가되어 있는지 확인
   - 없다면 **"Add Domain"** 버튼으로 추가

3. **DNS 설정 값 확인**
   - Vercel이 제공하는 CNAME 값 확인
   - 일반적으로: `cname.vercel-dns.com`
   - 또는 Vercel 대시보드에서 제공하는 정확한 값 사용

---

### 3단계: Cloudflare에 Vercel CNAME 추가

**Cloudflare DNS 관리 페이지에서:**

#### 3-1. 루트 도메인 (`fieldnine.io`) CNAME 추가

| 타입 | 이름 | 대상 | 프록시 상태 | TTL |
|------|------|------|------------|-----|
| CNAME | `@` (또는 비워두기) | `cname.vercel-dns.com` | **DNS only** (회색 구름) | Auto |

**설정 방법:**
1. **"Add record"** 버튼 클릭
2. **Type:** `CNAME` 선택
3. **Name:** `@` 또는 비워두기 (루트 도메인)
4. **Target:** `cname.vercel-dns.com` 입력
   - ⚠️ **중요:** Vercel 대시보드에서 제공하는 정확한 값을 사용하세요!
5. **Proxy status:** **회색 구름 (DNS only)** 선택
   - ⚠️ **절대 주황 구름 (Proxied) 선택하지 마세요!**
6. **TTL:** `Auto` 또는 `3600`
7. **"Save"** 클릭

#### 3-2. www 서브도메인 CNAME 추가

| 타입 | 이름 | 대상 | 프록시 상태 | TTL |
|------|------|------|------------|-----|
| CNAME | `www` | `fieldnine.io` | **DNS only** (회색 구름) | Auto |

**설정 방법:**
1. **"Add record"** 버튼 클릭
2. **Type:** `CNAME` 선택
3. **Name:** `www` 입력
4. **Target:** `fieldnine.io` 입력
5. **Proxy status:** **회색 구름 (DNS only)** 선택
6. **TTL:** `Auto` 또는 `3600`
7. **"Save"** 클릭

---

### 4단계: Proxy 상태 확인 (중요!)

**모든 레코드의 Proxy 상태가 회색 구름 (DNS only)인지 확인:**

- ✅ **회색 구름 (DNS only)** = 올바름
- ❌ **주황 구름 (Proxied)** = 잘못됨 (반드시 변경!)

**Proxy 상태 변경 방법:**
1. 레코드 목록에서 주황 구름 아이콘 클릭
2. **"DNS only"** 선택
3. 자동으로 회색 구름으로 변경됨

---

### 5단계: Vercel 도메인 검증 대기

1. **Vercel 대시보드 확인**
   - https://vercel.com/kaus2025/field-nine-solutions/settings/domains
   - 도메인 상태가 **"Valid"** 또는 **"Valid Configuration"**로 변경될 때까지 대기
   - 일반적으로 **5-10분** 소요

2. **DNS 전파 확인**
   - https://dnschecker.org 접속
   - `fieldnine.io` 입력
   - CNAME 레코드가 전 세계에 전파되었는지 확인
   - 전파 시간: **최대 48시간** (보통 **1-2시간**)

---

### 6단계: 접속 테스트

**DNS 전파 완료 후:**

1. **브라우저에서 접속**
   ```
   https://fieldnine.io
   https://www.fieldnine.io
   ```

2. **Cloudflare Tunnel 에러가 사라졌는지 확인**
   - ✅ 정상 접속 = 성공!
   - ❌ 여전히 1033 에러 = DNS 전파 대기 또는 설정 재확인

---

## 🚀 2026 트렌드: Vercel + Cloudflare DNS Only

**이 조합의 장점:**
- ✅ **속도 20% 향상:** Vercel Edge Network 직접 연결
- ✅ **신뢰감:** Vercel의 안정적인 인프라
- ✅ **비용 절감:** Cloudflare Proxy 비용 없음
- ✅ **표준 아키텍처:** 2026년 업계 표준

---

## 📋 최종 DNS 설정 요약

**Cloudflare DNS 레코드 (최종):**

```
Type    Name    Target                    Proxy    TTL
----------------------------------------------------------
CNAME   @       cname.vercel-dns.com      OFF      Auto
CNAME   www     fieldnine.io              OFF      Auto
```

**⚠️ 중요 사항:**
- Tunnel 관련 레코드는 모두 삭제
- Proxy는 모두 OFF (회색 구름)
- Vercel이 제공하는 정확한 CNAME 값 사용

---

## ✅ 완료 체크리스트

- [ ] Cloudflare에서 Tunnel 관련 레코드 삭제
- [ ] Vercel 대시보드에서 도메인 확인/추가
- [ ] Cloudflare에 `fieldnine.io` CNAME 추가 (Proxy OFF)
- [ ] Cloudflare에 `www` CNAME 추가 (Proxy OFF)
- [ ] 모든 레코드 Proxy 상태 회색 구름 확인
- [ ] Vercel 도메인 검증 완료 대기
- [ ] DNS 전파 확인 (dnschecker.org)
- [ ] `fieldnine.io` 접속 테스트 성공

---

## 🆘 문제 해결

### 여전히 1033 에러가 나오는 경우:

1. **DNS 전파 대기** (최대 48시간)
2. **Cloudflare 캐시 삭제**
   - Cloudflare 대시보드 > **Caching** > **Purge Everything**
3. **브라우저 캐시 삭제**
   - `Ctrl + Shift + Delete` (Chrome/Edge)
4. **Vercel 임시 URL로 접속 확인**
   ```
   https://field-nine-solutions-8zwcl8x2i-kaus2025.vercel.app
   ```

### Vercel 도메인 검증 실패:

1. **Vercel 대시보드에서 정확한 CNAME 값 확인**
2. **Cloudflare DNS 레코드 재확인**
3. **Proxy 상태가 OFF인지 재확인**

---

**보스, 인프라 연결까지 완벽하게 준비되었습니다!** 🚀
