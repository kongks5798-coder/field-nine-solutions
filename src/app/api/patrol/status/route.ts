/**
 * GET /api/patrol/status
 * 순찰 에이전트 상태 조회 API
 * 현재는 목(mock) 데이터 반환 — 추후 실제 순찰 결과 DB 연동 가능
 */
import { NextResponse } from 'next/server';
import { PATROL_TEAMS } from '@/lib/patrol-agents';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PatrolTeamId = 'management' | 'maintenance' | 'repair';
type PatrolStatus = 'pass' | 'warning' | 'fail';

interface TeamMetric {
  label: string;
  value: string;
  status: PatrolStatus;
}

interface TeamStatusData {
  team: PatrolTeamId;
  status: PatrolStatus;
  lastRun: string | null;
  metrics: TeamMetric[];
}

interface LogEntry {
  timestamp: string;
  team: PatrolTeamId;
  message: string;
  status: PatrolStatus;
}

function getMockTeamStatuses(): TeamStatusData[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();

  return [
    {
      team: 'management',
      status: 'pass',
      lastRun: oneHourAgo,
      metrics: [
        { label: 'TypeScript 에러', value: '0개', status: 'pass' },
        { label: '테스트 결과', value: '261/261 통과', status: 'pass' },
        { label: '보안 이슈', value: '0건', status: 'pass' },
        { label: 'console.log 잔재', value: '3개', status: 'warning' },
        { label: 'any 타입 사용', value: '2건', status: 'pass' },
      ],
    },
    {
      team: 'maintenance',
      status: 'warning',
      lastRun: twoHoursAgo,
      metrics: [
        { label: '테스트 파일', value: '36개', status: 'pass' },
        { label: '미테스트 모듈', value: '8개', status: 'warning' },
        { label: '빌드 상태', value: '성공', status: 'pass' },
        { label: 'CHANGELOG', value: '최신', status: 'pass' },
        { label: '오래된 패키지', value: '12개', status: 'warning' },
      ],
    },
    {
      team: 'repair',
      status: 'pass',
      lastRun: threeHoursAgo,
      metrics: [
        { label: '빌드 에러 수정', value: '0건', status: 'pass' },
        { label: '테스트 실패 수정', value: '0건', status: 'pass' },
        { label: 'TS 에러 수정', value: '0건', status: 'pass' },
        { label: '취약점', value: '0 critical, 0 high', status: 'pass' },
        { label: '헬스체크', value: '정상', status: 'pass' },
      ],
    },
  ];
}

function getMockLogs(): LogEntry[] {
  const now = new Date();

  const entries: Array<{
    offsetMinutes: number;
    team: PatrolTeamId;
    message: string;
    status: PatrolStatus;
  }> = [
    { offsetMinutes: 60,  team: 'management',  message: 'Team Shield 순찰 완료 — TypeScript 에러 0, 테스트 261/261 통과, 보안 이슈 0',  status: 'pass' },
    { offsetMinutes: 120, team: 'maintenance',  message: 'Team Engine 순찰 완료 — 빌드 성공, 미테스트 모듈 8개 발견, 오래된 패키지 12개', status: 'warning' },
    { offsetMinutes: 180, team: 'repair',       message: 'Team Medic 순찰 완료 — 수정 필요 사항 없음, 취약점 0건',                        status: 'pass' },
    { offsetMinutes: 360, team: 'management',   message: 'Team Shield 순찰 완료 — console.log 잔재 5개 발견, 제거 권장',                   status: 'warning' },
    { offsetMinutes: 420, team: 'repair',       message: 'Team Medic 순찰 완료 — npm audit fix 적용, moderate 취약점 2건 해소',            status: 'pass' },
  ];

  return entries.map(e => ({
    timestamp: new Date(now.getTime() - e.offsetMinutes * 60 * 1000).toISOString(),
    team: e.team,
    message: e.message,
    status: e.status,
  }));
}

export async function GET() {
  const teams = getMockTeamStatuses();
  const logs = getMockLogs();

  // Overall status: fail if any team fails, warning if any warns, else pass
  const overallStatus: PatrolStatus = teams.some(t => t.status === 'fail')
    ? 'fail'
    : teams.some(t => t.status === 'warning')
      ? 'warning'
      : 'pass';

  const summaryMap: Record<PatrolStatus, string> = {
    pass:    'ALL CLEAR — 모든 팀 정상',
    warning: 'ATTENTION — 일부 주의 항목 존재',
    fail:    'ACTION REQUIRED — 즉시 조치 필요',
  };

  const lastRuns = teams
    .map(t => t.lastRun)
    .filter((lr): lr is string => lr !== null)
    .sort()
    .reverse();

  const body = {
    status: {
      lastRun: lastRuns[0] ?? null,
      teams,
      summary: summaryMap[overallStatus],
    },
    logs,
    meta: {
      agentCount: 9,
      teamCount: PATROL_TEAMS.length,
      version: '1.0.0',
    },
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
