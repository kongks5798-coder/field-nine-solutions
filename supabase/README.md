# K-Universal Supabase Setup

## Database Schema

이 디렉토리에는 K-Universal 시스템의 Supabase 데이터베이스 스키마가 포함되어 있습니다.

### 스키마 실행 방법

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 로그인
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - "New query" 버튼 클릭

3. **스키마 실행**
   - `migrations/schema_k_universal_v1.sql` 파일의 내용을 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **Storage Buckets 생성**
   - 좌측 메뉴에서 "Storage" 클릭
   - "Create a new bucket" 클릭
   - Bucket 이름: `passport-images` (Private)
   - Bucket 이름: `kyc-documents` (Private)

### 환경 변수 설정

`.env.local` 파일에 다음 변수들을 추가하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 테이블 구조

#### 1. `profiles`
- 사용자 프로필 및 KYC 상태 관리

#### 2. `passport_data`
- 여권 OCR 데이터 저장 (암호화)

#### 3. `ghost_wallets`
- 비수탁형 암호화폐 지갑 정보

#### 4. `wallet_transactions`
- 지갑 트랜잭션 히스토리

#### 5. `kyc_audit_logs`
- 규정 준수를 위한 감사 로그 (7년 보관)

### Row Level Security (RLS)

모든 테이블에 RLS가 활성화되어 있으며, 사용자는 자신의 데이터만 접근할 수 있습니다.

### 인덱스 최적화

성능을 위해 다음 인덱스가 생성됩니다:
- 사용자 ID 기반 조회
- KYC 상태 필터링
- 트랜잭션 시간순 정렬
- 지갑 주소 검색

### 자동 트리거

- `updated_at` 자동 업데이트
- 신규 사용자 가입 시 프로필 자동 생성
