import type { LabAgent } from '@/lib/lab-agents';

/** 분야별 전문가 시스템 프롬프트 */
const SPECIALTY_PROMPTS: Record<string, string> = {
  "AI/ML": "Focus on: algorithm optimization, data pipeline architecture, model integration. Suggest efficient data structures and ML-ready patterns.",
  "Security": "Focus on: input validation, XSS/CSRF prevention, secure authentication patterns, OWASP top 10. Flag any security vulnerabilities in existing code.",
  "Cloud": "Focus on: scalable architecture, serverless patterns, caching strategies, CDN optimization. Consider deployment and infrastructure.",
  "Frontend": "Focus on: responsive design, accessibility (WCAG 2.1 AA), CSS performance, component reusability, smooth animations.",
  "Backend": "Focus on: API design, database optimization, error handling, rate limiting, clean architecture patterns.",
  "Data": "Focus on: data modeling, efficient queries, caching, data validation, ETL patterns.",
  "Mobile": "Focus on: touch interactions, offline support, performance on low-end devices, PWA patterns.",
  "DevOps": "Focus on: CI/CD, monitoring, logging, containerization, automated testing.",
  "Blockchain": "Focus on: smart contract patterns, gas optimization, security audits, decentralized architecture.",
  "Research": "Focus on: cutting-edge algorithms, academic best practices, experimental features, performance benchmarks.",
};

export interface TeamPromptOptions {
  agents: LabAgent[];
  userPrompt: string;
  existingFileNames: string[];
}

/** 분야별 specialty prompt를 조회 (UI에서 사용) */
export function getSpecialtyPrompt(field: string): string | undefined {
  return SPECIALTY_PROMPTS[field];
}

/** 전체 분야 프롬프트 맵 반환 (UI에서 사용) */
export function getAllSpecialtyPrompts(): Record<string, string> {
  return { ...SPECIALTY_PROMPTS };
}

/** 팀 에이전트 전문화 프롬프트를 생성 */
export function buildTeamPrompt(options: TeamPromptOptions): string {
  const { agents, userPrompt, existingFileNames } = options;

  if (agents.length === 0) {
    return userPrompt;
  }

  const parts: string[] = [];

  // 1. 팀 구성 소개
  parts.push("## AI Team Composition\n");
  for (const agent of agents) {
    parts.push(`- ${agent.emoji} **${agent.nameKo}** (${agent.name}) — ${agent.fieldKo} / ${agent.specialty}`);
  }
  parts.push("");

  // 2. 역할 분담 지시 + 각 멤버별 SPECIALTY_PROMPTS
  parts.push("## Role Assignments\n");
  parts.push("Each team member must contribute their expertise:\n");
  for (const agent of agents) {
    const specialtyPrompt = SPECIALTY_PROMPTS[agent.field] ?? "";
    parts.push(`### ${agent.emoji} ${agent.nameKo} (${agent.specialty})`);
    if (specialtyPrompt) {
      parts.push(specialtyPrompt);
    }
    parts.push("");
  }

  // 3. 협업 규칙
  parts.push("## Collaboration Rules\n");
  parts.push("- Synthesize all perspectives into a single cohesive solution.");
  parts.push("- Each expert should review the solution from their domain's perspective.");
  parts.push("- Prioritize code quality, maintainability, and best practices from all represented fields.");
  parts.push("- If there are conflicting approaches, explain the trade-offs and choose the most balanced solution.");
  parts.push("");

  // 4. 기존 파일 컨텍스트
  if (existingFileNames.length > 0) {
    parts.push("## Existing Project Files\n");
    parts.push("The project already contains the following files (build upon them, do not discard existing work):\n");
    for (const fname of existingFileNames) {
      parts.push(`- \`${fname}\``);
    }
    parts.push("");
  }

  // 5. 사용자 프롬프트
  parts.push("## User Request\n");
  parts.push(userPrompt);

  return parts.join("\n");
}
