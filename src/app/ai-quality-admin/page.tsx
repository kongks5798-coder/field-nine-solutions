import Link from 'next/link';

const menu = [
  { href: '/ai-quality-test', label: 'AI 품질 테스트/튜닝' },
  { href: '/ai-quality-report', label: '대화 로그 품질 리포트' },
  { href: '/ai-quality-history', label: '품질 이력/개선 관리' },
  { href: '/ai-quality-trend', label: '품질 추이 그래프' },
];

export default function AIQualityAdminMenu() {
  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: 32, border: '1px solid #eee', borderRadius: 16, background: '#fafafa' }}>
      <h2>AI 품질 관리 대시보드</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {menu.map(m => (
          <li key={m.href} style={{ margin: '24px 0' }}>
            <Link href={m.href} style={{ fontSize: 20, fontWeight: 700, color: '#1976d2', textDecoration: 'none' }}>
              {m.label}
            </Link>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 40, color: '#888', fontSize: 14 }}>
        관리자 전용: AI 품질 테스트, 리포트, 이력, 추이 등 모든 품질 관리 메뉴에 빠르게 접근할 수 있습니다.
      </div>
    </div>
  );
}