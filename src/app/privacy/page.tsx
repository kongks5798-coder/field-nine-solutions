import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | FieldNine",
  description: "FieldNine 개인정보 처리방침",
};

const SECTIONS = [
  {
    title: "1. 수집하는 개인정보",
    content: `회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다:\n- 필수 정보: 이메일 주소, 비밀번호(암호화 저장)\n- 소셜 로그인 시: 소셜 계정 이메일, 프로필 이름, 프로필 사진(선택)\n- 서비스 이용 중 자동 수집: 접속 IP, 브라우저 종류, 서비스 이용 기록`,
  },
  {
    title: "2. 개인정보의 수집 및 이용 목적",
    content: `수집한 개인정보는 다음의 목적으로만 이용됩니다:\n- 회원 가입 및 관리: 본인 확인, 서비스 이용 자격 부여\n- 서비스 제공: AI 앱 생성, 파일 저장, 팀 협업 기능 제공\n- 서비스 개선: 이용 통계 분석 및 서비스 품질 향상\n- 고객 지원: 문의 사항 처리 및 불만 해결`,
  },
  {
    title: "3. 개인정보의 보유 및 이용 기간",
    content: `회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다.\n단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보유합니다:\n- 서비스 이용 기록: 3개월 (통신비밀보호법)\n- 소비자 불만 처리 기록: 3년 (전자상거래법)`,
  },
  {
    title: "4. 개인정보의 제3자 제공",
    content: `회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.\n다만, 다음의 경우는 예외입니다:\n- 이용자가 사전에 동의한 경우\n- 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차에 따라 제출이 필요한 경우`,
  },
  {
    title: "5. 개인정보 처리의 위탁",
    content: `회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁합니다:\n- Supabase Inc.: 인증 및 데이터베이스 서비스 (미국 소재)\n- Vercel Inc.: 서버 및 배포 서비스 (미국 소재)\n- Cloudflare Inc.: CDN 및 보안 서비스 (미국 소재)`,
  },
  {
    title: "6. 이용자의 권리",
    content: `이용자는 언제든지 다음의 권리를 행사할 수 있습니다:\n- 개인정보 열람 요청\n- 개인정보 정정·삭제 요청\n- 개인정보 처리 정지 요청\n- 개인정보 이동 요청\n권리 행사는 support@fieldnine.io로 요청하실 수 있으며, 회사는 지체 없이 조치합니다.`,
  },
  {
    title: "7. 개인정보 보호 책임자",
    content: `개인정보 처리에 관한 업무를 총괄하는 책임자는 다음과 같습니다:\n- 이름: FieldNine 개인정보 보호팀\n- 이메일: privacy@fieldnine.io\n- 주소: 서울특별시, 대한민국`,
  },
  {
    title: "8. 쿠키 정책",
    content: `회사는 서비스 이용 편의를 위해 쿠키를 사용합니다.\n- 인증 쿠키: 로그인 상태 유지 (httpOnly, Secure)\n- 기능 쿠키: 사용자 설정 저장\n브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.`,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#f9fafb",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #f97316, #f43f5e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 13, color: "#fff",
          }}>F9</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#1b1b1f" }}>FieldNine</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← 홈으로</Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1b1b1f", marginBottom: 8 }}>개인정보 처리방침</h1>
        <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 48 }}>최종 수정일: 2026년 2월 20일 · 시행일: 2026년 2월 20일</p>

        {SECTIONS.map((s, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1b1b1f", marginBottom: 12 }}>{s.title}</h2>
            {s.content.split("\n").map((line, j) => (
              <p key={j} style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, marginBottom: 8 }}>{line}</p>
            ))}
            <div style={{ height: 1, background: "#e5e7eb", marginTop: 32 }} />
          </div>
        ))}

        <div style={{ marginTop: 48, padding: "20px 24px", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            개인정보 관련 문의:{" "}
            <a href="mailto:privacy@fieldnine.io" style={{ color: "#f97316", fontWeight: 600 }}>
              privacy@fieldnine.io
            </a>
          </p>
        </div>
      </main>

      {/* Footer links */}
      <footer style={{
        borderTop: "1px solid #e5e7eb", padding: "24px",
        display: "flex", justifyContent: "center", gap: 24,
        background: "#fff",
      }}>
        <Link href="/terms" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>이용약관</Link>
        <Link href="/privacy" style={{ fontSize: 13, color: "#f97316", fontWeight: 600, textDecoration: "none" }}>개인정보 처리방침</Link>
        <Link href="/" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>FieldNine 홈</Link>
      </footer>
    </div>
  );
}
