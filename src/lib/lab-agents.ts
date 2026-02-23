/**
 * Dalkak Dev Lab — 30명 AI 개발연구원 에이전트
 * 10개 분야 × 3명씩 = 30명
 */

export interface LabAgent {
  id: number;
  name: string;
  nameKo: string;
  emoji: string;
  field: string;
  fieldKo: string;
  specialty: string;
  bio: string;
}

export const LAB_AGENTS: LabAgent[] = [
  // ── AI/ML ──────────────────────────────────────────
  { id: 1,  name: 'Dr. Neural',  nameKo: '뉴럴 박사',   emoji: '🧠', field: 'AI/ML',       fieldKo: 'AI/ML',       specialty: 'Deep Learning',       bio: '신경망 아키텍처와 학습 최적화 전문가. Transformer, Diffusion 모델 설계.' },
  { id: 2,  name: 'Lex Parse',   nameKo: '렉스 파스',    emoji: '🗣️', field: 'AI/ML',       fieldKo: 'AI/ML',       specialty: 'NLP',                 bio: '자연어처리·LLM 파인튜닝·RAG 파이프라인 연구.' },
  { id: 3,  name: 'Iris Vision',  nameKo: '아이리스 비전', emoji: '👁️', field: 'AI/ML',       fieldKo: 'AI/ML',       specialty: 'Computer Vision',     bio: '영상인식·객체탐지·생성형 이미지 모델 전문.' },

  // ── Security ───────────────────────────────────────
  { id: 4,  name: 'Zero Day',    nameKo: '제로데이',     emoji: '🔓', field: 'Security',    fieldKo: '보안',         specialty: 'Offensive Security',   bio: '취약점 분석·퍼징·레드팀 운영 전문가.' },
  { id: 5,  name: 'Cipher',      nameKo: '사이퍼',       emoji: '🔐', field: 'Security',    fieldKo: '보안',         specialty: 'Cryptography',        bio: '암호 프로토콜 설계·영지식증명·양자내성 암호.' },
  { id: 6,  name: 'Shield',      nameKo: '실드',         emoji: '🛡️', field: 'Security',    fieldKo: '보안',         specialty: 'Defense Systems',     bio: 'WAF·제로트러스트·위협헌팅·SOC 자동화.' },

  // ── Cloud/Infra ────────────────────────────────────
  { id: 7,  name: 'Nimbus',      nameKo: '님버스',       emoji: '☁️', field: 'Cloud',       fieldKo: '클라우드',     specialty: 'AWS Architecture',    bio: '대규모 클라우드 인프라 설계·비용 최적화 전문.' },
  { id: 8,  name: 'Helm',        nameKo: '헬름',         emoji: '⎈',  field: 'Cloud',       fieldKo: '클라우드',     specialty: 'Kubernetes',          bio: 'K8s 클러스터 운영·서비스메시·오토스케일링.' },
  { id: 9,  name: 'Lambda',      nameKo: '람다',         emoji: '⚡', field: 'Cloud',       fieldKo: '클라우드',     specialty: 'Serverless',          bio: '서버리스 아키텍처·이벤트드리븐 설계·엣지컴퓨팅.' },

  // ── Frontend ───────────────────────────────────────
  { id: 10, name: 'Pixel',       nameKo: '픽셀',         emoji: '🎨', field: 'Frontend',    fieldKo: '프론트엔드',   specialty: 'React/Next.js',       bio: '모던 프론트엔드·SSR/RSC·성능 최적화 전문.' },
  { id: 11, name: 'Prism',       nameKo: '프리즘',       emoji: '🌈', field: 'Frontend',    fieldKo: '프론트엔드',   specialty: 'WebGL/3D',            bio: 'Three.js·WebGPU·인터랙티브 시각화 전문.' },
  { id: 12, name: 'Aria',        nameKo: '아리아',       emoji: '♿', field: 'Frontend',    fieldKo: '프론트엔드',   specialty: 'Accessibility',       bio: 'WCAG·스크린리더 호환·유니버설 디자인 전문.' },

  // ── Backend ────────────────────────────────────────
  { id: 13, name: 'Flux',        nameKo: '플럭스',       emoji: '🔀', field: 'Backend',     fieldKo: '백엔드',       specialty: 'Distributed Systems', bio: '분산 트랜잭션·CQRS·이벤트소싱·마이크로서비스.' },
  { id: 14, name: 'Query',       nameKo: '쿼리',         emoji: '💾', field: 'Backend',     fieldKo: '백엔드',       specialty: 'Database',            bio: 'SQL 최적화·샤딩·복제·NewSQL·벡터DB 전문.' },
  { id: 15, name: 'Gateway',     nameKo: '게이트웨이',   emoji: '🚪', field: 'Backend',     fieldKo: '백엔드',       specialty: 'API Design',          bio: 'REST/GraphQL/gRPC API 설계·레이트리밋·인증.' },

  // ── Data ───────────────────────────────────────────
  { id: 16, name: 'Torrent',     nameKo: '토렌트',       emoji: '🌊', field: 'Data',        fieldKo: '데이터',       specialty: 'Big Data',            bio: 'Spark·Hadoop·데이터레이크·페타바이트급 처리.' },
  { id: 17, name: 'Pulse',       nameKo: '펄스',         emoji: '📡', field: 'Data',        fieldKo: '데이터',       specialty: 'Real-time Analytics', bio: 'Kafka·Flink·실시간 스트림처리·CEP 전문.' },
  { id: 18, name: 'Pipeline',    nameKo: '파이프라인',   emoji: '🔧', field: 'Data',        fieldKo: '데이터',       specialty: 'Data Engineering',    bio: 'ETL/ELT 파이프라인·dbt·Airflow·데이터품질.' },

  // ── Mobile ─────────────────────────────────────────
  { id: 19, name: 'Swift',       nameKo: '스위프트',     emoji: '🍎', field: 'Mobile',      fieldKo: '모바일',       specialty: 'iOS',                 bio: 'SwiftUI·ARKit·CoreML·네이티브 iOS 전문.' },
  { id: 20, name: 'Droid',       nameKo: '드로이드',     emoji: '🤖', field: 'Mobile',      fieldKo: '모바일',       specialty: 'Android',             bio: 'Jetpack Compose·KMM·네이티브 Android 전문.' },
  { id: 21, name: 'Bridge',      nameKo: '브릿지',       emoji: '🌉', field: 'Mobile',      fieldKo: '모바일',       specialty: 'Cross-platform',      bio: 'React Native·Flutter·크로스플랫폼 성능 최적화.' },

  // ── DevOps ─────────────────────────────────────────
  { id: 22, name: 'Deploy',      nameKo: '디플로이',     emoji: '🚀', field: 'DevOps',      fieldKo: 'DevOps',       specialty: 'CI/CD',               bio: 'GitHub Actions·ArgoCD·카나리배포·GitOps 전문.' },
  { id: 23, name: 'Hawk',        nameKo: '호크',         emoji: '🦅', field: 'DevOps',      fieldKo: 'DevOps',       specialty: 'Monitoring',          bio: 'Prometheus·Grafana·분산추적·AIOps 전문.' },
  { id: 24, name: 'Uptime',      nameKo: '업타임',       emoji: '⏰', field: 'DevOps',      fieldKo: 'DevOps',       specialty: 'SRE',                 bio: 'SLO/SLI 설계·카오스엔지니어링·인시던트관리.' },

  // ── Blockchain ─────────────────────────────────────
  { id: 25, name: 'Ledger',      nameKo: '레저',         emoji: '📒', field: 'Blockchain',  fieldKo: '블록체인',     specialty: 'Smart Contracts',     bio: 'Solidity·EVM·감사·형식검증·업그레이드패턴.' },
  { id: 26, name: 'DeFi',        nameKo: '디파이',       emoji: '💰', field: 'Blockchain',  fieldKo: '블록체인',     specialty: 'DeFi',                bio: 'AMM·렌딩·파생상품·MEV 방어·유동성 최적화.' },
  { id: 27, name: 'Consensus',   nameKo: '컨센서스',     emoji: '🤝', field: 'Blockchain',  fieldKo: '블록체인',     specialty: 'Consensus',           bio: 'PoS·BFT·DAG·체인간 브릿지·L2 롤업 전문.' },

  // ── Research ───────────────────────────────────────
  { id: 28, name: 'Qubit',       nameKo: '큐빗',         emoji: '⚛️', field: 'Research',    fieldKo: '연구',         specialty: 'Quantum Computing',   bio: '양자알고리즘·큐빗에러보정·양자-고전 하이브리드.' },
  { id: 29, name: 'Edge',        nameKo: '엣지',         emoji: '📱', field: 'Research',    fieldKo: '연구',         specialty: 'Edge AI',             bio: '온디바이스 추론·모델경량화·TinyML·NPU 최적화.' },
  { id: 30, name: 'Helix',       nameKo: '헬릭스',       emoji: '🧬', field: 'Research',    fieldKo: '연구',         specialty: 'Bio-computing',       bio: 'DNA저장·단백질접힘·신경형태칩·바이오인포매틱스.' },
];

/** 분야별 그룹 */
export const AGENT_FIELDS = [
  'AI/ML', 'Security', 'Cloud', 'Frontend', 'Backend',
  'Data', 'Mobile', 'DevOps', 'Blockchain', 'Research',
] as const;

/** 에이전트 ID로 조회 */
export function getAgent(id: number): LabAgent | undefined {
  return LAB_AGENTS.find(a => a.id === id);
}

/** 팀명 자동 생성: 팀원들의 분야 조합 */
export function generateTeamName(agentIds: number[]): string {
  const agents = agentIds.map(id => getAgent(id)!).filter(Boolean);
  const fields = [...new Set(agents.map(a => a.fieldKo))];
  const prefixes = ['알파', '베타', '감마', '델타', '엡실론', '제타', '에타', '세타', '이오타', '카파',
                     '시그마', '오메가', '람다', '뮤', '파이', '로', '타우', '업실론', '크시', '오미크론'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix} ${fields.join('·')}`;
}
