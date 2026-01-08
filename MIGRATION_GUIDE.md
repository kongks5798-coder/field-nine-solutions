# Field Nine Production Migration Guide

## 🚀 즉시 실행: 패키지 설치

터미널에서 다음 명령어를 실행하세요:

```bash
# 1. Supabase SSR 패키지 설치 (Next.js App Router용)
npm install @supabase/ssr

# 2. Supabase CLI 설치 (타입 생성용)
npm install --save-dev supabase

# 3. Python 서버용 (별도 Python 환경에서)
# pip install supabase fastapi uvicorn python-dotenv httpx
```

---

## 📋 Phase 1: Database & Security

### Step 1: Supabase SQL 스크립트 실행

1. **Supabase Dashboard 접속**: https://app.supabase.com
2. **프로젝트 선택** > **SQL Editor** 메뉴 클릭
3. **New Query** 버튼 클릭
4. `supabase/schema.sql` 파일의 전체 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭

✅ **확인사항**: 
- Table Editor에서 다음 테이블들이 생성되었는지 확인:
  - `profiles`
  - `products`
  - `locations`
  - `inventory`
  - `orders`
  - `order_items`

### Step 2: 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**값 찾는 방법**:
- Supabase Dashboard > Settings > API
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 절대 프론트엔드에 노출 금지!)

### Step 3: Middleware 확인

`middleware.ts` 파일이 프로젝트 루트에 생성되었는지 확인하세요.
이 미들웨어는 다음 경로를 보호합니다:
- `/dashboard`
- `/admin`
- `/inventory`
- `/orders`

---

## 📋 Phase 2: Connect the Brain (Python Engine + DB)

### Step 1: Python 서버 Supabase 연결

Python 서버의 `main.py` 파일을 다음과 같이 수정:

```python
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase 클라이언트 생성
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Service Role Key 사용
)

# 예시: 주문 데이터 조회
@app.get("/api/orders")
async def get_orders():
    response = supabase.table("orders").select("*").execute()
    return response.data

# 예시: 주문 생성
@app.post("/api/orders")
async def create_order(order_data: dict):
    response = supabase.table("orders").insert(order_data).execute()
    return response.data
```

### Step 2: 실제 동기화 로직 구현

기존 Mock Data 생성 로직을 삭제하고, 실제 DB 조회/업데이트 로직으로 교체:

```python
# 기존: Mock 데이터 생성
# orders = [{"id": 1, "customer": "John", ...}]

# 새로운: 실제 DB에서 조회
response = supabase.table("orders").select("*").eq("status", "pending").execute()
orders = response.data
```

---

## 📋 Phase 3: Frontend Production Build

### Step 1: TypeScript 타입 생성

Supabase에서 TypeScript 타입을 자동 생성:

```bash
# 방법 1: Supabase CLI 사용 (권장)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts

# 방법 2: Supabase Dashboard에서 직접 생성
# Dashboard > Settings > API > Generate TypeScript types
# 생성된 코드를 types/supabase.ts 파일에 저장
```

**Project ID 찾는 방법**:
- Supabase Dashboard > Settings > General > Reference ID

### Step 2: 타입 사용 예시

```typescript
import { Database } from '@/types/supabase';

type Product = Database['public']['Tables']['products']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
```

---

## 📋 Phase 4: Deployment Strategy

### Frontend: Vercel 배포

1. **GitHub에 코드 푸시**
```bash
git add .
git commit -m "Production ready"
git push origin main
```

2. **Vercel 연결**
   - https://vercel.com 접속
   - "Import Project" 클릭
   - GitHub 저장소 선택
   - 환경 변수 추가:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - "Deploy" 클릭

### Backend: Ngrok/Cloudflare Tunnel 설정

#### 옵션 1: Ngrok (간단함)

```bash
# 1. Ngrok 설치
# https://ngrok.com/download

# 2. Python 서버 실행
python main.py  # 또는 uvicorn main:app --port 8000

# 3. 별도 터미널에서 Ngrok 실행
ngrok http 8000

# 4. 생성된 URL (예: https://abc123.ngrok.io)을 복사
# 5. Vercel 환경 변수에 추가:
# PYTHON_API_URL=https://abc123.ngrok.io
```

#### 옵션 2: Cloudflare Tunnel (더 안정적)

```bash
# 1. Cloudflare Tunnel 설치
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# 2. Tunnel 생성 및 실행
cloudflared tunnel --url http://localhost:8000

# 3. 생성된 URL을 환경 변수에 추가
```

---

## ✅ 체크리스트

### Phase 1 완료 확인
- [ ] Supabase SQL 스크립트 실행 완료
- [ ] 모든 테이블 생성 확인
- [ ] RLS 정책 활성화 확인
- [ ] `.env.local` 파일 생성 및 값 입력
- [ ] `middleware.ts` 파일 확인

### Phase 2 완료 확인
- [ ] Python 서버에 Supabase 클라이언트 연결
- [ ] Mock Data 로직 제거
- [ ] 실제 DB 조회/업데이트 로직 구현
- [ ] 동기화 버튼이 실제 DB와 연동되는지 테스트

### Phase 3 완료 확인
- [ ] TypeScript 타입 생성 (`types/supabase.ts`)
- [ ] 타입 안전성 확인
- [ ] 빌드 에러 없음 확인 (`npm run build`)

### Phase 4 완료 확인
- [ ] Vercel 배포 완료
- [ ] Ngrok/Cloudflare Tunnel 설정 완료
- [ ] 프론트엔드-백엔드 통신 테스트

---

## 🆘 문제 해결

### RLS 정책 오류
```sql
-- 모든 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';

-- 정책 삭제 후 재생성
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### 타입 생성 실패
```bash
# Supabase CLI 업데이트
npm install -g supabase@latest

# 프로젝트 ID 확인
# Dashboard > Settings > General > Reference ID
```

### Middleware 오류
- 환경 변수가 제대로 설정되었는지 확인
- `@supabase/ssr` 패키지가 설치되었는지 확인

---

## 📞 다음 단계

모든 Phase가 완료되면:
1. 실제 사용자 계정 생성 및 테스트
2. 샘플 상품 데이터 입력
3. 주문 동기화 테스트
4. 성능 모니터링 설정

**Good luck! 🚀**
