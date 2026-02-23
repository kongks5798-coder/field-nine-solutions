"use client";

import AppShell from "@/components/AppShell";
import { T } from "@/lib/theme";

const SECTIONS = [
  {
    title: "1. 수집하는 개인정보 항목",
    content: `Dalkak(딸깍)(이하 "서비스")을 운영하는 Dalkak Inc. (이하 "회사", 법인명 FieldNine Inc.)는 서비스 제공을 위해 다음의 개인정보를 수집합니다.

[필수 수집 항목]
- 이메일 주소: 회원 가입, 로그인, 서비스 관련 공지 발송
- 이름(닉네임): 서비스 내 사용자 식별
- 결제 정보: 신용카드 번호(Stripe/TossPayments를 통한 토큰화 처리), 청구지 주소

[자동 수집 항목]
- 접속 IP 주소, 브라우저 종류 및 버전, 운영체제 정보
- 서비스 이용 기록(접속 일시, 페이지 방문 기록, 기능 사용 이력)
- 쿠키 및 유사 기술을 통한 분석 데이터

[소셜 로그인 시 추가 수집]
- 소셜 계정 이메일, 프로필 이름, 프로필 사진(선택)`,
  },
  {
    title: "2. 개인정보의 수집 및 이용 목적",
    content: `수집한 개인정보는 다음의 목적으로만 이용됩니다.

- 서비스 제공: AI 앱 빌더, 코드 에디터, 클라우드 배포, 팀 협업 등 핵심 서비스 제공
- 결제 처리: 유료 플랜(Pro, Team) 구독 결제 및 사용량 기반 청구 처리
- 고객 지원: 문의 사항 처리, 불만 해결, 서비스 장애 안내
- 회원 관리: 본인 확인, 서비스 이용 자격 부여 및 관리, 부정 이용 방지
- 서비스 개선: 이용 통계 분석, 서비스 품질 향상 및 신규 기능 개발 참고
- 마케팅(선택 동의 시): 신규 기능 안내, 프로모션 정보 제공`,
  },
  {
    title: "3. 개인정보의 보유 및 이용 기간",
    content: `회원 탈퇴 시 개인정보는 즉시 파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 별도 보관합니다.

- 결제 및 대금 결제 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)
- 소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)
- 서비스 이용 기록, 접속 로그: 3개월 (통신비밀보호법)
- 표시/광고에 관한 기록: 6개월 (전자상거래 등에서의 소비자보호에 관한 법률)

회원 탈퇴 후 상기 법령에 따른 보존 기간이 경과하면 지체 없이 파기합니다.`,
  },
  {
    title: "4. 개인정보의 제3자 제공",
    content: `회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.

[결제 처리]
- Stripe Inc.: 해외 결제 처리 (미국 소재)
- 주식회사 토스페이먼츠(TossPayments): 국내 결제 처리 (대한민국 소재)

[인프라 및 데이터 처리]
- Supabase Inc.: 인증, 데이터베이스 서비스 (미국 소재)
- Vercel Inc.: 서버 호스팅 및 배포 (미국 소재)

[AI 서비스 제공]
- OpenAI Inc.: AI 모델 API 호출 (미국 소재)
- Anthropic PBC: AI 모델 API 호출 (미국 소재)
- Google LLC: AI 모델 API 호출 (미국 소재)

[분석]
- PostHog Inc.: 서비스 이용 분석 (미국 소재)

위탁 업체에는 서비스 제공에 필요한 최소한의 정보만 전달되며, 계약을 통해 개인정보 보호 의무를 부과하고 있습니다.

또한 다음의 경우 예외적으로 개인정보가 제공될 수 있습니다.
- 이용자가 사전에 동의한 경우
- 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차에 따라 요청이 있는 경우`,
  },
  {
    title: "5. 이용자의 권리 및 행사 방법",
    content: `이용자(또는 법정 대리인)는 언제든지 다음의 권리를 행사할 수 있습니다.

- 개인정보 열람 요청: 회사가 보유한 개인정보의 열람을 요청할 수 있습니다.
- 개인정보 정정 요청: 부정확하거나 불완전한 개인정보의 정정을 요청할 수 있습니다.
- 개인정보 삭제 요청: 불필요한 개인정보의 삭제를 요청할 수 있습니다.
- 개인정보 처리 정지 요청: 개인정보의 처리 중지를 요청할 수 있습니다.

권리 행사는 서비스 내 설정 페이지에서 직접 처리하거나, privacy@fieldnine.io로 이메일을 보내 요청할 수 있습니다. 회사는 요청을 접수한 날로부터 10일 이내에 조치하며, 처리 결과를 통지합니다.

만 14세 미만 아동의 개인정보를 수집하지 않으며, 만 14세 미만임이 확인되는 경우 해당 계정은 즉시 삭제됩니다.`,
  },
  {
    title: "6. 쿠키 사용",
    content: `회사는 서비스 이용 편의 제공 및 분석을 위해 쿠키를 사용합니다.

[사용하는 쿠키 종류]
- 필수 쿠키: 로그인 상태 유지, 보안 토큰 관리 (httpOnly, Secure)
- 기능 쿠키: 사용자 설정(테마, 언어) 저장
- 분석 쿠키: PostHog를 통한 서비스 이용 패턴 분석

[쿠키 관리]
이용자는 브라우저 설정에서 쿠키를 거부하거나 삭제할 수 있습니다. 다만, 필수 쿠키를 거부하는 경우 서비스의 일부 기능 이용이 제한될 수 있습니다.

서비스 최초 방문 시 쿠키 동의 배너를 통해 분석 쿠키 사용에 대한 동의를 받고 있습니다.`,
  },
  {
    title: "7. 개인정보의 안전성 확보 조치",
    content: `회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.

- 비밀번호 암호화: BCrypt 등 업계 표준 해시 알고리즘으로 암호화 저장
- 전송 구간 암호화: HTTPS(TLS 1.2 이상)를 통한 데이터 전송 암호화
- 접근 제한: 개인정보에 대한 접근 권한을 최소한의 인원으로 제한
- 결제 정보 보안: 신용카드 정보를 직접 저장하지 않으며, Stripe/TossPayments의 토큰화 기술 사용
- 보안 모니터링: 정기적인 보안 점검 및 취약점 진단 수행`,
  },
  {
    title: "8. 개인정보 보호책임자",
    content: `개인정보 처리에 관한 업무를 총괄하는 책임자는 다음과 같습니다.

- 회사명: Dalkak Inc. (FieldNine Inc.)
- 담당 부서: 개인정보 보호팀
- 이메일: privacy@fieldnine.io
- 주소: 서울특별시, 대한민국

개인정보 침해에 대한 신고나 상담이 필요하신 경우, 아래 기관에 문의하실 수 있습니다.
- 개인정보 침해 신고센터 (한국인터넷진흥원): 118, privacy.kisa.or.kr
- 개인정보 분쟁조정위원회: 1833-6972, kopico.go.kr
- 대검찰청 사이버수사과: 1301, spo.go.kr
- 경찰청 사이버안전국: 182, cyberbureau.police.go.kr`,
  },
  {
    title: "9. 개인정보 처리방침의 변경",
    content: `본 개인정보 처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될 수 있습니다. 변경 사항이 있을 경우 서비스 내 공지사항을 통해 최소 7일 전에 안내하며, 중요한 변경의 경우 30일 전에 사전 고지합니다.`,
  },
];

export default function PrivacyPage() {
  return (
    <AppShell>
      <div style={{
        minHeight: "calc(100vh - 56px)",
        background: T.bg,
        fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      }}>
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: T.text, marginBottom: 8 }}>
            개인정보 처리방침
          </h1>
          <p style={{ fontSize: 14, color: T.muted, marginBottom: 48 }}>
            시행일: 2026년 2월 23일 · Dalkak(딸깍) — Dalkak Inc.
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
              개인정보 관련 문의:{" "}
              <a href="mailto:privacy@fieldnine.io" style={{ color: T.accent, fontWeight: 600, textDecoration: "none" }}>
                privacy@fieldnine.io
              </a>
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
          <a href="/terms" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>이용약관</a>
          <a href="/privacy" style={{ fontSize: 13, color: T.accent, fontWeight: 600, textDecoration: "none" }}>개인정보 처리방침</a>
          <a href="/" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>Dalkak 홈</a>
        </footer>
      </div>
    </AppShell>
  );
}
