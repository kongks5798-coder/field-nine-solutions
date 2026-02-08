'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 83: LEGAL COMPLIANCE FOOTER - TESLA MINIMALISM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Commercial-grade legal footer with:
 * - Terms of Service
 * - Privacy Policy
 * - Energy Asset Disclaimer
 * - Risk Disclosure
 * - Tesla/Musinsa minimal design aesthetic
 */

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LegalFooterProps {
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

// Legal modal content
const LEGAL_CONTENT = {
  terms: {
    title: 'Terms of Service',
    content: `
**Field Nine Solutions Terms of Service**

Last updated: January 2026

1. **Acceptance of Terms**
By accessing or using Field Nine's services, you agree to be bound by these terms.

2. **Service Description**
Field Nine provides energy asset tokenization, staking services, and digital asset management through the KAUS token ecosystem.

3. **User Responsibilities**
- You must be 18 years or older
- Provide accurate information
- Maintain security of your account
- Comply with applicable laws

4. **KAUS Token**
KAUS is a utility token for the Field Nine ecosystem. It is not a security or investment product. Token values may fluctuate.

5. **Energy Assets**
Energy asset representations are digital tokens backed by real-world energy production. Yields are subject to market conditions, weather patterns, and operational factors.

6. **Limitation of Liability**
Field Nine is not liable for any indirect, incidental, or consequential damages arising from use of our services.

7. **Governing Law**
These terms are governed by the laws of the Republic of Korea.

Contact: legal@fieldnine.io
    `.trim(),
  },
  privacy: {
    title: 'Privacy Policy',
    content: `
**Field Nine Privacy Policy**

Last updated: January 2026

1. **Information We Collect**
- Account information (email, name)
- Transaction data
- Device and usage data
- KYC verification documents

2. **How We Use Information**
- Provide and improve services
- Process transactions
- Comply with legal obligations
- Communicate updates

3. **Data Security**
We implement industry-standard encryption and security measures to protect your data.

4. **Data Sharing**
We do not sell your personal data. We may share data with:
- Service providers
- Legal authorities when required
- Blockchain networks (public transaction data)

5. **Your Rights**
You have the right to access, correct, or delete your personal data. Contact privacy@fieldnine.io.

6. **Cookies**
We use essential cookies for functionality and analytics cookies to improve our services.

7. **Contact**
Data Protection Officer: dpo@fieldnine.io
    `.trim(),
  },
  disclaimer: {
    title: 'Energy Asset Disclaimer',
    content: `
**Field Nine Energy Asset Disclaimer**

**IMPORTANT: Please read carefully before investing**

1. **Not Financial Advice**
Information provided on this platform is for informational purposes only and does not constitute financial, investment, or legal advice.

2. **Risk of Loss**
Digital assets, including KAUS tokens, are subject to high market risk. You may lose some or all of your investment.

3. **Energy Production Variability**
Actual energy production and yields depend on:
- Weather conditions
- Equipment performance
- Grid connectivity
- Market prices (SMP)
- Regulatory changes

4. **Past Performance**
Historical yield data and projections are not guarantees of future performance.

5. **Regulatory Uncertainty**
Cryptocurrency and digital asset regulations are evolving. Changes may affect token utility and value.

6. **Technical Risks**
Smart contracts and blockchain systems may contain bugs or vulnerabilities despite security audits.

7. **Liquidity Risk**
You may not be able to sell or exchange tokens at desired prices or times.

**By using Field Nine services, you acknowledge these risks and confirm that you can afford potential losses.**
    `.trim(),
  },
  risk: {
    title: 'Risk Disclosure',
    content: `
**Field Nine Risk Disclosure Statement**

Field Nine Services involve significant risks:

**Market Risk**: Token values fluctuate based on supply, demand, and market conditions.

**Operational Risk**: Energy production depends on weather, equipment, and grid conditions.

**Regulatory Risk**: Laws governing digital assets may change, potentially affecting your holdings.

**Technology Risk**: Blockchain networks and smart contracts may experience technical issues.

**Counterparty Risk**: Third-party service providers may fail to perform their obligations.

**Custody Risk**: Digital asset custody involves security considerations.

**This is not a complete list of risks. Only invest what you can afford to lose.**

For questions: risk@fieldnine.io
    `.trim(),
  },
};

// Modal component
const LegalModal = memo(function LegalModal({
  isOpen,
  onClose,
  type,
}: {
  isOpen: boolean;
  onClose: () => void;
  type: keyof typeof LEGAL_CONTENT;
}) {
  const content = LEGAL_CONTENT[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#171717] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">{content.title}</h2>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose prose-invert prose-sm max-w-none">
                {content.content.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <h3 key={i} className="text-white font-bold mt-4 mb-2">
                        {line.replace(/\*\*/g, '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <li key={i} className="text-white/70 text-sm ml-4">
                        {line.substring(2)}
                      </li>
                    );
                  }
                  if (line.match(/^\d+\./)) {
                    return (
                      <p key={i} className="text-white/70 text-sm mt-3">
                        {line}
                      </p>
                    );
                  }
                  return line ? (
                    <p key={i} className="text-white/70 text-sm">
                      {line}
                    </p>
                  ) : (
                    <br key={i} />
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10">
              <button
                onClick={onClose}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export function LegalFooter({ variant = 'full', className = '' }: LegalFooterProps) {
  const [modalOpen, setModalOpen] = useState<keyof typeof LEGAL_CONTENT | null>(null);

  const links = [
    { key: 'terms' as const, label: 'Terms of Service' },
    { key: 'privacy' as const, label: 'Privacy Policy' },
    { key: 'disclaimer' as const, label: 'Energy Disclaimer' },
    { key: 'risk' as const, label: 'Risk Disclosure' },
  ];

  if (variant === 'minimal') {
    return (
      <>
        <div className={`text-center text-xs text-white/30 py-4 ${className}`}>
          <span>&copy; 2026 Field Nine Solutions.</span>
          <span className="mx-2">|</span>
          <button
            onClick={() => setModalOpen('terms')}
            className="hover:text-white/50 transition-colors"
          >
            Terms
          </button>
          <span className="mx-2">|</span>
          <button
            onClick={() => setModalOpen('privacy')}
            className="hover:text-white/50 transition-colors"
          >
            Privacy
          </button>
        </div>
        <LegalModal
          isOpen={modalOpen !== null}
          onClose={() => setModalOpen(null)}
          type={modalOpen || 'terms'}
        />
      </>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <div className={`border-t border-white/5 py-6 ${className}`}>
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/30">
              &copy; 2026 Field Nine Solutions. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs text-white/40">
              {links.map((link) => (
                <button
                  key={link.key}
                  onClick={() => setModalOpen(link.key)}
                  className="hover:text-white/60 transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <LegalModal
          isOpen={modalOpen !== null}
          onClose={() => setModalOpen(null)}
          type={modalOpen || 'terms'}
        />
      </>
    );
  }

  // Full variant
  return (
    <>
      <footer className={`border-t border-white/5 bg-[#0a0a0a] ${className}`}>
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Top section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="text-2xl font-black text-white mb-2">
                FIELD<span className="text-[#00E5FF]">NINE</span>
              </div>
              <p className="text-sm text-white/50 max-w-md">
                Sovereign Energy Network. Tokenizing real-world energy assets
                for the next generation of sustainable investing.
              </p>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Legal</h4>
              <div className="space-y-2">
                {links.map((link) => (
                  <button
                    key={link.key}
                    onClick={() => setModalOpen(link.key)}
                    className="block text-sm text-white/40 hover:text-white/70 transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-white/40">
                <p>support@fieldnine.io</p>
                <p>Seoul, Republic of Korea</p>
              </div>
            </div>
          </div>

          {/* Disclaimer banner */}
          <div className="mb-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-400/80 leading-relaxed">
              <span className="font-bold">Risk Warning:</span> Digital assets involve
              significant risk. Past performance is not indicative of future results.
              Energy yields depend on weather, market conditions, and operational factors.
              Only invest what you can afford to lose. Not financial advice.
            </p>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
            <div className="text-xs text-white/30">
              &copy; 2026 Field Nine Solutions Co., Ltd. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs text-white/30">
              <span>KRX Registered</span>
              <span>|</span>
              <span>ISO 27001 Certified</span>
              <span>|</span>
              <span>SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </footer>
      <LegalModal
        isOpen={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        type={modalOpen || 'terms'}
      />
    </>
  );
}

export default LegalFooter;
