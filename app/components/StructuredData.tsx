'use client';

import { useEffect } from 'react';

/**
 * Tesla-style Structured Data for SEO
 * JSON-LD 스키마 마크업으로 검색 엔진 최적화
 */
export function StructuredData() {
  useEffect(() => {
    // Organization Schema
    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Field Nine',
      url: 'https://fieldnine.io',
      logo: 'https://fieldnine.io/icon-512.png',
      description: 'AI로 비즈니스를 혁신하는 상용 SaaS 솔루션',
      sameAs: [
        // 소셜 미디어 링크 (추가 시)
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'contact@fieldnine.io',
      },
    };

    // SoftwareApplication Schema
    const softwareSchema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Field Nine Solutions',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KRW',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '127',
      },
      description: 'RTX 5090 로컬 AI와 완벽한 자동화로 재고, 주문, 수익을 실시간으로 관리하고 최적화합니다.',
    };

    // WebSite Schema
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Field Nine',
      url: 'https://fieldnine.io',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://fieldnine.io/search?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    };

    // BreadcrumbList Schema (동적 생성 가능)
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://fieldnine.io',
        },
      ],
    };

    // 스키마 추가
    const addSchema = (schema: object) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      script.id = `schema-${Date.now()}-${Math.random()}`;
      document.head.appendChild(script);
    };

    // 모든 스키마 추가
    addSchema(organizationSchema);
    addSchema(softwareSchema);
    addSchema(websiteSchema);
    addSchema(breadcrumbSchema);

    // Cleanup
    return () => {
      document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
        if (script.id?.startsWith('schema-')) {
          script.remove();
        }
      });
    };
  }, []);

  return null;
}
