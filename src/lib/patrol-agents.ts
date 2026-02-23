/**
 * Dalkak Patrol Agent Team — 9명 순찰 에이전트
 * 3개 팀 × 3명씩 = 9명
 *
 * Team Shield (관리) — 코드 품질·보안·총괄
 * Team Engine (유지) — 성능·테스트·문서
 * Team Medic  (보수) — 빌드 수정·모니터링·패치
 */

export type PatrolTeam = 'management' | 'maintenance' | 'repair';

export interface PatrolAgent {
  id: number;
  name: string;
  nameKo: string;
  emoji: string;
  team: PatrolTeam;
  teamName: string;
  role: string;
  specialty: string;
  bio: string;
}

export const PATROL_AGENTS: PatrolAgent[] = [
  // ── Team Shield (관리) ────────────────────────────────
  {
    id: 1,
    name: 'Captain',
    nameKo: '캡틴',
    emoji: '🎖️',
    team: 'management',
    teamName: 'Team Shield',
    role: '팀 총괄',
    specialty: '이슈 우선순위 결정, 상태 보고',
    bio: '순찰팀 총괄 지휘관. 모든 팀의 보고를 취합하고 이슈 우선순위를 결정하여 최종 상태 보고서를 작성한다.',
  },
  {
    id: 2,
    name: 'Scanner',
    nameKo: '스캐너',
    emoji: '📡',
    team: 'management',
    teamName: 'Team Shield',
    role: '코드 품질 감시',
    specialty: 'TypeScript 에러 탐지, 린트',
    bio: '코드베이스를 실시간으로 스캔하여 TypeScript 에러, 린트 위반, 코드 품질 저하를 탐지하는 감시 전문가.',
  },
  {
    id: 3,
    name: 'Auditor',
    nameKo: '감사관',
    emoji: '🔍',
    team: 'management',
    teamName: 'Team Shield',
    role: '보안 감사',
    specialty: '의존성 취약점, API키 노출 감시',
    bio: '보안 취약점과 API 키 노출을 추적하는 보안 감사 전문가. 하드코딩된 비밀정보와 .env 유출을 방지한다.',
  },

  // ── Team Engine (유지) ────────────────────────────────
  {
    id: 4,
    name: 'Optimizer',
    nameKo: '옵티마이저',
    emoji: '⚡',
    team: 'maintenance',
    teamName: 'Team Engine',
    role: '성능 최적화',
    specialty: '번들 사이즈, 메모리 누수 탐지',
    bio: '번들 사이즈 분석과 메모리 누수 탐지로 플랫폼 성능을 극한까지 끌어올리는 최적화 전문가.',
  },
  {
    id: 5,
    name: 'Tester',
    nameKo: '테스터',
    emoji: '🧪',
    team: 'maintenance',
    teamName: 'Team Engine',
    role: '테스트 관리',
    specialty: '테스트 커버리지 유지, 회귀 테스트',
    bio: '테스트 커버리지를 유지하고 회귀 테스트를 실행하며, 부족한 영역에 새 테스트를 작성하는 품질 보증 전문가.',
  },
  {
    id: 6,
    name: 'Documenter',
    nameKo: '문서관',
    emoji: '📝',
    team: 'maintenance',
    teamName: 'Team Engine',
    role: '문서화 관리',
    specialty: 'API 문서화, 변경사항 추적',
    bio: 'API 문서와 CHANGELOG를 최신 상태로 유지하고, 코드 변경사항을 체계적으로 추적하는 기록 전문가.',
  },

  // ── Team Medic (보수) ─────────────────────────────────
  {
    id: 7,
    name: 'Fixer',
    nameKo: '수리공',
    emoji: '🔧',
    team: 'repair',
    teamName: 'Team Medic',
    role: '빌드 에러 수정',
    specialty: '빌드 에러 자동 수정, 런타임 에러 대응',
    bio: '빌드 에러와 런타임 에러를 즉시 감지하고 자동으로 수정하는 긴급 대응 전문가.',
  },
  {
    id: 8,
    name: 'Guardian',
    nameKo: '가디언',
    emoji: '🛡️',
    team: 'repair',
    teamName: 'Team Medic',
    role: '서비스 모니터링',
    specialty: '헬스체크, 장애 대응',
    bio: '서비스 가용성을 24시간 모니터링하고 헬스체크를 수행하며, 장애 발생 시 즉시 대응하는 수호 전문가.',
  },
  {
    id: 9,
    name: 'Patcher',
    nameKo: '패쳐',
    emoji: '🩹',
    team: 'repair',
    teamName: 'Team Medic',
    role: '의존성 관리',
    specialty: '의존성 업데이트, 마이그레이션',
    bio: '의존성 업데이트와 마이그레이션을 담당하며, 호환성 패치를 통해 플랫폼 안정성을 유지하는 정비 전문가.',
  },
];

/* ── 팀 메타데이터 ──────────────────────────────────── */

export interface PatrolTeamMeta {
  id: PatrolTeam;
  name: string;
  nameKo: string;
  emoji: string;
  description: string;
}

export const PATROL_TEAMS: PatrolTeamMeta[] = [
  {
    id: 'management',
    name: 'Team Shield',
    nameKo: '관리',
    emoji: '🛡️',
    description: '코드 품질 감시, TypeScript 에러 탐지, 보안 감사',
  },
  {
    id: 'maintenance',
    name: 'Team Engine',
    nameKo: '유지',
    emoji: '⚙️',
    description: '성능 최적화, 테스트 커버리지, 문서화 관리',
  },
  {
    id: 'repair',
    name: 'Team Medic',
    nameKo: '보수',
    emoji: '🏥',
    description: '빌드 에러 수정, 서비스 모니터링, 의존성 패치',
  },
];

/* ── 헬퍼 함수 ──────────────────────────────────────── */

/** 에이전트 ID로 조회 */
export function getPatrolAgent(id: number): PatrolAgent | undefined {
  return PATROL_AGENTS.find(a => a.id === id);
}

/** 팀별 에이전트 목록 */
export function getTeamAgents(team: PatrolTeam): PatrolAgent[] {
  return PATROL_AGENTS.filter(a => a.team === team);
}

/** 팀 메타데이터 조회 */
export function getTeamMeta(team: PatrolTeam): PatrolTeamMeta | undefined {
  return PATROL_TEAMS.find(t => t.id === team);
}

/** 전체 팀 수 */
export const PATROL_TEAM_COUNT = PATROL_TEAMS.length;

/** 전체 에이전트 수 */
export const PATROL_AGENT_COUNT = PATROL_AGENTS.length;
