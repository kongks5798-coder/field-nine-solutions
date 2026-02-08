/**
 * K-UNIVERSAL Privacy Policy
 * 개인정보처리방침 페이지
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowLeft, ChevronDown, ChevronUp, Shield, Lock, Eye, Database, Trash2, Globe } from 'lucide-react';

const content = {
  ko: {
    title: '개인정보처리방침',
    lastUpdated: '최종 수정일: 2026년 1월 15일',
    intro: 'K-UNIVERSAL(이하 "회사")은 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다.',
    sections: [
      {
        icon: 'Database',
        title: '1. 수집하는 개인정보',
        content: `회사는 서비스 제공을 위해 다음 정보를 수집합니다:

[필수 정보]
• 이메일 주소
• 비밀번호 (암호화 저장)
• 휴대전화 번호
• 이름

[선택 정보]
• 프로필 사진
• 국적
• 생년월일

[KYC 인증 시 (금융서비스 이용)]
• 여권 정보 (여권번호, 만료일, 발급국)
• 실물 여권 사진
• 얼굴 사진 (본인확인용)

[자동 수집 정보]
• 기기 정보 (OS, 앱 버전)
• IP 주소
• 서비스 이용 기록
• 결제 기록`,
      },
      {
        icon: 'Eye',
        title: '2. 개인정보의 이용 목적',
        content: `수집한 개인정보는 다음 목적으로 이용됩니다:

• 회원 가입 및 관리
• 본인 확인 및 인증
• Ghost Wallet 서비스 제공
• 결제 및 환전 서비스 제공
• 택시, 음식배달 등 연계 서비스 제공
• AI 컨시어지 서비스 개인화
• 고객 문의 응대 및 분쟁 해결
• 서비스 개선 및 신규 서비스 개발
• 마케팅 및 광고 (선택 동의 시)`,
      },
      {
        icon: 'Lock',
        title: '3. 개인정보의 보유 및 파기',
        content: `[보유 기간]
• 회원 정보: 회원 탈퇴 시까지
• 결제 기록: 5년 (전자상거래법)
• KYC 정보: 5년 (자금세탁방지법)

[파기 절차]
• 보유 기간 경과 후 지체 없이 파기
• 전자파일: 복구 불가능한 방법으로 삭제
• 서면 자료: 분쇄 또는 소각

[파기 예외]
법령에 따라 보존이 필요한 경우 해당 기간 동안 별도 보관합니다.`,
      },
      {
        icon: 'Globe',
        title: '4. 개인정보의 제3자 제공',
        content: `회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우는 예외입니다:

• 이용자가 사전에 동의한 경우
• 법령에 따라 제공이 요구되는 경우
• 서비스 제공을 위해 필수적인 경우 (택시 호출 시 운전자에게 위치 정보 제공 등)

[제3자 제공 현황]
• 토스페이먼츠: 결제 처리 목적
• 카카오모빌리티: 택시 호출 서비스
• 요기요/배달의민족: 음식 배달 서비스`,
      },
      {
        icon: 'Shield',
        title: '5. 개인정보의 안전성 확보 조치',
        content: `회사는 개인정보 보호를 위해 다음 조치를 시행합니다:

[관리적 조치]
• 개인정보 보호 책임자 지정
• 정기적인 직원 교육
• 내부 관리계획 수립 및 시행

[기술적 조치]
• 개인정보 암호화 (AES-256)
• 보안 프로그램 설치 및 갱신
• 접근 권한 관리 및 로그 기록
• 이중 인증 (2FA) 지원

[물리적 조치]
• 전산실 및 자료보관실 접근 통제`,
      },
      {
        icon: 'Trash2',
        title: '6. 정보주체의 권리',
        content: `이용자는 언제든지 다음 권리를 행사할 수 있습니다:

• 개인정보 열람 요청
• 개인정보 정정 요청
• 개인정보 삭제 요청
• 개인정보 처리 정지 요청
• 동의 철회

권리 행사는 앱 내 '설정 > 개인정보 관리' 또는 고객센터를 통해 가능합니다.`,
      },
    ],
    dataOfficer: {
      title: '개인정보 보호책임자',
      name: '홍길동',
      department: '개인정보보호팀',
      email: 'privacy@k-universal.com',
      phone: '1588-0000',
    },
    contact: {
      title: '개인정보 침해 신고',
      items: [
        { name: '개인정보침해신고센터', url: 'privacy.kisa.or.kr', phone: '118' },
        { name: '대검찰청 사이버범죄수사단', url: 'www.spo.go.kr', phone: '1301' },
        { name: '경찰청 사이버안전국', url: 'cyberbureau.police.go.kr', phone: '182' },
      ],
    },
  },
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated: January 15, 2026',
    intro: 'K-UNIVERSAL ("Company") values your privacy and complies with applicable data protection laws including the Personal Information Protection Act and related regulations.',
    sections: [
      {
        icon: 'Database',
        title: '1. Personal Information We Collect',
        content: `We collect the following information to provide our services:

[Required Information]
• Email address
• Password (encrypted)
• Mobile phone number
• Name

[Optional Information]
• Profile photo
• Nationality
• Date of birth

[KYC Verification (for financial services)]
• Passport information (number, expiry date, issuing country)
• Passport photo
• Face photo (for identity verification)

[Automatically Collected]
• Device information (OS, app version)
• IP address
• Service usage records
• Payment records`,
      },
      {
        icon: 'Eye',
        title: '2. How We Use Your Information',
        content: `We use collected information for:

• Member registration and management
• Identity verification and authentication
• Ghost Wallet service provision
• Payment and currency exchange services
• Connected services (taxi, food delivery, etc.)
• AI Concierge personalization
• Customer support and dispute resolution
• Service improvement and new service development
• Marketing and advertising (with consent)`,
      },
      {
        icon: 'Lock',
        title: '3. Data Retention and Deletion',
        content: `[Retention Period]
• Member information: Until account deletion
• Payment records: 5 years (E-commerce law)
• KYC information: 5 years (AML regulations)

[Deletion Procedure]
• Data deleted promptly after retention period
• Electronic files: Deleted using irrecoverable methods
• Paper documents: Shredded or incinerated

[Exceptions]
Data may be retained separately if required by law.`,
      },
      {
        icon: 'Globe',
        title: '4. Third-Party Data Sharing',
        content: `We do not share your information with third parties except:

• With your prior consent
• When required by law
• When necessary for service provision

[Third-Party Recipients]
• Toss Payments: Payment processing
• Kakao Mobility: Taxi booking service
• Food delivery platforms: Delivery services`,
      },
      {
        icon: 'Shield',
        title: '5. Security Measures',
        content: `We implement the following security measures:

[Administrative]
• Designated Data Protection Officer
• Regular staff training
• Internal management policies

[Technical]
• AES-256 encryption
• Security software installation and updates
• Access control and logging
• Two-factor authentication (2FA)

[Physical]
• Server room access control`,
      },
      {
        icon: 'Trash2',
        title: '6. Your Rights',
        content: `You have the right to:

• Access your personal information
• Correct your information
• Request deletion
• Request processing suspension
• Withdraw consent

Exercise these rights via Settings > Privacy Management or contact support.`,
      },
    ],
    dataOfficer: {
      title: 'Data Protection Officer',
      name: 'Privacy Team',
      department: 'Privacy Protection Team',
      email: 'privacy@k-universal.com',
      phone: '+82-1588-0000',
    },
    contact: {
      title: 'Report Privacy Concerns',
      items: [
        { name: 'KISA Privacy Center', url: 'privacy.kisa.or.kr', phone: '118' },
        { name: 'Cyber Crime Investigation', url: 'www.spo.go.kr', phone: '1301' },
        { name: 'National Police Cyber Bureau', url: 'cyberbureau.police.go.kr', phone: '182' },
      ],
    },
  },
  ja: {
    title: 'プライバシーポリシー',
    lastUpdated: '最終更新日: 2026年1月15日',
    intro: 'K-UNIVERSAL（以下「会社」）は、お客様の個人情報を重要視し、個人情報保護法をはじめとする関連法令を遵守します。',
    sections: [
      {
        icon: 'Database',
        title: '1. 収集する個人情報',
        content: `サービス提供のため、以下の情報を収集します：

[必須情報]
• メールアドレス
• パスワード（暗号化保存）
• 携帯電話番号
• 氏名

[任意情報]
• プロフィール写真
• 国籍
• 生年月日

[KYC認証時（金融サービス利用）]
• パスポート情報
• パスポート写真
• 顔写真（本人確認用）`,
      },
    ],
    dataOfficer: {
      title: 'データ保護責任者',
      name: 'プライバシーチーム',
      department: '個人情報保護チーム',
      email: 'privacy@k-universal.com',
      phone: '+82-1588-0000',
    },
    contact: {
      title: 'プライバシーに関するお問い合わせ',
      items: [
        { name: 'KISA プライバシーセンター', url: 'privacy.kisa.or.kr', phone: '118' },
      ],
    },
  },
  zh: {
    title: '隐私政策',
    lastUpdated: '最后更新：2026年1月15日',
    intro: 'K-UNIVERSAL（以下简称"公司"）重视用户隐私，遵守《个人信息保护法》等相关法律法规。',
    sections: [
      {
        icon: 'Database',
        title: '1. 收集的个人信息',
        content: `为提供服务，我们收集以下信息：

[必填信息]
• 电子邮件地址
• 密码（加密存储）
• 手机号码
• 姓名

[选填信息]
• 头像
• 国籍
• 出生日期

[KYC验证时（使用金融服务）]
• 护照信息
• 护照照片
• 人脸照片（身份验证用）`,
      },
    ],
    dataOfficer: {
      title: '数据保护负责人',
      name: '隐私团队',
      department: '个人信息保护组',
      email: 'privacy@k-universal.com',
      phone: '+82-1588-0000',
    },
    contact: {
      title: '隐私问题举报',
      items: [
        { name: 'KISA隐私中心', url: 'privacy.kisa.or.kr', phone: '118' },
      ],
    },
  },
};

const iconMap = {
  Database,
  Eye,
  Lock,
  Globe,
  Shield,
  Trash2,
};

export default function PrivacyPage() {
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
          <Shield className="w-5 h-5 text-green-500" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 rounded-xl p-4 border border-green-100 mb-6"
        >
          <p className="text-green-800 text-sm leading-relaxed">{t.intro}</p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-3">
          {t.sections.map((section, index) => {
            const IconComponent = iconMap[section.icon as keyof typeof iconMap] || Shield;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="flex-1 font-medium text-gray-900 text-left">{section.title}</span>
                  {expandedSections.has(index) ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedSections.has(index) && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    className="px-4 pb-4"
                  >
                    <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed ml-11">
                      {section.content}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Data Protection Officer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white rounded-xl p-4 border border-gray-200"
        >
          <h3 className="font-semibold text-gray-900 mb-3">{t.dataOfficer.title}</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>{t.dataOfficer.name}</p>
            <p>{t.dataOfficer.department}</p>
            <p>Email: {t.dataOfficer.email}</p>
            <p>Tel: {t.dataOfficer.phone}</p>
          </div>
        </motion.div>

        {/* Report Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 bg-gray-100 rounded-xl p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-3">{t.contact.title}</h3>
          <div className="space-y-2">
            {t.contact.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="text-gray-500">{item.phone}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Related Links */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/legal/terms"
            className="flex-1 py-3 px-4 bg-white border border-gray-200 rounded-xl text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {locale === 'ko' ? '이용약관' : locale === 'ja' ? '利用規約' : locale === 'zh' ? '服务条款' : 'Terms of Service'}
          </Link>
        </div>
      </main>
    </div>
  );
}
