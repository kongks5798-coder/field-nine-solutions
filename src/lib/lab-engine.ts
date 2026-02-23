/**
 * Dalkak Dev Lab — 토너먼트 엔진
 * 팀 편성, 대진표, AI 혁신 생성, 심판 평가
 */

import { LAB_AGENTS, getAgent, generateTeamName, type LabAgent } from './lab-agents';

/* ── 타입 ─────────────────────────────────────────── */

export interface LabTeam {
  id?: string;
  seed: number;
  agentIds: number[];
  teamName: string;
  eliminated: boolean;
}

export interface MatchScore {
  innovation: number;   // 30점
  feasibility: number;  // 25점
  impact: number;       // 25점
  quality: number;      // 20점
  total: number;        // 100점
}

export interface Innovation {
  title: string;
  summary: string;
  architecture: string;
  codeSnippet: string;
  techStack: string[];
}

export type RoundName = 'play_in' | 'round_8' | 'semi' | 'final';

export interface BracketMatch {
  round: RoundName;
  matchOrder: number;
  teamAIndex: number;  // seed index into teams array
  teamBIndex: number;
}

/* ── 팀 편성 ──────────────────────────────────────── */

/** Fisher-Yates 셔플 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 30명 에이전트를 랜덤 셔플하여 10팀(3인1조) 생성 */
export function createTeams(): LabTeam[] {
  const ids = shuffle(LAB_AGENTS.map(a => a.id));
  const teams: LabTeam[] = [];
  for (let i = 0; i < 10; i++) {
    const agentIds = ids.slice(i * 3, i * 3 + 3);
    teams.push({
      seed: i + 1,
      agentIds,
      teamName: generateTeamName(agentIds),
      eliminated: false,
    });
  }
  return teams;
}

/* ── 대진표 ───────────────────────────────────────── */

/**
 * 10팀 토너먼트 대진표 생성
 * 플레이인: 시드7vs10, 8vs9
 * 8강: 1vsPLA, 2vsPLB, 3vs6, 4vs5
 * 4강: 8강 승자끼리
 * 결승: 4강 승자끼리
 */
export function createBracketStructure(): BracketMatch[] {
  return [
    // 플레이인 (시드 7,8,9,10)
    { round: 'play_in', matchOrder: 1, teamAIndex: 6, teamBIndex: 9 },  // 시드7 vs 시드10
    { round: 'play_in', matchOrder: 2, teamAIndex: 7, teamBIndex: 8 },  // 시드8 vs 시드9

    // 8강 (시드 1-6 + 플레이인 승자 2팀)
    // matchOrder 1: 시드1 vs 플레이인1 승자  → teamA/B는 실행 시 동적 할당
    // matchOrder 2: 시드2 vs 플레이인2 승자
    // matchOrder 3: 시드3 vs 시드6
    // matchOrder 4: 시드4 vs 시드5
    { round: 'round_8', matchOrder: 1, teamAIndex: 0, teamBIndex: -1 }, // -1 = 플레이인1 승자
    { round: 'round_8', matchOrder: 2, teamAIndex: 1, teamBIndex: -2 }, // -2 = 플레이인2 승자
    { round: 'round_8', matchOrder: 3, teamAIndex: 2, teamBIndex: 5 },  // 시드3 vs 시드6
    { round: 'round_8', matchOrder: 4, teamAIndex: 3, teamBIndex: 4 },  // 시드4 vs 시드5

    // 4강 (8강 승자끼리)
    { round: 'semi', matchOrder: 1, teamAIndex: -11, teamBIndex: -12 }, // 8강1승자 vs 8강2승자
    { round: 'semi', matchOrder: 2, teamAIndex: -13, teamBIndex: -14 }, // 8강3승자 vs 8강4승자

    // 결승
    { round: 'final', matchOrder: 1, teamAIndex: -21, teamBIndex: -22 }, // 4강1승자 vs 4강2승자
  ];
}

export const ROUND_ORDER: RoundName[] = ['play_in', 'round_8', 'semi', 'final'];
export const ROUND_LABELS: Record<RoundName, string> = {
  play_in: '플레이인',
  round_8: '8강',
  semi: '4강',
  final: '결승',
};

/* ── AI 혁신 생성 프롬프트 ────────────────────────── */

/** 팀원 정보를 프롬프트용 텍스트로 변환 */
function teamToPrompt(agentIds: number[]): string {
  return agentIds.map(id => {
    const a = getAgent(id);
    if (!a) return '';
    return `- ${a.emoji} ${a.name} (${a.nameKo}): ${a.specialty} — ${a.bio}`;
  }).join('\n');
}

/** 혁신 아이디어 생성 프롬프트 */
export function buildInnovationPrompt(agentIds: number[], parentInnovation?: Innovation): string {
  const members = teamToPrompt(agentIds);
  const base = `당신은 세계 최고의 기술 개발팀입니다. 팀원 3명의 전문성을 결합하여 혁신적인 기술/기능/시스템을 하나 개발하세요.

팀원:
${members}

요구사항:
1. 팀원들의 전문 분야를 시너지 있게 결합할 것
2. 실제 구현 가능한 수준의 구체적 아이디어일 것
3. 기존에 없는 혁신적인 접근일 것`;

  const develop = parentInnovation ? `

[재도전] 이전 아이디어를 디벨롭하세요:
- 제목: ${parentInnovation.title}
- 요약: ${parentInnovation.summary}
- 아키텍처: ${parentInnovation.architecture}
이전 버전의 약점을 보완하고 완성도를 높이세요.` : '';

  return `${base}${develop}

다음 JSON 형식으로만 응답하세요:
{
  "title": "혁신 기술 이름 (한국어, 10자 이내)",
  "summary": "3~5문장 요약",
  "architecture": "아키텍처 설명 (기술 스택, 데이터 흐름, 핵심 컴포넌트)",
  "codeSnippet": "핵심 로직 의사코드 또는 TypeScript 코드 (15줄 이내)",
  "techStack": ["기술1", "기술2", "기술3"]
}`;
}

/** 심판 평가 프롬프트 */
export function buildJudgePrompt(innovA: Innovation, innovB: Innovation): string {
  return `당신은 세계적인 기술 심사위원입니다. 두 팀의 혁신 기술을 4개 기준으로 평가하세요.

[팀 A]
제목: ${innovA.title}
요약: ${innovA.summary}
아키텍처: ${innovA.architecture}
코드: ${innovA.codeSnippet}
기술스택: ${innovA.techStack.join(', ')}

[팀 B]
제목: ${innovB.title}
요약: ${innovB.summary}
아키텍처: ${innovB.architecture}
코드: ${innovB.codeSnippet}
기술스택: ${innovB.techStack.join(', ')}

평가 기준:
- innovation (혁신성): 0~30점 — 얼마나 새롭고 창의적인가
- feasibility (실현가능성): 0~25점 — 현재 기술로 구현 가능한가
- impact (임팩트): 0~25점 — 산업/사회에 미치는 영향력
- quality (기술완성도): 0~20점 — 아키텍처와 코드의 완성도

다음 JSON 형식으로만 응답하세요:
{
  "scoreA": { "innovation": 0, "feasibility": 0, "impact": 0, "quality": 0 },
  "scoreB": { "innovation": 0, "feasibility": 0, "impact": 0, "quality": 0 },
  "reasoning": "간단한 심사평 (2~3문장)"
}`;
}

/** AI 응답에서 JSON 파싱 (마크다운 코드블록 제거) */
export function parseAiJson<T>(text: string): T | null {
  try {
    const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

/** 점수 합산 */
export function calcTotal(s: Omit<MatchScore, 'total'>): MatchScore {
  return { ...s, total: s.innovation + s.feasibility + s.impact + s.quality };
}
