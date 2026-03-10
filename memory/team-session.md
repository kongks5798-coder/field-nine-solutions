# Team Session: v0.dev급 워크스페이스 리디자인 — 2026-03-10

## [ANALYST]
현재 문제:
- 상단 버튼 10개 이상 (Agent/Economy/Power/Turbo/다크/성능/캡처/공유/배포/실험/딸깍AI/토큰/스택블리츠)
- 파이프라인 에이전트 뷰 항상 노출
- 콘솔 에러 패널 항상 노출
- 3패널 레이아웃(채팅|에디터|프리뷰) — 에디터가 항상 보임

목표: v0.dev처럼 채팅(좌) | 프리뷰/코드탭(우) 2패널, 상단 3버튼

## [ARCHITECT]
설계 완료:

### 새 레이아웃 구조
```
┌─────────────────────────────────────────────────────┐
│ [딸깍] 프로젝트명    [코드|프리뷰 탭]    [▶ 배포]   │  ← 48px top bar
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   채팅 패널          │   프리뷰  (기본)             │
│   (AiChatPanel)      │   ─ 또는 ─                   │
│   고정 280px         │   코드 에디터  (탭 전환)     │
│                      │                              │
│   [입력창]           │                              │
└──────────────────────┴──────────────────────────────┘
  (에러 있을 때만 하단에 얇은 에러 바)
```

### DEVELOPER-A: WorkspaceTopBar 단순화
파일: `src/app/workspace/WorkspaceTopBar.tsx`
- 제거: Agent/Economy/Power/Turbo/다크모드/성능프로파일러/캡처/실험/토큰/스택블리츠 버튼 전부
- 유지: 딸깍 로고, 프로젝트명(편집가능), 저장상태, 생성중표시
- 추가: 코드/프리뷰 탭 버튼 (중앙), 배포 버튼 (우측 하나만)
- Props에 `activeTab: "preview"|"code"`, `onTabChange` 추가

### DEVELOPER-B: WorkspaceShell 2패널화
파일: `src/app/workspace/WorkspaceShell.tsx` (또는 page.tsx 레이아웃)
- 기존 3패널(좌채팅+중에디터+우프리뷰) → 2패널(좌채팅+우탭패널)
- 우측 패널: activeTab === "preview" → 프리뷰 iframe, "code" → 코드에디터
- 파이프라인 에이전트 뷰: 완전 제거 (UI에서만, 내부 로직은 유지)
- 콘솔 패널: 에러 있을 때만 하단에 32px 에러 바로 대체
  - "JS 에러 4개 · AI 자동수정" 클릭 시 펼쳐짐

### 상태 관리
- `activeTab: "preview"|"code"` — page.tsx에 useState로 추가
- TopBar에 prop으로 전달
- WorkspaceShell에 prop으로 전달

## [DEVELOPER]
진행 중...

## [REVIEWER]
대기 중...
