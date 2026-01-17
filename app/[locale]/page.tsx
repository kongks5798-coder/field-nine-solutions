/**
 * NOMAD - 글로벌 여행 페이백 플랫폼
 * "호텔 예약하고, 페이백 받자."
 *
 * Business Model: Affiliate + Effective Price
 * - Guests pay standard price, we keep commission (50% margin)
 * - Members pay same price, get commission back as Payback (up to 100%)
 */

'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Globe,
  Gift,
  Hotel,
  Plane,
  MessageSquare,
  ArrowRight,
  Check,
  ChevronRight,
  ChevronDown,
  Star,
  Lock,
  Sparkles,
  CreditCard,
  Shield,
  Clock,
  Users,
  ExternalLink,
  Plus,
  Minus,
  Zap,
} from 'lucide-react';

// ============================================
// Translations
// ============================================
const translations = {
  ko: {
    // Navigation
    nav: {
      howItWorks: '이용 방법',
      pricing: '요금제',
      faq: '자주 묻는 질문',
      signIn: '로그인',
      startFree: '무료 시작',
    },
    // Hero
    hero: {
      badge: '매 예약마다 최대 8% 페이백',
      headline1: '호텔 예약하고',
      headline2: '페이백 받자.',
      description1: '같은 호텔, 같은 가격. 하지만 멤버는 캐시백을 받습니다.',
      description2: '구독하고 모든 여행을 절약으로 바꾸세요.',
      feature1: 'Booking.com & Agoda 호텔',
      feature2: '최대 8% 페이백',
      feature3: 'AI 여행 어시스턴트',
      cta1: '페이백 시작하기',
      cta2: '이용 방법 보기',
      stat1Label: '최대 페이백',
      stat2Label: '파트너 사이트',
      stat3Label: '시작 비용',
    },
    // How It Works
    howItWorks: {
      badge: '간단한 프로세스',
      title: '페이백 작동 방식',
      subtitle: '트릭 없음. 함정 없음. 매 예약마다 확실한 절약.',
      step1Title: '검색 & 비교',
      step1Desc: 'NOMAD에서 호텔을 검색하세요. Booking.com, Agoda 등의 가격을 보여드립니다.',
      step2Title: '파트너에서 예약',
      step2Desc: '클릭하여 파트너 사이트에서 예약하세요. 표준 가격으로 결제합니다.',
      step3Title: '페이백 받기',
      step3Desc: '체크아웃 후 48시간 내에 최대 8%를 NOMAD 크레딧으로 받으세요.',
    },
    // Effective Price Demo
    priceDemo: {
      badge: '차이를 확인하세요',
      title: '같은 호텔, 다른 가격.',
      subtitle: '게스트가 지불하는 금액 vs. 노마드 멤버가 실제로 지불하는 금액을 비교하세요.',
      guestTab: '게스트 (구독 없음)',
      nomadTab: '노마드 멤버',
      hotelName: '샘플 호텔 도쿄',
      hotelLocation: '신주쿠, 도쿄',
      viaAgoda: 'via Agoda (8% 커미션)',
      hotelPrice: '호텔 가격',
      memberPayback: '멤버 페이백',
      yourPayback: '당신의 페이백',
      effectivePrice: '실질 가격',
      guestMessage: '당신은 $200을 지불합니다. 우리가 $16 커미션을 가져갑니다.',
      nomadMessage: '$200 결제, $16을 크레딧으로 받습니다. 실질 비용: $184',
      becomeNomad: '노마드 멤버 되기',
      upgradeToSave: '업그레이드로 절약하기',
      savingsHint: '$1,000 호텔 예약 → 노마드 멤버로 최대 $80 돌려받기',
    },
    // Payback Tiers
    tiers: {
      badge: '멤버십 티어',
      title1: '더 많이 구독할수록',
      title2: '더 많이 번다',
      subtitle: '여행 빈도에 맞는 티어를 선택하세요. 높은 티어 = 더 많은 페이백.',
      paybackRate: '페이백 비율',
      free: '무료',
      mo: '/월',
      best: '베스트',
      howItWorksTitle: '페이백 비율 작동 방식',
      howItWorksDesc: '$200 호텔 예약 시 8% 파트너 커미션($16)에서, 노마드 멤버(100%)는 $16 전액을 돌려받습니다. 익스플로러(50%)는 $8을 받습니다. 게스트는 아무것도 받지 못합니다 — 우리가 커미션을 가져갑니다.',
    },
    // Partners
    partners: {
      badge: '신뢰할 수 있는 파트너',
      title: '자신감 있게 예약하세요',
      subtitle: '세계 최고의 여행 플랫폼과 파트너십을 맺고 있습니다. 같은 재고, 같은 가격 — 페이백은 덤.',
      upToPayback: '최대 페이백',
      secureBooking: '안전한 예약',
      noHiddenFees: '숨겨진 비용 없음',
      paybackIn48h: '48시간 내 페이백',
      members: '10K+ 멤버',
    },
    // AI Concierge
    ai: {
      badge: 'GPT-4 기반',
      title1: 'AI 여행',
      title2: '컨시어지',
      description: '여행에 대해 무엇이든 물어보세요. 목적지, 비자, 현지 팁 등에 대한 즉각적인 답변을 받으세요. 모든 멤버십에 무료로 포함됩니다.',
      feature1: '24시간 이용 가능',
      feature2: '50개 이상 언어 지원',
      feature3: '맞춤형 추천',
      feature4: '모든 멤버 무료',
      tryButton: 'AI 컨시어지 사용하기',
      chatQuestion: '벚꽃 보기 좋은 일본 여행 시기는?',
      chatAnswer: '3월 말~4월 초가 이상적입니다! 도쿄는 보통 3월 25일~4월 5일에 절정입니다. 교토는 보통 1주일 늦습니다. 벚꽃 전망 호텔을 찾아볼까요? 🌸',
    },
    // Pricing
    pricing: {
      badge: '심플한 요금제',
      title: '플랜을 선택하세요',
      subtitle: '무료로 시작하세요. 페이백이 구독료를 초과하면 업그레이드하세요.',
      mostPopular: '인기',
      getStarted: '시작하기',
      freeTierNote: '0% 페이백의 무료 티어 이용 가능. 플랫폼을 체험해보기에 완벽합니다.',
      // Explorer
      explorerName: '익스플로러',
      explorerDesc: '가끔 여행하는 분',
      explorerF1: '50% 페이백 비율',
      explorerF2: 'AI 컨시어지 (무제한)',
      explorerF3: '호텔 & 항공편 검색',
      explorerF4: '가격 알림',
      // Nomad
      nomadName: '노마드',
      nomadDesc: '자주 여행하는 분',
      nomadF1: '100% 페이백 비율',
      nomadF2: 'AI 컨시어지 (무제한)',
      nomadF3: '우선 지원',
      nomadF4: '딜 조기 접근',
      nomadF5: '월간 여행 리포트',
      // Business
      businessName: '비즈니스',
      businessDesc: '팀 & 에이전시용',
      businessF1: '100% 페이백 비율',
      businessF2: '노마드의 모든 기능',
      businessF3: '팀 대시보드',
      businessF4: '경비 리포트',
      businessF5: '전담 매니저',
    },
    // FAQ
    faq: {
      badge: 'FAQ',
      title: '자주 묻는 질문',
      q1: '페이백은 어떻게 작동하나요?',
      a1: '파트너 링크(Booking.com, Agoda 등)를 통해 예약하면, 그들이 우리에게 커미션(보통 5-8%)을 지불합니다. 멤버로서, 우리는 그 커미션의 일정 비율을 NOMAD 크레딧으로 돌려드립니다.',
      q2: '페이백은 언제 받나요?',
      a2: '호텔 체크아웃 완료 후 48시간 이내에 NOMAD 지갑에 적립됩니다. 크레딧은 향후 예약에 사용하거나 은행으로 출금할 수 있습니다.',
      q3: 'NOMAD에서 호텔 가격이 더 비싼가요?',
      a3: '아니요. 가격은 파트너 사이트에서 직접 예약하는 것과 정확히 동일합니다. 유일한 차이점은 NOMAD 멤버로서 페이백을 받는다는 것입니다.',
      q4: '예약을 취소하면 어떻게 되나요?',
      a4: '예약을 취소하면 해당 예약에 대한 대기 중인 페이백이 취소됩니다. 완료된 숙박만 페이백을 받습니다.',
      q5: '구독할 가치가 있나요?',
      a5: '월 $500 이상의 호텔을 예약한다면, 익스플로러($9.99)도 충분히 본전을 뽑습니다. 월 $1000 예약하는 노마드 멤버는 ~$80을 돌려받아, $29.99 구독료를 훨씬 초과합니다.',
    },
    // Final CTA
    finalCta: {
      title1: '오늘부터',
      title2: '페이백 받기',
      description: 'NOMAD 없이 하는 모든 예약은 테이블 위에 돈을 남겨두는 것입니다. 30초 만에 가입하고 적립을 시작하세요.',
      cta: '무료 계정 만들기',
      note: '신용카드 불필요. 언제든 취소 가능.',
    },
    // Footer
    footer: {
      tagline: '호텔 예약하고. 페이백 받자.',
      product: '제품',
      company: '회사',
      legal: '법적 고지',
      howItWorks: '이용 방법',
      pricingLink: '요금제',
      partnersLink: '파트너',
      aiConcierge: 'AI 컨시어지',
      about: '소개',
      blog: '블로그',
      careers: '채용',
      contact: '문의',
      privacy: '개인정보처리방침',
      terms: '이용약관',
      cookies: '쿠키 정책',
      copyright: '© 2025 NOMAD. All rights reserved.',
      affiliate: 'Booking.com, Agoda 등의 제휴 파트너',
    },
  },
  en: {
    nav: {
      howItWorks: 'How It Works',
      pricing: 'Pricing',
      faq: 'FAQ',
      signIn: 'Sign In',
      startFree: 'Start Free',
    },
    hero: {
      badge: 'Get up to 8% back on every booking',
      headline1: 'Book Hotels.',
      headline2: 'Get Payback.',
      description1: 'Same hotels. Same prices. But members get cash back.',
      description2: 'Subscribe and turn every trip into savings.',
      feature1: 'Hotels from Booking.com & Agoda',
      feature2: 'Up to 8% Payback',
      feature3: 'AI Travel Assistant',
      cta1: 'Start Earning Payback',
      cta2: 'See How It Works',
      stat1Label: 'Max Payback',
      stat2Label: 'Partner Sites',
      stat3Label: 'To Start',
    },
    howItWorks: {
      badge: 'Simple Process',
      title: 'How Payback Works',
      subtitle: 'No tricks. No catches. Just straightforward savings on every booking.',
      step1Title: 'Browse & Compare',
      step1Desc: 'Search hotels on NOMAD. We show prices from Booking.com, Agoda, and more.',
      step2Title: 'Book via Partner',
      step2Desc: 'Click to book on the partner site. You pay their standard price.',
      step3Title: 'Get Payback',
      step3Desc: 'After checkout, receive up to 8% back as NOMAD Credits within 48 hours.',
    },
    priceDemo: {
      badge: 'See The Difference',
      title: 'Same Hotel. Different Price.',
      subtitle: 'Compare what guests pay vs. what Nomad members effectively pay.',
      guestTab: 'Guest (No Subscription)',
      nomadTab: 'Nomad Member',
      hotelName: 'Sample Hotel Tokyo',
      hotelLocation: 'Shinjuku, Tokyo',
      viaAgoda: 'via Agoda (8% commission)',
      hotelPrice: 'Hotel Price',
      memberPayback: 'Member Payback',
      yourPayback: 'Your Payback',
      effectivePrice: 'Effective Price',
      guestMessage: 'You pay $200. We keep the $16 commission.',
      nomadMessage: 'Pay $200, get $16 back as credits. Effective cost: $184',
      becomeNomad: 'Become a Nomad Member',
      upgradeToSave: 'Upgrade to Save',
      savingsHint: 'Book $1,000 in hotels → Get up to $80 back as a Nomad member',
    },
    tiers: {
      badge: 'Membership Tiers',
      title1: 'More You Subscribe,',
      title2: 'More You Earn',
      subtitle: 'Choose a tier that matches your travel frequency. Higher tiers = more payback.',
      paybackRate: 'Payback Rate',
      free: 'Free',
      mo: '/mo',
      best: 'BEST',
      howItWorksTitle: 'How Payback Rate Works',
      howItWorksDesc: 'When you book a $200 hotel with 8% partner commission ($16), a Nomad member (100%) gets the full $16 back. An Explorer (50%) gets $8. Guests get nothing — we keep the commission.',
    },
    partners: {
      badge: 'Trusted Partners',
      title: 'Book with Confidence',
      subtitle: 'We partner with the world\'s leading travel platforms. Same inventory, same prices — plus payback.',
      upToPayback: 'Up to Payback',
      secureBooking: 'Secure Booking',
      noHiddenFees: 'No Hidden Fees',
      paybackIn48h: 'Payback in 48h',
      members: '10K+ Members',
    },
    ai: {
      badge: 'GPT-4 Powered',
      title1: 'AI Travel',
      title2: 'Concierge',
      description: 'Ask anything about your trip. Get instant answers about destinations, visas, local tips, and more. Included free with all memberships.',
      feature1: '24/7 availability',
      feature2: 'Supports 50+ languages',
      feature3: 'Personalized recommendations',
      feature4: 'Free for all members',
      tryButton: 'Try AI Concierge',
      chatQuestion: 'Best time to visit Japan for cherry blossoms?',
      chatAnswer: 'Late March to early April is ideal! Tokyo peaks around March 25-April 5. Kyoto is usually 1 week later. Want me to find hotels with cherry blossom views? 🌸',
    },
    pricing: {
      badge: 'Simple Pricing',
      title: 'Choose Your Plan',
      subtitle: 'Start free. Upgrade when your payback exceeds subscription cost.',
      mostPopular: 'MOST POPULAR',
      getStarted: 'Get Started',
      freeTierNote: 'Free tier available with 0% payback. Perfect for trying out the platform.',
      explorerName: 'Explorer',
      explorerDesc: 'For occasional travelers',
      explorerF1: '50% Payback Rate',
      explorerF2: 'AI Concierge (Unlimited)',
      explorerF3: 'Hotel & Flight Search',
      explorerF4: 'Price Alerts',
      nomadName: 'Nomad',
      nomadDesc: 'For frequent travelers',
      nomadF1: '100% Payback Rate',
      nomadF2: 'AI Concierge (Unlimited)',
      nomadF3: 'Priority Support',
      nomadF4: 'Early Access to Deals',
      nomadF5: 'Monthly Travel Report',
      businessName: 'Business',
      businessDesc: 'For teams & agencies',
      businessF1: '100% Payback Rate',
      businessF2: 'Everything in Nomad',
      businessF3: 'Team Dashboard',
      businessF4: 'Expense Reports',
      businessF5: 'Dedicated Manager',
    },
    faq: {
      badge: 'FAQ',
      title: 'Common Questions',
      q1: 'How does Payback work?',
      a1: 'When you book through our partner links (Booking.com, Agoda, etc.), they pay us a commission (typically 5-8%). As a member, we return a percentage of that commission to you as NOMAD Credits.',
      q2: 'When do I receive my Payback?',
      a2: 'Payback is credited to your NOMAD wallet within 48 hours after you complete your hotel checkout. You can use credits on future bookings or withdraw to your bank.',
      q3: 'Are the hotel prices higher on NOMAD?',
      a3: 'No. The prices are exactly the same as booking directly on our partner sites. The only difference is you get payback as a NOMAD member.',
      q4: 'What if I cancel my booking?',
      a4: 'If you cancel a booking, any pending payback for that booking will be cancelled. Only completed stays earn payback.',
      q5: 'Is the subscription worth it?',
      a5: 'If you book $500+ in hotels per month, even Explorer ($9.99) pays for itself. Nomad members booking $1000/month get ~$80 back, far exceeding the $29.99 subscription.',
    },
    finalCta: {
      title1: 'Start Getting',
      title2: 'Payback Today',
      description: 'Every booking without NOMAD is money left on the table. Sign up in 30 seconds and start earning.',
      cta: 'Create Free Account',
      note: 'No credit card required. Cancel anytime.',
    },
    footer: {
      tagline: 'Book hotels. Get payback.',
      product: 'Product',
      company: 'Company',
      legal: 'Legal',
      howItWorks: 'How It Works',
      pricingLink: 'Pricing',
      partnersLink: 'Partners',
      aiConcierge: 'AI Concierge',
      about: 'About',
      blog: 'Blog',
      careers: 'Careers',
      contact: 'Contact',
      privacy: 'Privacy',
      terms: 'Terms',
      cookies: 'Cookies',
      copyright: '© 2025 NOMAD. All rights reserved.',
      affiliate: 'Affiliate Partner of Booking.com, Agoda & more',
    },
  },
  ja: {
    nav: {
      howItWorks: '使い方',
      pricing: '料金',
      faq: 'よくある質問',
      signIn: 'ログイン',
      startFree: '無料で始める',
    },
    hero: {
      badge: '毎回の予約で最大8%還元',
      headline1: 'ホテルを予約。',
      headline2: 'ペイバックを獲得。',
      description1: '同じホテル、同じ価格。でもメンバーはキャッシュバックがもらえます。',
      description2: '購読して、すべての旅行を節約に変えましょう。',
      feature1: 'Booking.com & Agodaのホテル',
      feature2: '最大8%ペイバック',
      feature3: 'AI旅行アシスタント',
      cta1: 'ペイバックを始める',
      cta2: '使い方を見る',
      stat1Label: '最大ペイバック',
      stat2Label: 'パートナーサイト',
      stat3Label: '開始費用',
    },
    howItWorks: {
      badge: 'シンプルなプロセス',
      title: 'ペイバックの仕組み',
      subtitle: 'トリックなし。落とし穴なし。毎回の予約で確実な節約。',
      step1Title: '検索＆比較',
      step1Desc: 'NOMADでホテルを検索。Booking.com、Agodaなどの価格を表示します。',
      step2Title: 'パートナーで予約',
      step2Desc: 'クリックしてパートナーサイトで予約。標準価格でお支払い。',
      step3Title: 'ペイバック獲得',
      step3Desc: 'チェックアウト後48時間以内に最大8%をNOMADクレジットで獲得。',
    },
    priceDemo: {
      badge: '違いを確認',
      title: '同じホテル、違う価格。',
      subtitle: 'ゲストが支払う金額vs.ノマドメンバーが実質的に支払う金額を比較。',
      guestTab: 'ゲスト（購読なし）',
      nomadTab: 'ノマドメンバー',
      hotelName: 'サンプルホテル東京',
      hotelLocation: '新宿、東京',
      viaAgoda: 'via Agoda (8%コミッション)',
      hotelPrice: 'ホテル価格',
      memberPayback: 'メンバーペイバック',
      yourPayback: 'あなたのペイバック',
      effectivePrice: '実質価格',
      guestMessage: '$200を支払います。私たちが$16のコミッションを受け取ります。',
      nomadMessage: '$200支払い、$16をクレジットで獲得。実質コスト: $184',
      becomeNomad: 'ノマドメンバーになる',
      upgradeToSave: 'アップグレードで節約',
      savingsHint: '$1,000のホテル予約 → ノマドメンバーとして最大$80還元',
    },
    tiers: {
      badge: 'メンバーシップティア',
      title1: '多く購読するほど',
      title2: '多く稼ぐ',
      subtitle: '旅行頻度に合ったティアを選択。高いティア＝より多くのペイバック。',
      paybackRate: 'ペイバック率',
      free: '無料',
      mo: '/月',
      best: 'ベスト',
      howItWorksTitle: 'ペイバック率の仕組み',
      howItWorksDesc: '$200のホテル予約で8%パートナーコミッション（$16）の場合、ノマドメンバー（100%）は$16全額を獲得。エクスプローラー（50%）は$8を獲得。ゲストは何も獲得できません—私たちがコミッションを受け取ります。',
    },
    partners: {
      badge: '信頼できるパートナー',
      title: '自信を持って予約',
      subtitle: '世界有数の旅行プラットフォームと提携。同じ在庫、同じ価格—プラスペイバック。',
      upToPayback: '最大ペイバック',
      secureBooking: '安全な予約',
      noHiddenFees: '隠れた費用なし',
      paybackIn48h: '48時間以内にペイバック',
      members: '10K+メンバー',
    },
    ai: {
      badge: 'GPT-4搭載',
      title1: 'AI旅行',
      title2: 'コンシェルジュ',
      description: '旅行について何でも聞いてください。目的地、ビザ、現地のヒントなどについて即座に回答。すべてのメンバーシップに無料で含まれています。',
      feature1: '24時間利用可能',
      feature2: '50以上の言語をサポート',
      feature3: 'パーソナライズされた推奨',
      feature4: '全メンバー無料',
      tryButton: 'AIコンシェルジュを試す',
      chatQuestion: '桜を見るのに最適な日本旅行の時期は？',
      chatAnswer: '3月下旬から4月上旬が理想的です！東京は通常3月25日〜4月5日がピークです。京都は通常1週間遅れます。桜の見えるホテルを探しましょうか？🌸',
    },
    pricing: {
      badge: 'シンプルな料金',
      title: 'プランを選択',
      subtitle: '無料で開始。ペイバックが購読料を超えたらアップグレード。',
      mostPopular: '人気',
      getStarted: '始める',
      freeTierNote: '0%ペイバックの無料ティア利用可能。プラットフォームを試すのに最適。',
      explorerName: 'エクスプローラー',
      explorerDesc: '時々旅行する方向け',
      explorerF1: '50%ペイバック率',
      explorerF2: 'AIコンシェルジュ（無制限）',
      explorerF3: 'ホテル＆フライト検索',
      explorerF4: '価格アラート',
      nomadName: 'ノマド',
      nomadDesc: '頻繁に旅行する方向け',
      nomadF1: '100%ペイバック率',
      nomadF2: 'AIコンシェルジュ（無制限）',
      nomadF3: '優先サポート',
      nomadF4: 'ディールへの早期アクセス',
      nomadF5: '月間旅行レポート',
      businessName: 'ビジネス',
      businessDesc: 'チーム＆エージェンシー向け',
      businessF1: '100%ペイバック率',
      businessF2: 'ノマドのすべての機能',
      businessF3: 'チームダッシュボード',
      businessF4: '経費レポート',
      businessF5: '専任マネージャー',
    },
    faq: {
      badge: 'FAQ',
      title: 'よくある質問',
      q1: 'ペイバックはどのように機能しますか？',
      a1: 'パートナーリンク（Booking.com、Agodaなど）から予約すると、彼らが私たちにコミッション（通常5-8%）を支払います。メンバーとして、そのコミッションの一部をNOMADクレジットとしてお返しします。',
      q2: 'ペイバックはいつ受け取れますか？',
      a2: 'ホテルのチェックアウト完了後48時間以内にNOMADウォレットに入金されます。クレジットは将来の予約に使用するか、銀行に出金できます。',
      q3: 'NOMADでホテル価格は高いですか？',
      a3: 'いいえ。価格はパートナーサイトで直接予約するのと全く同じです。唯一の違いは、NOMADメンバーとしてペイバックがもらえることです。',
      q4: '予約をキャンセルしたらどうなりますか？',
      a4: '予約をキャンセルすると、その予約の保留中のペイバックはキャンセルされます。完了した滞在のみペイバックを獲得できます。',
      q5: '購読する価値はありますか？',
      a5: '月に$500以上のホテルを予約するなら、エクスプローラー（$9.99）でも元が取れます。月$1000予約するノマドメンバーは〜$80を獲得し、$29.99の購読料を大きく上回ります。',
    },
    finalCta: {
      title1: '今日から',
      title2: 'ペイバック開始',
      description: 'NOMADなしの予約は、テーブルにお金を残すようなものです。30秒で登録して稼ぎ始めましょう。',
      cta: '無料アカウント作成',
      note: 'クレジットカード不要。いつでもキャンセル可能。',
    },
    footer: {
      tagline: 'ホテルを予約。ペイバックを獲得。',
      product: '製品',
      company: '会社',
      legal: '法的情報',
      howItWorks: '使い方',
      pricingLink: '料金',
      partnersLink: 'パートナー',
      aiConcierge: 'AIコンシェルジュ',
      about: '概要',
      blog: 'ブログ',
      careers: '採用',
      contact: 'お問い合わせ',
      privacy: 'プライバシー',
      terms: '利用規約',
      cookies: 'クッキー',
      copyright: '© 2025 NOMAD. All rights reserved.',
      affiliate: 'Booking.com、Agodaなどのアフィリエイトパートナー',
    },
  },
  zh: {
    nav: {
      howItWorks: '使用方法',
      pricing: '价格',
      faq: '常见问题',
      signIn: '登录',
      startFree: '免费开始',
    },
    hero: {
      badge: '每次预订最高返还8%',
      headline1: '预订酒店。',
      headline2: '获得返现。',
      description1: '相同的酒店，相同的价格。但会员可以获得现金返还。',
      description2: '订阅后，让每次旅行都变成节省。',
      feature1: 'Booking.com & Agoda酒店',
      feature2: '最高8%返现',
      feature3: 'AI旅行助手',
      cta1: '开始赚取返现',
      cta2: '查看使用方法',
      stat1Label: '最高返现',
      stat2Label: '合作网站',
      stat3Label: '起始费用',
    },
    howItWorks: {
      badge: '简单流程',
      title: '返现如何运作',
      subtitle: '没有花招。没有陷阱。每次预订都能实实在在地节省。',
      step1Title: '浏览和比较',
      step1Desc: '在NOMAD搜索酒店。我们展示Booking.com、Agoda等的价格。',
      step2Title: '通过合作伙伴预订',
      step2Desc: '点击在合作伙伴网站预订。您支付标准价格。',
      step3Title: '获得返现',
      step3Desc: '退房后48小时内，以NOMAD积分形式获得最高8%的返还。',
    },
    priceDemo: {
      badge: '看看区别',
      title: '相同酒店，不同价格。',
      subtitle: '比较访客支付的金额与Nomad会员实际支付的金额。',
      guestTab: '访客（无订阅）',
      nomadTab: 'Nomad会员',
      hotelName: '东京示例酒店',
      hotelLocation: '新宿，东京',
      viaAgoda: '通过Agoda（8%佣金）',
      hotelPrice: '酒店价格',
      memberPayback: '会员返现',
      yourPayback: '您的返现',
      effectivePrice: '实际价格',
      guestMessage: '您支付$200。我们保留$16佣金。',
      nomadMessage: '支付$200，获得$16积分。实际成本：$184',
      becomeNomad: '成为Nomad会员',
      upgradeToSave: '升级以节省',
      savingsHint: '预订$1,000酒店 → 作为Nomad会员最高返还$80',
    },
    tiers: {
      badge: '会员等级',
      title1: '订阅越多',
      title2: '赚得越多',
      subtitle: '选择适合您旅行频率的等级。更高等级=更多返现。',
      paybackRate: '返现率',
      free: '免费',
      mo: '/月',
      best: '最佳',
      howItWorksTitle: '返现率如何运作',
      howItWorksDesc: '预订$200酒店，8%合作伙伴佣金（$16），Nomad会员（100%）获得全部$16。Explorer（50%）获得$8。访客什么也得不到——我们保留佣金。',
    },
    partners: {
      badge: '值得信赖的合作伙伴',
      title: '放心预订',
      subtitle: '我们与世界领先的旅游平台合作。相同的库存，相同的价格——加上返现。',
      upToPayback: '最高返现',
      secureBooking: '安全预订',
      noHiddenFees: '无隐藏费用',
      paybackIn48h: '48小时内返现',
      members: '10K+会员',
    },
    ai: {
      badge: 'GPT-4驱动',
      title1: 'AI旅行',
      title2: '礼宾服务',
      description: '询问任何关于旅行的问题。获得关于目的地、签证、当地提示等的即时答案。所有会员免费包含。',
      feature1: '24/7全天候服务',
      feature2: '支持50+种语言',
      feature3: '个性化推荐',
      feature4: '所有会员免费',
      tryButton: '试用AI礼宾',
      chatQuestion: '去日本看樱花的最佳时间？',
      chatAnswer: '3月下旬到4月初最理想！东京通常在3月25日至4月5日达到高峰。京都通常晚一周。需要我帮您找可以看到樱花的酒店吗？🌸',
    },
    pricing: {
      badge: '简单定价',
      title: '选择您的计划',
      subtitle: '免费开始。当返现超过订阅费用时升级。',
      mostPopular: '最受欢迎',
      getStarted: '开始',
      freeTierNote: '提供0%返现的免费等级。非常适合试用平台。',
      explorerName: '探索者',
      explorerDesc: '适合偶尔旅行者',
      explorerF1: '50%返现率',
      explorerF2: 'AI礼宾（无限制）',
      explorerF3: '酒店和航班搜索',
      explorerF4: '价格提醒',
      nomadName: 'Nomad',
      nomadDesc: '适合频繁旅行者',
      nomadF1: '100%返现率',
      nomadF2: 'AI礼宾（无限制）',
      nomadF3: '优先支持',
      nomadF4: '提前获取优惠',
      nomadF5: '月度旅行报告',
      businessName: '商务',
      businessDesc: '适合团队和代理商',
      businessF1: '100%返现率',
      businessF2: 'Nomad的所有功能',
      businessF3: '团队仪表板',
      businessF4: '费用报告',
      businessF5: '专属经理',
    },
    faq: {
      badge: '常见问题',
      title: '常见问题',
      q1: '返现如何运作？',
      a1: '当您通过我们的合作伙伴链接（Booking.com、Agoda等）预订时，他们向我们支付佣金（通常为5-8%）。作为会员，我们将该佣金的一定比例以NOMAD积分形式返还给您。',
      q2: '我什么时候能收到返现？',
      a2: '在您完成酒店退房后48小时内，返现将记入您的NOMAD钱包。您可以在将来的预订中使用积分或提现到银行。',
      q3: 'NOMAD上的酒店价格更高吗？',
      a3: '不。价格与直接在我们的合作伙伴网站上预订完全相同。唯一的区别是作为NOMAD会员您可以获得返现。',
      q4: '如果我取消预订会怎样？',
      a4: '如果您取消预订，该预订的任何待处理返现将被取消。只有完成的住宿才能获得返现。',
      q5: '订阅值得吗？',
      a5: '如果您每月预订$500以上的酒店，即使是Explorer（$9.99）也能回本。每月预订$1000的Nomad会员可获得约$80，远超$29.99的订阅费。',
    },
    finalCta: {
      title1: '今天开始',
      title2: '获得返现',
      description: '没有NOMAD的每次预订都是把钱留在桌上。30秒注册，开始赚钱。',
      cta: '创建免费账户',
      note: '无需信用卡。随时取消。',
    },
    footer: {
      tagline: '预订酒店。获得返现。',
      product: '产品',
      company: '公司',
      legal: '法律',
      howItWorks: '使用方法',
      pricingLink: '价格',
      partnersLink: '合作伙伴',
      aiConcierge: 'AI礼宾',
      about: '关于',
      blog: '博客',
      careers: '招聘',
      contact: '联系',
      privacy: '隐私',
      terms: '条款',
      cookies: 'Cookie',
      copyright: '© 2025 NOMAD. 保留所有权利。',
      affiliate: 'Booking.com、Agoda等的联盟合作伙伴',
    },
  },
};

type LocaleKey = keyof typeof translations;

function getT(locale: string) {
  const key = (locale as LocaleKey) in translations ? locale as LocaleKey : 'ko';
  return translations[key];
}

// ============================================
// Animation Variants
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// ============================================
// Payback Tier Data
// ============================================
const TIERS = [
  { id: 'guest', name: 'Guest', nameKo: '게스트', rate: 0, price: 0, color: 'text-white/40', bg: 'bg-white/5' },
  { id: 'explorer', name: 'Explorer', nameKo: '익스플로러', rate: 50, price: 9.99, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'traveler', name: 'Traveler', nameKo: '트래블러', rate: 75, price: 19.99, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'nomad', name: 'Nomad', nameKo: '노마드', rate: 100, price: 29.99, color: 'text-emerald-400', bg: 'bg-emerald-500/10', popular: true },
  { id: 'business', name: 'Business', nameKo: '비즈니스', rate: 100, price: 49.99, color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

// ============================================
// Partner Data
// ============================================
const PARTNERS = [
  { name: 'Booking.com', logo: '🏨', commission: '6%', color: 'from-blue-600 to-blue-500' },
  { name: 'Agoda', logo: '🌟', commission: '8%', color: 'from-red-500 to-rose-500' },
  { name: 'Expedia', logo: '✈️', commission: '7%', color: 'from-yellow-500 to-amber-500' },
  { name: 'Hotels.com', logo: '⭐', commission: '5%', color: 'from-rose-500 to-pink-500' },
];

// ============================================
// Main Landing Page
// ============================================
export default function NomadLandingPage() {
  const locale = useLocale();
  const t = getT(locale);

  return (
    <div className="bg-[#0A0A0F] min-h-screen overflow-x-hidden">
      <Navigation locale={locale} t={t} />
      <HeroSection locale={locale} t={t} />
      <HowItWorksSection t={t} />
      <EffectivePriceDemo locale={locale} t={t} />
      <PaybackTiersSection locale={locale} t={t} />
      <PartnersSection t={t} />
      <AIConciergeSection locale={locale} t={t} />
      <PricingSection locale={locale} t={t} />
      <FAQSection t={t} />
      <FinalCTASection locale={locale} t={t} />
      <Footer locale={locale} t={t} />
    </div>
  );
}

// ============================================
// Navigation
// ============================================
function Navigation({ locale, t }: { locale: string; t: typeof translations.ko }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">NOMAD</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-white/60 hover:text-white transition-colors text-sm">
              {t.nav.howItWorks}
            </a>
            <a href="#pricing" className="text-white/60 hover:text-white transition-colors text-sm">
              {t.nav.pricing}
            </a>
            <a href="#faq" className="text-white/60 hover:text-white transition-colors text-sm">
              {t.nav.faq}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/${locale}/auth/login`}>
              <button className="hidden sm:block px-4 py-2 text-white/70 hover:text-white transition-colors text-sm">
                {t.nav.signIn}
              </button>
            </Link>
            <Link href={`/${locale}/auth/signup`}>
              <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-sm transition-colors">
                {t.nav.startFree}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ============================================
// Hero Section
// ============================================
function HeroSection({ locale, t }: { locale: string; t: typeof translations.ko }) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative px-4 pt-20">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
            <Gift className="w-4 h-4" />
            {t.hero.badge}
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]"
        >
          {t.hero.headline1}
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            {t.hero.headline2}
          </span>
        </motion.h1>

        {/* Sub Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10"
        >
          {t.hero.description1}
          <br className="hidden sm:block" />
          {t.hero.description2}
        </motion.p>

        {/* Value Proposition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-6 mb-10 text-sm"
        >
          {[
            { icon: Hotel, text: t.hero.feature1 },
            { icon: Gift, text: t.hero.feature2 },
            { icon: MessageSquare, text: t.hero.feature3 },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-white/50">
              <item.icon className="w-4 h-4 text-emerald-400" />
              {item.text}
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <Link href={`/${locale}/auth/signup`}>
            <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-lg shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              {t.hero.cta1}
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>

          <a href="#how-it-works">
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors">
              {t.hero.cta2}
            </button>
          </a>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-8 max-w-md mx-auto"
        >
          {[
            { value: '8%', label: t.hero.stat1Label },
            { value: '4+', label: t.hero.stat2Label },
            { value: '$0', label: t.hero.stat3Label },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/30"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================
// How It Works Section
// ============================================
function HowItWorksSection({ t }: { t: typeof translations.ko }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const steps = [
    {
      step: '1',
      title: t.howItWorks.step1Title,
      description: t.howItWorks.step1Desc,
      icon: Hotel,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      step: '2',
      title: t.howItWorks.step2Title,
      description: t.howItWorks.step2Desc,
      icon: ExternalLink,
      color: 'from-purple-500 to-pink-500',
    },
    {
      step: '3',
      title: t.howItWorks.step3Title,
      description: t.howItWorks.step3Desc,
      icon: Gift,
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <span className="text-sm tracking-widest uppercase text-emerald-400 font-medium">
            {t.howItWorks.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
            {t.howItWorks.title}
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            {t.howItWorks.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="relative"
            >
              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-white/10 to-transparent" />
              )}

              <div className="text-center">
                {/* Step Number */}
                <div className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} p-[2px]`}>
                  <div className="w-full h-full rounded-2xl bg-[#0A0A0F] flex items-center justify-center">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="text-sm text-emerald-400 font-medium mb-2">Step {step.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// Effective Price Demo
// ============================================
function EffectivePriceDemo({ locale, t }: { locale: string; t: typeof translations.ko }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [selectedTier, setSelectedTier] = useState<'guest' | 'nomad'>('guest');

  const hotelPrice = 200;
  const commission = 16;
  const guestPrice = hotelPrice;
  const nomadPayback = commission;
  const nomadEffective = hotelPrice - nomadPayback;

  return (
    <section ref={ref} className="py-24 px-4 bg-[#12121A]/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <span className="text-sm tracking-widest uppercase text-emerald-400 font-medium">
            {t.priceDemo.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
            {t.priceDemo.title}
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            {t.priceDemo.subtitle}
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex p-1 bg-white/5 rounded-full">
            <button
              onClick={() => setSelectedTier('guest')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                selectedTier === 'guest'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.priceDemo.guestTab}
            </button>
            <button
              onClick={() => setSelectedTier('nomad')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                selectedTier === 'nomad'
                  ? 'bg-emerald-500 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {t.priceDemo.nomadTab}
            </button>
          </div>
        </motion.div>

        {/* Price Comparison Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto"
        >
          <div className={`p-6 rounded-2xl border transition-all duration-500 ${
            selectedTier === 'nomad'
              ? 'bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30'
              : 'bg-white/5 border-white/10'
          }`}>
            {/* Hotel Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-3xl">
                🏨
              </div>
              <div>
                <h3 className="font-bold text-white">{t.priceDemo.hotelName}</h3>
                <div className="flex items-center gap-1 text-sm text-white/50">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  4.8 · {t.priceDemo.hotelLocation}
                </div>
                <div className="text-xs text-white/40 mt-1">{t.priceDemo.viaAgoda}</div>
              </div>
            </div>

            <div className="h-px bg-white/10 mb-6" />

            {/* Pricing */}
            {selectedTier === 'guest' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">{t.priceDemo.hotelPrice}</span>
                  <span className="text-2xl font-bold text-white">${guestPrice}</span>
                </div>
                <div className="flex justify-between items-center text-white/40">
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    {t.priceDemo.memberPayback}
                  </span>
                  <span className="line-through">${commission}</span>
                </div>
                <div className="p-3 bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 rounded-lg">
                  <p className="text-sm text-[#FF4D4D]">
                    {t.priceDemo.guestMessage}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">{t.priceDemo.hotelPrice}</span>
                  <span className="text-lg text-white/40 line-through">${hotelPrice}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    {t.priceDemo.yourPayback}
                  </span>
                  <span className="font-bold">+${nomadPayback}</span>
                </div>
                <div className="h-px bg-emerald-500/20" />
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{t.priceDemo.effectivePrice}</span>
                  <span className="text-3xl font-bold text-emerald-400">${nomadEffective}</span>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-sm text-emerald-300">
                    {t.priceDemo.nomadMessage}
                  </p>
                </div>
              </div>
            )}

            {/* CTA */}
            <Link href={`/${locale}/auth/signup`}>
              <button className={`w-full mt-6 py-3 rounded-xl font-medium transition-colors ${
                selectedTier === 'nomad'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}>
                {selectedTier === 'nomad' ? t.priceDemo.becomeNomad : t.priceDemo.upgradeToSave}
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Savings Calculator Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="text-center text-white/40 text-sm mt-8"
        >
          {t.priceDemo.savingsHint}
        </motion.p>
      </div>
    </section>
  );
}

// ============================================
// Payback Tiers Section
// ============================================
function PaybackTiersSection({ locale, t }: { locale: string; t: typeof translations.ko }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const isKorean = locale === 'ko';

  return (
    <section ref={ref} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <span className="text-sm tracking-widest uppercase text-emerald-400 font-medium">
            {t.tiers.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
            {t.tiers.title1}
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {t.tiers.title2}
            </span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            {t.tiers.subtitle}
          </p>
        </motion.div>

        {/* Tiers Grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {TIERS.map((tier) => (
            <motion.div
              key={tier.id}
              variants={fadeInUp}
              className={`relative p-5 rounded-2xl border text-center transition-all hover:scale-105 ${
                tier.popular
                  ? 'bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full">
                    {t.tiers.best}
                  </span>
                </div>
              )}

              <div className={`text-3xl font-bold mb-1 ${tier.color}`}>
                {tier.rate}%
              </div>
              <div className="text-white font-medium mb-2">
                {isKorean ? tier.nameKo : tier.name}
              </div>
              <div className="text-xs text-white/40">
                {tier.price === 0 ? t.tiers.free : `$${tier.price}${t.tiers.mo}`}
              </div>

              {/* Visual Bar */}
              <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    tier.rate === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : tier.rate > 0
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                      : 'bg-white/10'
                  }`}
                  style={{ width: `${tier.rate}%` }}
                />
              </div>
              <div className="text-xs text-white/30 mt-2">
                {t.tiers.paybackRate}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">{t.tiers.howItWorksTitle}</h4>
              <p className="text-sm text-white/50">
                {t.tiers.howItWorksDesc}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// Partners Section
// ============================================
function PartnersSection({ t }: { t: typeof translations.ko }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 px-4 bg-[#12121A]/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <span className="text-sm tracking-widest uppercase text-emerald-400 font-medium">
            {t.partners.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
            {t.partners.title}
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            {t.partners.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {PARTNERS.map((partner) => (
            <motion.div
              key={partner.name}
              variants={fadeInUp}
              className={`p-6 rounded-2xl bg-gradient-to-br ${partner.color} text-center`}
            >
              <div className="text-4xl mb-3">{partner.logo}</div>
              <div className="font-bold text-white">{partner.name}</div>
              <div className="text-sm text-white/80 mt-1">{t.partners.upToPayback} {partner.commission}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-wrap justify-center gap-8"
        >
          {[
            { icon: Shield, text: t.partners.secureBooking },
            { icon: CreditCard, text: t.partners.noHiddenFees },
            { icon: Clock, text: t.partners.paybackIn48h },
            { icon: Users, text: t.partners.members },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-white/40 text-sm">
              <item.icon className="w-4 h-4" />
              {item.text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// AI Concierge Section
// ============================================
function AIConciergeSection({ locale, t }: { locale: string; t: typeof translations.ko }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={fadeInUp}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">{t.ai.badge}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t.ai.title1}
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {t.ai.title2}
              </span>
            </h2>

            <p className="text-white/50 mb-6">
              {t.ai.description}
            </p>

            <ul className="space-y-3 mb-8">
              {[
                t.ai.feature1,
                t.ai.feature2,
                t.ai.feature3,
                t.ai.feature4,
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-white/70 text-sm">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>

            <Link href={`/${locale}/dashboard/concierge`}>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
                {t.ai.tryButton}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>

          {/* Chat Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="bg-[#12121A] rounded-2xl border border-white/10 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">NOMAD AI</p>
                <p className="text-xs text-emerald-400">Online</p>
              </div>
            </div>

            <div className="p-4 space-y-4 h-64">
              <div className="flex justify-end">
                <div className="max-w-[80%] p-3 bg-blue-500/20 rounded-2xl rounded-tr-sm">
                  <p className="text-white/80 text-sm">{t.ai.chatQuestion}</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 bg-white/5 rounded-2xl rounded-tl-sm">
                  <p className="text-white/80 text-sm">
                    {t.ai.chatAnswer}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Pricing Section
// ============================================
function PricingSection({ locale, t }: { locale: string; t: typeof translations.ko }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const plans = [
    {
      id: 'explorer',
      name: t.pricing.explorerName,
      price: 9.99,
      paybackRate: 50,
      description: t.pricing.explorerDesc,
      features: [
        t.pricing.explorerF1,
        t.pricing.explorerF2,
        t.pricing.explorerF3,
        t.pricing.explorerF4,
      ],
      popular: false,
    },
    {
      id: 'nomad',
      name: t.pricing.nomadName,
      price: 29.99,
      paybackRate: 100,
      description: t.pricing.nomadDesc,
      features: [
        t.pricing.nomadF1,
        t.pricing.nomadF2,
        t.pricing.nomadF3,
        t.pricing.nomadF4,
        t.pricing.nomadF5,
      ],
      popular: true,
    },
    {
      id: 'business',
      name: t.pricing.businessName,
      price: 49.99,
      paybackRate: 100,
      description: t.pricing.businessDesc,
      features: [
        t.pricing.businessF1,
        t.pricing.businessF2,
        t.pricing.businessF3,
        t.pricing.businessF4,
        t.pricing.businessF5,
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" ref={ref} className="py-24 px-4 bg-[#12121A]/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <span className="text-sm tracking-widest uppercase text-emerald-400 font-medium">
            {t.pricing.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
            {t.pricing.title}
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            {t.pricing.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={fadeInUp}
              className={`relative p-6 rounded-2xl border ${
                plan.popular
                  ? 'bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                    {t.pricing.mostPopular}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <span className={`text-sm font-bold ${
                    plan.paybackRate === 100 ? 'text-emerald-400' : 'text-blue-400'
                  }`}>
                    {plan.paybackRate}% Payback
                  </span>
                </div>
                <p className="text-sm text-white/50">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">${plan.price}</span>
                <span className="text-white/50">/month</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={`/${locale}/auth/signup?plan=${plan.id}`}>
                <button className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  plan.popular
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}>
                  {t.pricing.getStarted}
                </button>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Free Tier Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-white/40 text-sm">
            {t.pricing.freeTierNote}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FAQ Section
// ============================================
function FAQSection({ t }: { t: typeof translations.ko }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
  ];

  return (
    <section id="faq" ref={ref} className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <span className="text-sm tracking-widest uppercase text-emerald-400 font-medium">
            {t.faq.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-4">
            {t.faq.title}
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={staggerContainer}
          className="space-y-4"
        >
          {faqs.map((faq, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              className="border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-5 flex items-center justify-between text-left bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="font-medium text-white">{faq.q}</span>
                {openIndex === idx ? (
                  <Minus className="w-5 h-5 text-white/50" />
                ) : (
                  <Plus className="w-5 h-5 text-white/50" />
                )}
              </button>
              {openIndex === idx && (
                <div className="p-5 pt-0 text-white/60 text-sm">
                  {faq.a}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// Final CTA Section
// ============================================
function FinalCTASection({ locale, t }: { locale: string; t: typeof translations.ko }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-full blur-[150px]" />
      </div>

      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={fadeInUp}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          {t.finalCta.title1}
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            {t.finalCta.title2}
          </span>
        </h2>

        <p className="text-xl text-white/50 mb-10 max-w-xl mx-auto">
          {t.finalCta.description}
        </p>

        <Link href={`/${locale}/auth/signup`}>
          <button className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-lg shadow-2xl shadow-emerald-500/20 flex items-center gap-2 mx-auto hover:opacity-90 transition-opacity">
            {t.finalCta.cta}
            <ArrowRight className="w-5 h-5" />
          </button>
        </Link>

        <p className="text-white/30 text-sm mt-6">
          {t.finalCta.note}
        </p>
      </motion.div>
    </section>
  );
}

// ============================================
// Footer
// ============================================
function Footer({ locale, t }: { locale: string; t: typeof translations.ko }) {
  return (
    <footer className="py-16 px-4 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">NOMAD</span>
            </div>
            <p className="text-sm text-white/40">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">{t.footer.product}</h4>
            <ul className="space-y-2">
              {[t.footer.howItWorks, t.footer.pricingLink, t.footer.partnersLink, t.footer.aiConcierge].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">{t.footer.company}</h4>
            <ul className="space-y-2">
              {[t.footer.about, t.footer.blog, t.footer.careers, t.footer.contact].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">{t.footer.legal}</h4>
            <ul className="space-y-2">
              {[
                { label: t.footer.privacy, path: 'privacy' },
                { label: t.footer.terms, path: 'terms' },
                { label: t.footer.cookies, path: 'cookies' },
              ].map((item) => (
                <li key={item.path}>
                  <Link href={`/${locale}/legal/${item.path}`} className="text-sm text-white/40 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">
            {t.footer.copyright}
          </p>
          <div className="flex items-center gap-4 text-sm text-white/30">
            <span>{t.footer.affiliate}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
