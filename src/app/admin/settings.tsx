// 관리자별 알림/리포트/자동화 설정 UI 샘플
import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function AdminSettings() {
  const [slack, setSlack] = useState(true);
  const [email, setEmail] = useState(false);
  const [reportCycle, setReportCycle] = useState('weekly');
  const [role, setRole] = useState<string | null>(null);
  // 관리자별 설정 불러오기 (Supabase)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('admin_settings').select('*').eq('admin_id', 'admin1').single();
      if (data) {
        setSlack(data.slack ?? false);
        setEmail(data.email ?? false);
        setReportCycle(data.report_cycle ?? 'weekly');
      }
      // 현재 로그인 사용자의 역할 정보 fetch
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const user = sessionData.session.user;
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setRole(profile?.role || null);
      }
    })();
  }, []);
  // 저장 (Supabase)
  useEffect(() => {
    (async () => {
      await supabase.from('admin_settings').upsert({
        admin_id: 'admin1',
        slack,
        email,
        report_cycle: reportCycle,
      });
    })();
  }, [slack, email, reportCycle]);
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>관리자 설정</h1>
      {role && (
        <div style={{ marginBottom: 16 }}>
          <b>내 역할:</b> {role} {role === 'superadmin' ? '(전체 관리자 권한)' : role === 'manager' ? '(일부 관리자 권한)' : '(일반 사용자)'}
        </div>
      )}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, fontSize: 18 }}>
          <input type="checkbox" checked={slack} onChange={e => setSlack(e.target.checked)} /> Slack 알림 수신
        </label>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, fontSize: 18 }}>
          <input type="checkbox" checked={email} onChange={e => setEmail(e.target.checked)} /> 이메일 리포트 수신
        </label>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, fontSize: 18, marginRight: 16 }}>리포트 주기</label>
        <select value={reportCycle} onChange={e => setReportCycle(e.target.value)} style={{ fontSize: 16, padding: '0.5rem 1rem', borderRadius: 8 }}>
          <option value="weekly">주간</option>
          <option value="monthly">월간</option>
        </select>
      </div>
      {role && role !== 'superadmin' && (
        <div style={{ color: 'red', marginTop: 16 }}>
          superadmin만 모든 설정을 변경할 수 있습니다.
        </div>
      )}
      <div style={{ marginTop: 40, color: '#888' }}>실제 관리자별 저장/연동은 추후 구현 가능</div>
    </div>
  );
}
