import { describe, it, expect, vi, beforeEach } from 'vitest';

/* patrol-agents mock */
const mocks = vi.hoisted(() => ({
  PATROL_TEAMS: [
    { id: 'management', name: 'Team Shield', nameKo: '관리', emoji: '', description: '' },
    { id: 'maintenance', name: 'Team Engine', nameKo: '유지', emoji: '', description: '' },
    { id: 'repair',      name: 'Team Medic',  nameKo: '보수', emoji: '', description: '' },
  ],
}));

vi.mock('@/lib/patrol-agents', () => ({
  PATROL_TEAMS: mocks.PATROL_TEAMS,
}));

import { GET } from '@/app/api/patrol/status/route';

describe('GET /api/patrol/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('200 상태코드와 함께 순찰 상태 정상 반환', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('logs');
    expect(body).toHaveProperty('meta');
    expect(body.status).toHaveProperty('lastRun');
    expect(body.status).toHaveProperty('teams');
    expect(body.status).toHaveProperty('summary');
  });

  it('모든 팀 상태 포함 (management, maintenance, repair)', async () => {
    const res = await GET();
    const body = await res.json();
    const teamIds = body.status.teams.map((t: { team: string }) => t.team);
    expect(teamIds).toContain('management');
    expect(teamIds).toContain('maintenance');
    expect(teamIds).toContain('repair');
    expect(body.status.teams).toHaveLength(3);
  });

  it('각 팀에 metrics 배열이 존재', async () => {
    const res = await GET();
    const body = await res.json();
    for (const team of body.status.teams) {
      expect(Array.isArray(team.metrics)).toBe(true);
      expect(team.metrics.length).toBeGreaterThan(0);
      for (const metric of team.metrics) {
        expect(metric).toHaveProperty('label');
        expect(metric).toHaveProperty('value');
        expect(metric).toHaveProperty('status');
        expect(['pass', 'warning', 'fail']).toContain(metric.status);
      }
    }
  });

  it('logs 배열이 비어있지 않고 올바른 형태', async () => {
    const res = await GET();
    const body = await res.json();
    expect(Array.isArray(body.logs)).toBe(true);
    expect(body.logs.length).toBeGreaterThan(0);
    for (const log of body.logs) {
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('team');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('status');
    }
  });

  it('meta에 agentCount, teamCount, version 포함', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.meta.agentCount).toBe(9);
    expect(body.meta.teamCount).toBe(mocks.PATROL_TEAMS.length);
    expect(body.meta.version).toBe('1.0.0');
  });

  it('Cache-Control: no-store, no-cache 헤더 확인', async () => {
    const res = await GET();
    expect(res.headers.get('Cache-Control')).toBe('no-store, no-cache');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
