# 🔧 Cloudflare Challenge 해결 가이드

## 🚨 문제 상황

`fieldnine.io` 접속 시 Cloudflare Challenge 페이지가 나타남:
- "계속하려면 Challenges.cloudflare.com을 사랑하세요" 메시지
- 사이트 접속 불가

## 🎯 원인

Cloudflare가 도메인을 프록시하고 있어서 자동으로 보안 챌린지를 표시하고 있습니다.

## ✅ 해결 방법

### 방법 1: Cloudflare 프록시 끄기 (권장)

#### 1단계: Cloudflare 대시보드 접속
1. https://dash.cloudflare.com 접속
2. `fieldnine.io` 도메인 선택

#### 2단계: DNS 레코드 확인 및 수정
1. 왼쪽 메뉴에서 **"DNS"** → **"Records"** 클릭
2. `fieldnine.io`와 `www.fieldnine.io` 레코드 찾기
3. 각 레코드의 **프록시 상태** 확인:
   - 🟠 **주황색 구름 (Proxied)** = 프록시 ON (Challenge 발생)
   - ⚪ **회색 구름 (DNS only)** = 프록시 OFF (Challenge 없음)

#### 3단계: 프록시 끄기
1. 각 레코드의 **구름 아이콘** 클릭
2. **"DNS only"** (회색 구름)로 변경
3. **"Save"** 클릭

**설정 예시:**

| 타입 | 이름 | 대상 | 프록시 상태 | TTL |
|------|------|------|------------|-----|
| CNAME | `@` | `cname.vercel-dns.com` | **DNS only** (회색) | Auto |
| CNAME | `www` | `fieldnine.io` | **DNS only** (회색) | Auto |

#### 4단계: DNS 전파 대기
- 변경 사항이 전파되는 데 **5-10분** 소요
- 브라우저 캐시를 지우고 다시 접속

---

### 방법 2: Cloudflare 보안 설정 조정

#### 1단계: Cloudflare 대시보드 접속
1. https://dash.cloudflare.com 접속
2. `fieldnine.io` 도메인 선택

#### 2단계: 보안 설정 변경
1. 왼쪽 메뉴에서 **"Security"** → **"Settings"** 클릭
2. **"Security Level"** 찾기
3. **"Medium"** 또는 **"Low"**로 변경
4. **"Challenge Passage"** 시간 조정 (선택 사항)

#### 3단계: Firewall Rules 확인
1. 왼쪽 메뉴에서 **"Security"** → **"WAF"** 클릭
2. 활성화된 규칙 확인
3. 필요시 규칙 비활성화 또는 수정

---

### 방법 3: Vercel 직접 연결 (Cloudflare 우회)

#### 1단계: Cloudflare에서 도메인 제거
1. Cloudflare 대시보드에서 `fieldnine.io` 제거
2. 또는 DNS를 Cloudflare에서 다른 DNS 제공업체로 변경

#### 2단계: Vercel 네임서버 사용
1. Vercel 대시보드 → Settings → Domains
2. `fieldnine.io` 선택
3. Vercel이 제공하는 네임서버로 변경

---

## 🎯 권장 해결 방법

**가장 간단한 방법: 프록시 끄기**

1. Cloudflare DNS에서 모든 레코드의 프록시를 **OFF (DNS only)**로 변경
2. 5-10분 대기
3. 브라우저 캐시 지우고 다시 접속

이렇게 하면:
- ✅ Cloudflare Challenge가 사라집니다
- ✅ Vercel이 직접 SSL을 관리합니다
- ✅ 사이트가 정상적으로 작동합니다

---

## 📋 체크리스트

- [ ] Cloudflare 대시보드 접속
- [ ] DNS 레코드 확인
- [ ] 프록시 상태를 "DNS only"로 변경
- [ ] 5-10분 대기 (DNS 전파)
- [ ] 브라우저 캐시 지우기
- [ ] `https://fieldnine.io` 접속 확인

---

## 💡 참고사항

### 프록시를 끄면:
- ✅ Challenge가 사라집니다
- ✅ Vercel이 SSL을 직접 관리합니다
- ✅ 성능은 거의 동일합니다
- ⚠️ Cloudflare의 DDoS 보호는 여전히 작동합니다 (DNS 레벨)

### 프록시를 켜두면:
- ✅ Cloudflare의 추가 보안 기능 사용 가능
- ❌ Challenge가 계속 나타날 수 있습니다
- ❌ Vercel과의 연동이 복잡해질 수 있습니다

---

**보스, 프록시를 끄면 Challenge가 사라지고 사이트가 정상적으로 작동합니다!** 🚀
