import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 | FieldNine",
  description: "FieldNine 서비스 이용약관",
};

const SECTIONS = [
  {
    title: "제1조 (목적)",
    content: `본 약관은 FieldNine Inc.(이하 "회사")가 제공하는 FieldNine 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.`,
  },
  {
    title: "제2조 (정의)",
    content: `"서비스"란 회사가 제공하는 AI 기반 웹 애플리케이션 생성 플랫폼 및 관련 제반 서비스를 의미합니다.\n"이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.\n"회원"이란 회사에 개인정보를 제공하여 회원 등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.`,
  },
  {
    title: "제3조 (약관의 효력과 변경)",
    content: `본 약관은 서비스를 이용하고자 하는 모든 이용자에 대해 그 효력을 발생합니다.\n회사는 필요하다고 인정되는 경우 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.`,
  },
  {
    title: "제4조 (서비스의 제공)",
    content: `회사는 AI를 활용한 웹 애플리케이션 자동 생성 서비스, 팀 협업 도구, 클라우드 파일 스토리지, 실시간 문서 편집 등의 서비스를 제공합니다.\n서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 회사의 사정이나 기술적 문제로 인해 서비스가 일시 중단될 수 있습니다.`,
  },
  {
    title: "제5조 (이용자의 의무)",
    content: `이용자는 서비스 이용 시 다음 행위를 하여서는 안 됩니다:\n- 타인의 개인정보를 도용하거나 허위 정보를 등록하는 행위\n- 회사의 서비스를 이용하여 법령 또는 본 약관에 위반되는 행위\n- 회사 또는 제3자의 지식재산권을 침해하는 행위\n- 해킹, 악성코드 배포 등 서비스의 안정적 운영을 방해하는 행위`,
  },
  {
    title: "제6조 (유료 서비스 및 요금 청구)",
    content: `회사는 유료 플랜(Pro, Team)에 대해 다음과 같이 요금을 청구합니다.\n\n[후불 사용량 기반 청구]\n- Pro/Team 플랜 이용자는 AI 호출 등 서비스 사용량에 따라 매월 1일 전월 사용분이 자동 청구됩니다.\n- 사용량은 실시간으로 누적되며, 이용자는 /billing 페이지에서 언제든지 확인할 수 있습니다.\n- 기본 월 한도는 50,000원이며, 한도 도달 시 서비스가 일시 중단됩니다.\n\n[결제 방법]\n- 결제는 이용자가 등록한 카드로 Stripe를 통해 자동 처리됩니다.\n- 결제 실패 시 7일의 유예 기간이 부여되며, 이후 서비스가 정지될 수 있습니다.\n\n[환불 정책]\n- 이미 소비된 AI 서비스(사용량 기반 청구분)는 환불이 불가합니다.\n- 구독 정기 결제분의 경우, 해지 시 잔여 기간 내 서비스는 계속 이용 가능하나 환불은 제공되지 않습니다.\n- 단, 회사의 귀책 사유로 인한 서비스 장애 시 합리적인 범위에서 보상을 검토할 수 있습니다.\n\n본 조항은 전자상거래 등에서의 소비자보호에 관한 법률 및 관련 법령에 따라 적용됩니다.`,
  },
  {
    title: "제7조 (책임의 제한)",
    content: `회사는 이용자의 귀책 사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.\nAI가 생성한 콘텐츠의 정확성, 완전성, 적합성에 대해 회사는 보증하지 않으며, 이와 관련하여 발생한 손해에 대해 책임을 지지 않습니다.`,
  },
  {
    title: "제8조 (분쟁해결)",
    content: `서비스 이용과 관련하여 발생한 분쟁에 대해 소송이 제기되는 경우 대한민국 법률에 따르며, 관할 법원은 회사 소재지를 관할하는 법원으로 합니다.`,
  },
];

export default function TermsPage() {
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
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1b1b1f", marginBottom: 8 }}>이용약관</h1>
        <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 48 }}>최종 수정일: 2026년 2월 20일</p>

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
            문의사항이 있으시면{" "}
            <a href="mailto:support@fieldnine.io" style={{ color: "#f97316", fontWeight: 600 }}>
              support@fieldnine.io
            </a>
            로 연락해주세요.
          </p>
        </div>
      </main>
    </div>
  );
}
