// 전체 자동화/AI/운영/알림/리포트 상태 대시보드 샘플
import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function AdminDashboard() {
  // 실시간 데이터 fetch 샘플 (가상 API)
  const [stats, setStats] = useState({
    aiSuccess: 0,
    automationCount: 0,
    errorCount: 0,
    lastReport: '',
    lastAlert: '',
  });
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    // Supabase에서 stats 테이블 데이터 fetch 샘플
    (async () => {
      const { data, error } = await supabase.from('stats').select('*').single();
      if (data) {
        setStats({
          aiSuccess: data.ai_success ?? 0,
          automationCount: data.automation_count ?? 0,
          errorCount: data.error_count ?? 0,
          lastReport: data.last_report ?? '',
          lastAlert: data.last_alert ?? '',
        });
      }
      // 현재 로그인 사용자의 역할 정보 fetch
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const user = sessionData.session.user;
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setRole(profile?.role || null);
      }
      // 에러/데이터 없을 때는 기존 샘플 데이터 유지
    })();
  }, []);
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>시스템 상태 대시보드</h1>
      {role && (
        <div style={{ marginBottom: 16 }}>
          <b>내 역할:</b> {role} {role === 'superadmin' ? '(전체 관리자 권한)' : role === 'manager' ? '(일부 관리자 권한)' : '(일반 사용자)'}
        </div>
      )}
      <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
        <div style={{ background: '#23243a', color: '#fff', borderRadius: 16, padding: 32, minWidth: 220 }}>
          <div style={{ fontSize: 18, color: '#b3b3cc', marginBottom: 8 }}>AI 자동화 성공률</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.aiSuccess}%</div>
        </div>
        <div style={{ background: '#23243a', color: '#fff', borderRadius: 16, padding: 32, minWidth: 220 }}>
          <div style={{ fontSize: 18, color: '#b3b3cc', marginBottom: 8 }}>자동화 실행 수</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.automationCount}회</div>
        </div>
        <div style={{ background: '#23243a', color: '#fff', borderRadius: 16, padding: 32, minWidth: 220 }}>
          <div style={{ fontSize: 18, color: '#ffb3b3', marginBottom: 8 }}>에러 발생</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ff6c6c' }}>{stats.errorCount}건</div>
        </div>
      </div>
      <div style={{ fontSize: 18, marginBottom: 12 }}>최근 리포트 발송: {stats.lastReport}</div>
      <div style={{ fontSize: 18, marginBottom: 12 }}>최근 알림 발송: {stats.lastAlert}</div>
      {role && role !== 'superadmin' && (
        <div style={{ color: 'red', marginTop: 16 }}>
          superadmin만 모든 기능에 접근할 수 있습니다.
        </div>
      )}
      <div style={{ marginTop: 40, color: '#888' }}>실제 데이터 연동 및 확장 가능</div>
    </div>
  );
}
