"use client";

import AppShell from "@/components/AppShell";
import { T } from "@/lib/theme";

const SECTIONS = [
  {
    title: "제1조 (목적)",
    content: `본 약관은 FieldNine Inc.(이하 "회사")가 운영하는 Dalkak(딸깍) 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.`,
  },
  {
    title: "제2조 (서비스 개요)",
    content: `"서비스"란 회사가 제공하는 다음의 기능을 포함하는 AI 기반 웹 애플리케이션 개발 플랫폼을 의미합니다.

- AI 앱 빌더: 자연어 프롬프트를 기반으로 웹 애플리케이션을 자동 생성하는 기능
- 코드 에디터(Studio): AI 어시스턴트가 탑재된 온라인 코드 편집 환경
- 클라우드 배포: 생성된 애플리케이션을 즉시 배포하고 호스팅하는 기능
- 팀 협업(Collab, CoWork): 실시간 문서 편집 및 팀 프로젝트 관리 기능
- LM 허브: 다양한 AI 모델(GPT, Claude, Gemini)을 활용한 언어 모델 인터페이스
- Canvas / Flow: 시각적 워크플로우 및 디자인 도구
- 클라우드 스토리지: 파일 업로드 및 관리 기능`,
  },
  {
    title: "제3조 (이용 자격)",
    content: `서비스는 만 14세 이상의 개인 또는 법인이 이용할 수 있습니다. 만 14세 미만의 아동은 서비스에 가입할 수 없으며, 가입 사실이 확인되는 경우 해당 계정은 즉시 삭제됩니다.

이용자는 회원 가입 시 정확하고 최신의 정보를 제공해야 하며, 허위 정보를 등록하는 경우 서비스 이용이 제한될 수 있습니다.`,
  },
  {
    title: "제4조 (계정 관리)",
    content: `이용자는 자신의 계정에 대해 다음의 관리 의무를 부담합니다.

- 비밀번호 보안: 이용자는 비밀번호를 안전하게 관리할 책임이 있으며, 정기적으로 변경할 것을 권장합니다.
- 계정 공유 금지: 이용자의 계정은 본인만 사용할 수 있으며, 제3자에게 양도하거나 공유할 수 없습니다.
- 무단 이용 신고: 계정이 도용되거나 무단으로 사용된 사실을 발견한 경우, 즉시 support@fieldnine.io로 신고해야 합니다.

계정 관리 소홀로 인해 발생하는 손해에 대해 회사는 책임을 지지 않습니다.`,
  },
  {
    title: "제5조 (요금 및 결제)",
    content: `회사는 다음과 같은 요금 체계를 운영합니다.

[요금제]
- Free(무료): 기본 기능 제한적 이용
- Pro: 월 39,000원 (₩39,000/월) — 개인 사용자를 위한 전체 기능 이용
- Team: 월 99,000원 (₩99,000/월) — 팀 협업 및 고급 기능 포함

[결제 방법]
- 결제는 Stripe 또는 TossPayments를 통해 처리됩니다.
- 구독은 매월 자동 갱신되며, 갱신일에 등록된 결제 수단으로 자동 청구됩니다.
- AI 사용량 기반 추가 요금이 발생할 수 있으며, 이는 매월 1일 전월 사용분이 청구됩니다.

[환불 정책]
- 유료 플랜 결제 후 7일 이내에 서비스를 이용하지 않은 경우 전액 환불이 가능합니다.
- 이미 소비된 AI 서비스(사용량 기반 청구분)는 환불이 불가합니다.
- 구독 해지 시 남은 결제 기간 내 서비스는 계속 이용 가능하나, 잔여 기간에 대한 환불은 제공되지 않습니다.
- 회사의 귀책 사유로 인한 서비스 장애 시 합리적인 범위에서 보상을 검토합니다.
- 환불 요청은 support@fieldnine.io를 통해 접수할 수 있습니다.

본 조항은 전자상거래 등에서의 소비자보호에 관한 법률에 따라 적용됩니다.`,
  },
  {
    title: "제6조 (금지 행위)",
    content: `이용자는 서비스 이용 시 다음 행위를 하여서는 안 됩니다.

- 악성코드(바이러스, 웜, 트로이목마 등)를 서비스를 통해 생성, 배포 또는 전파하는 행위
- 불법 콘텐츠(아동 착취물, 저작권 침해물, 불법 도박 등)를 생성하거나 배포하는 행위
- 서비스를 이용하여 타인의 개인정보를 무단으로 수집하거나 도용하는 행위
- 서비스의 안정적 운영을 방해하는 행위 (과도한 API 호출, DDoS 공격, 취약점 악용 등)
- 서비스를 역설계(reverse engineering), 디컴파일 또는 역어셈블하는 행위
- 자동화 도구를 이용하여 대량으로 콘텐츠를 생성하거나 서비스를 악용하는 행위
- 타인의 계정을 도용하거나 허위 정보를 등록하는 행위
- 기타 관련 법령에 위반되는 행위

위반 시 사전 통보 없이 서비스 이용이 제한되거나 계정이 정지 또는 삭제될 수 있습니다.`,
  },
  {
    title: "제7조 (지적재산권)",
    content: `[사용자 콘텐츠]
이용자가 서비스를 통해 생성한 콘텐츠(코드, 텍스트, 이미지 등)에 대한 지적재산권은 이용자에게 귀속됩니다. 회사는 서비스 제공 및 개선 목적 외에 이용자의 콘텐츠를 사용하지 않습니다.

[플랫폼 지적재산권]
서비스를 구성하는 소프트웨어, 디자인, 로고, 상표, 기술 등 일체의 지적재산권은 회사에 귀속됩니다. 이용자는 회사의 사전 서면 동의 없이 이를 복제, 수정, 배포, 전시하거나 상업적으로 이용할 수 없습니다.

[AI 생성 콘텐츠]
AI가 생성한 결과물은 이용자가 자유롭게 사용할 수 있습니다. 다만, AI 생성물이 제3자의 지적재산권을 침해하는 경우 이용자가 이에 대한 책임을 부담합니다.`,
  },
  {
    title: "제8조 (서비스 변경 및 종료)",
    content: `회사는 서비스의 안정적 운영을 위해 서비스의 전부 또는 일부를 변경, 중단, 종료할 수 있습니다.

- 서비스 변경: 기능 추가, 수정, 삭제 등을 포함하며, 중요한 변경 시 최소 30일 전에 공지합니다.
- 서비스 중단: 시스템 점검, 장비 교체, 천재지변, 기타 불가항력적 사유로 일시적으로 중단될 수 있습니다.
- 서비스 종료: 경영상의 사유로 서비스를 종료하는 경우, 최소 60일 전에 공지하며 유료 이용자에게는 잔여 기간에 대한 환불을 제공합니다.

예정된 서비스 점검은 서비스 내 공지 또는 이메일을 통해 사전에 안내합니다.`,
  },
  {
    title: "제9조 (면책 조항)",
    content: `회사는 다음 사항에 대해 책임을 지지 않습니다.

- 이용자의 귀책 사유(계정 관리 소홀, 약관 위반 등)로 인한 서비스 이용 장애 및 손해
- AI가 생성한 콘텐츠의 정확성, 완전성, 적법성 또는 특정 목적에의 적합성
- 천재지변, 전쟁, 전염병 등 불가항력으로 인한 서비스 중단
- 이용자 간 또는 이용자와 제3자 간의 분쟁
- 외부 서비스(Stripe, OpenAI, Anthropic, Google 등)의 장애로 인한 서비스 제한
- 이용자가 서비스를 통해 생성한 애플리케이션의 운영 및 그로 인한 손해

회사의 서비스는 "있는 그대로(AS-IS)" 제공되며, 명시적 또는 묵시적 보증을 포함하지 않습니다. 서비스 이용으로 인한 회사의 총 배상 책임은 이용자가 직전 12개월간 회사에 지급한 서비스 이용료를 상한으로 합니다.`,
  },
  {
    title: "제10조 (약관의 변경)",
    content: `회사는 필요하다고 인정되는 경우 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항 또는 이메일을 통해 최소 7일 전에 공지합니다. 이용자에게 불리한 변경의 경우 30일 전에 사전 고지합니다.

변경된 약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우, 변경된 약관에 동의한 것으로 간주합니다. 변경 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다.`,
  },
  {
    title: "제11조 (준거법 및 관할법원)",
    content: `본 약관의 해석 및 적용은 대한민국 법률에 따릅니다.

서비스 이용과 관련하여 회사와 이용자 간에 발생한 분쟁은 상호 협의를 통해 해결함을 원칙으로 합니다. 협의로 해결되지 않는 경우 서울중앙지방법원을 제1심 전속 관할법원으로 합니다.`,
  },
];

export default function TermsPage() {
  return (
    <AppShell>
      <div style={{
        minHeight: "calc(100vh - 56px)",
        background: T.bg,
        fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      }}>
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: T.text, marginBottom: 8 }}>
            이용약관
          </h1>
          <p style={{ fontSize: 14, color: T.muted, marginBottom: 48 }}>
            시행일: 2026년 2월 23일 · Dalkak(딸깍) — FieldNine Inc.
          </p>

          {SECTIONS.map((s, i) => (
            <section key={i} style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 12 }}>
                {s.title}
              </h2>
              {s.content.split("\n").map((line, j) => (
                <p key={j} style={{
                  fontSize: 15,
                  color: line.startsWith("[") ? T.accent : "rgba(226,232,240,0.85)",
                  lineHeight: 1.8,
                  marginBottom: line === "" ? 12 : 4,
                  fontWeight: line.startsWith("[") ? 600 : 400,
                }}>
                  {line}
                </p>
              ))}
              <div style={{ height: 1, background: T.border, marginTop: 32 }} />
            </section>
          ))}

          {/* Contact box */}
          <div style={{
            marginTop: 48,
            padding: "20px 24px",
            background: T.surface,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
          }}>
            <p style={{ fontSize: 14, color: T.muted }}>
              문의사항이 있으시면{" "}
              <a href="mailto:support@fieldnine.io" style={{ color: T.accent, fontWeight: 600, textDecoration: "none" }}>
                support@fieldnine.io
              </a>
              로 연락해주세요.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          borderTop: `1px solid ${T.border}`,
          padding: "24px",
          display: "flex",
          justifyContent: "center",
          gap: 24,
          background: T.surface,
        }}>
          <a href="/terms" style={{ fontSize: 13, color: T.accent, fontWeight: 600, textDecoration: "none" }}>이용약관</a>
          <a href="/privacy" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>개인정보 처리방침</a>
          <a href="/" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>Dalkak 홈</a>
        </footer>
      </div>
    </AppShell>
  );
}
