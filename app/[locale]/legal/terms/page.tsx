/**
 * K-UNIVERSAL Terms of Service
 * 이용약관 페이지
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowLeft, ChevronDown, ChevronUp, FileText } from 'lucide-react';

const content = {
  ko: {
    title: '이용약관',
    lastUpdated: '최종 수정일: 2026년 1월 15일',
    sections: [
      {
        title: '제1조 (목적)',
        content: `본 약관은 K-UNIVERSAL(이하 "회사")이 제공하는 모바일 결제 및 생활 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.`,
      },
      {
        title: '제2조 (정의)',
        content: `① "서비스"란 회사가 제공하는 Ghost Wallet, AI 컨시어지, 택시 호출, 음식 배달, 쇼핑 등 모바일 플랫폼 기반 서비스 일체를 말합니다.
② "회원"이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 말합니다.
③ "Ghost Wallet"이란 회사가 제공하는 선불 전자지갑 서비스를 말합니다.
④ "본인확인"이란 서비스 이용 시 회원의 신원을 확인하는 절차를 말합니다.`,
      },
      {
        title: '제3조 (약관의 효력 및 변경)',
        content: `① 본 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다.
② 회사는 필요한 경우 관련 법령을 위반하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.
③ 약관이 변경되는 경우 회사는 변경 내용을 서비스 내 공지사항을 통해 공지합니다.
④ 회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.`,
      },
      {
        title: '제4조 (서비스의 제공 및 변경)',
        content: `① 회사는 다음과 같은 서비스를 제공합니다:
- Ghost Wallet (선불 전자지갑)
- AI 컨시어지 서비스
- 택시 호출 서비스
- 음식 배달 서비스
- 쇼핑 서비스
- 환전/송금 서비스
② 회사는 서비스의 품질 향상 등을 위해 서비스 내용을 변경할 수 있습니다.`,
      },
      {
        title: '제5조 (회원가입 및 본인확인)',
        content: `① 서비스를 이용하려는 자는 회사가 정한 절차에 따라 회원가입을 하여야 합니다.
② 회원가입 시 본인 명의의 이메일 및 휴대전화 번호가 필요합니다.
③ Ghost Wallet 등 금융 서비스 이용 시 관계 법령에 따른 본인확인(KYC)이 필요합니다.
④ 회사는 회원가입 시 제출한 정보가 사실과 다르거나 부정한 방법으로 가입한 경우 서비스 이용을 제한할 수 있습니다.`,
      },
      {
        title: '제6조 (Ghost Wallet 서비스)',
        content: `① Ghost Wallet은 회원이 충전한 금액 범위 내에서 결제할 수 있는 선불 전자지갑입니다.
② 충전 가능 금액: 최소 1,000원 ~ 최대 2,000,000원 (1회)
③ 충전된 금액은 환불 요청 시 회사가 정한 절차에 따라 환불됩니다.
④ 부정 사용이 의심되는 경우 회사는 거래를 제한할 수 있습니다.`,
      },
      {
        title: '제7조 (이용요금)',
        content: `① 기본 서비스는 무료로 제공됩니다.
② 결제, 환전, 송금 등 금융 서비스 이용 시 수수료가 부과될 수 있습니다.
③ 수수료는 서비스 내 안내 페이지에서 확인할 수 있습니다.`,
      },
      {
        title: '제8조 (회원의 의무)',
        content: `① 회원은 본 약관 및 관련 법령을 준수하여야 합니다.
② 회원은 다음 행위를 하여서는 안 됩니다:
- 타인의 정보 도용
- 불법 자금 세탁 행위
- 서비스의 정상적 운영 방해
- 회사의 지식재산권 침해
③ 회원은 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.`,
      },
      {
        title: '제9조 (회사의 의무)',
        content: `① 회사는 관련 법령과 본 약관이 정하는 바에 따라 안정적인 서비스를 제공합니다.
② 회사는 회원의 개인정보를 보호하고 적법하게 처리합니다.
③ 회사는 서비스 이용과 관련한 불만이나 문의에 성실히 대응합니다.`,
      },
      {
        title: '제10조 (면책조항)',
        content: `① 천재지변, 전쟁 등 불가항력으로 서비스를 제공할 수 없는 경우 회사의 책임이 면제됩니다.
② 회원의 귀책사유로 인한 서비스 이용 장애에 대해 회사는 책임을 지지 않습니다.
③ 회사는 제3자가 제공하는 서비스(택시, 음식점 등)의 품질에 대해 책임을 지지 않습니다.`,
      },
      {
        title: '제11조 (분쟁해결)',
        content: `① 서비스 이용과 관련한 분쟁은 당사자 간 협의로 해결함을 원칙으로 합니다.
② 분쟁이 해결되지 않는 경우 대한민국 법률을 적용하며, 관할 법원은 서울중앙지방법원으로 합니다.`,
      },
      {
        title: '제12조 (부칙)',
        content: `본 약관은 2026년 1월 15일부터 시행됩니다.`,
      },
    ],
    contact: {
      title: '문의처',
      email: 'support@k-universal.com',
      phone: '1588-0000',
    },
  },
  en: {
    title: 'Terms of Service',
    lastUpdated: 'Last Updated: January 15, 2026',
    sections: [
      {
        title: 'Article 1 (Purpose)',
        content: `These Terms of Service govern the use of mobile payment and lifestyle services ("Service") provided by K-UNIVERSAL ("Company"), including the rights, obligations, and responsibilities between the Company and members.`,
      },
      {
        title: 'Article 2 (Definitions)',
        content: `① "Service" refers to all mobile platform-based services provided by the Company, including Ghost Wallet, AI Concierge, taxi booking, food delivery, and shopping.
② "Member" refers to a person who agrees to these Terms and enters into a service agreement with the Company.
③ "Ghost Wallet" refers to the prepaid electronic wallet service provided by the Company.
④ "Identity Verification" refers to the process of confirming a member's identity when using the service.`,
      },
      {
        title: 'Article 3 (Effect and Amendment of Terms)',
        content: `① These Terms apply to all members who wish to use the Service.
② The Company may amend these Terms within the scope permitted by applicable laws.
③ Changes to the Terms will be announced through in-app notifications.
④ Members who do not agree to the amended Terms may discontinue use and withdraw.`,
      },
      {
        title: 'Article 4 (Provision and Modification of Services)',
        content: `① The Company provides the following services:
- Ghost Wallet (prepaid e-wallet)
- AI Concierge Service
- Taxi Booking Service
- Food Delivery Service
- Shopping Service
- Currency Exchange/Remittance Service
② The Company may modify service content to improve quality.`,
      },
      {
        title: 'Article 5 (Membership and Identity Verification)',
        content: `① Those wishing to use the Service must register following the Company's procedures.
② Email and mobile phone number in your own name are required for registration.
③ KYC verification is required for financial services like Ghost Wallet as per applicable laws.
④ The Company may restrict service use if submitted information is false or registration is fraudulent.`,
      },
      {
        title: 'Article 6 (Ghost Wallet Service)',
        content: `① Ghost Wallet is a prepaid electronic wallet allowing payments within the charged amount.
② Recharge limits: Minimum 1,000 KRW ~ Maximum 2,000,000 KRW (per transaction)
③ Charged amounts are refundable following the Company's refund procedures.
④ The Company may restrict transactions if fraudulent use is suspected.`,
      },
      {
        title: 'Article 7 (Service Fees)',
        content: `① Basic services are provided free of charge.
② Fees may apply for financial services such as payments, currency exchange, and remittances.
③ Fee information is available on the service's information page.`,
      },
      {
        title: 'Article 8 (Member Obligations)',
        content: `① Members must comply with these Terms and applicable laws.
② Members shall not engage in:
- Identity theft
- Money laundering
- Interfering with normal service operations
- Infringing on the Company's intellectual property
③ Members are responsible for securely managing their account information.`,
      },
      {
        title: 'Article 9 (Company Obligations)',
        content: `① The Company provides stable services in accordance with applicable laws and these Terms.
② The Company protects and lawfully processes members' personal information.
③ The Company responds sincerely to complaints and inquiries related to service use.`,
      },
      {
        title: 'Article 10 (Disclaimer)',
        content: `① The Company is exempt from liability when services cannot be provided due to force majeure such as natural disasters or war.
② The Company is not liable for service disruptions caused by member negligence.
③ The Company is not responsible for the quality of services provided by third parties (taxi drivers, restaurants, etc.).`,
      },
      {
        title: 'Article 11 (Dispute Resolution)',
        content: `① Disputes related to service use shall be resolved through mutual consultation between parties.
② Unresolved disputes shall be governed by Korean law, with Seoul Central District Court as the competent court.`,
      },
      {
        title: 'Article 12 (Supplementary Provisions)',
        content: `These Terms take effect from January 15, 2026.`,
      },
    ],
    contact: {
      title: 'Contact',
      email: 'support@k-universal.com',
      phone: '+82-1588-0000',
    },
  },
  ja: {
    title: '利用規約',
    lastUpdated: '最終更新日: 2026年1月15日',
    sections: [
      {
        title: '第1条（目的）',
        content: `本規約は、K-UNIVERSAL（以下「会社」）が提供するモバイル決済および生活サービス（以下「サービス」）の利用条件、会社と会員間の権利・義務・責任について定めることを目的とします。`,
      },
      {
        title: '第2条（定義）',
        content: `① 「サービス」とは、Ghost Wallet、AIコンシェルジュ、タクシー配車、フードデリバリー、ショッピングなど、会社が提供するすべてのモバイルプラットフォームサービスを指します。
② 「会員」とは、本規約に同意し、会社とサービス利用契約を締結した者を指します。
③ 「Ghost Wallet」とは、会社が提供するプリペイド電子財布サービスを指します。
④ 「本人確認」とは、サービス利用時に会員の身元を確認する手続きを指します。`,
      },
      {
        title: '第3条（規約の効力および変更）',
        content: `① 本規約は、サービスを利用するすべての会員に適用されます。
② 会社は、関連法令に違反しない範囲で本規約を変更できます。
③ 規約変更時は、アプリ内通知でお知らせします。
④ 変更された規約に同意しない場合、サービス利用を中止し退会できます。`,
      },
    ],
    contact: {
      title: 'お問い合わせ',
      email: 'support@k-universal.com',
      phone: '+82-1588-0000',
    },
  },
  zh: {
    title: '服务条款',
    lastUpdated: '最后更新：2026年1月15日',
    sections: [
      {
        title: '第一条（目的）',
        content: `本条款旨在规定K-UNIVERSAL（以下简称"公司"）提供的移动支付和生活服务（以下简称"服务"）的使用条件，以及公司与会员之间的权利、义务和责任。`,
      },
      {
        title: '第二条（定义）',
        content: `① "服务"是指公司提供的所有移动平台服务，包括Ghost Wallet、AI礼宾、出租车预约、外卖配送、购物等。
② "会员"是指同意本条款并与公司签订服务协议的人。
③ "Ghost Wallet"是指公司提供的预付费电子钱包服务。
④ "身份验证"是指使用服务时确认会员身份的程序。`,
      },
      {
        title: '第三条（条款的效力和变更）',
        content: `① 本条款适用于所有使用服务的会员。
② 公司可在不违反相关法律的范围内变更本条款。
③ 条款变更时，将通过应用内通知公告。
④ 不同意变更条款的会员可停止使用服务并注销账户。`,
      },
    ],
    contact: {
      title: '联系方式',
      email: 'support@k-universal.com',
      phone: '+82-1588-0000',
    },
  },
};

export default function TermsPage() {
  const locale = useLocale() as keyof typeof content;
  const t = content[locale] || content.en;
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(t.sections.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{t.title}</h1>
            <p className="text-xs text-gray-500">{t.lastUpdated}</p>
          </div>
          <FileText className="w-5 h-5 text-blue-500" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Expand/Collapse buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            {locale === 'ko' ? '모두 펼치기' : locale === 'ja' ? 'すべて展開' : locale === 'zh' ? '全部展开' : 'Expand All'}
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            {locale === 'ko' ? '모두 접기' : locale === 'ja' ? 'すべて折りたたむ' : locale === 'zh' ? '全部折叠' : 'Collapse All'}
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {t.sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(index)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900 text-left">{section.title}</span>
                {expandedSections.has(index) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {expandedSections.has(index) && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="px-4 pb-4"
                >
                  <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                    {section.content}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">{t.contact.title}</h3>
          <div className="space-y-1 text-sm text-blue-700">
            <p>Email: {t.contact.email}</p>
            <p>Tel: {t.contact.phone}</p>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/legal/privacy"
            className="flex-1 py-3 px-4 bg-white border border-gray-200 rounded-xl text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {locale === 'ko' ? '개인정보처리방침' : locale === 'ja' ? 'プライバシーポリシー' : locale === 'zh' ? '隐私政策' : 'Privacy Policy'}
          </Link>
        </div>
      </main>
    </div>
  );
}
