# Field Nine: 엔터프라이즈급 통합 마케팅 분석 SaaS 플랫폼

## 시스템 아키텍처 개요

### 하이브리드 데이터베이스 전략
- **PostgreSQL (OLTP)**: 사용자, 테넌트, 계정 연동 정보
- **ClickHouse (OLAP)**: 대용량 마케팅 성과 데이터

### 백엔드 아키텍처
- **NestJS**: 모듈식 백엔드 (커넥터 패턴)
- **BullMQ**: 비동기 작업 큐 (Redis)
- **헥사고날 아키텍처**: 비즈니스 로직과 외부 의존성 분리

### 프론트엔드
- **Next.js 15**: App Router, Server Components
- **React Query**: 클라이언트 데이터 페칭
- **Tremor**: 대시보드 차트

### 멀티 테넌시
- **PostgreSQL**: Schema-per-Tenant
- **ClickHouse**: tenant_id 파티셔닝
