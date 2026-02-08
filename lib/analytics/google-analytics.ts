/**
 * K-Universal Google Analytics 4 Integration
 * Real-time user tracking and behavior analytics
 */

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Track events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Predefined events for K-Universal
export const trackKYCStart = () => {
  event({
    action: 'kyc_start',
    category: 'identity',
    label: 'User started KYC flow',
  });
};

export const trackKYCComplete = (duration: number) => {
  event({
    action: 'kyc_complete',
    category: 'identity',
    label: 'User completed KYC',
    value: duration, // in seconds
  });
};

export const trackPassportScan = (success: boolean) => {
  event({
    action: 'passport_scan',
    category: 'ocr',
    label: success ? 'Scan successful' : 'Scan failed',
    value: success ? 1 : 0,
  });
};

export const trackWalletActivation = () => {
  event({
    action: 'wallet_activation',
    category: 'wallet',
    label: 'Ghost Wallet activated',
  });
};

export const trackWalletTopup = (amount: number) => {
  event({
    action: 'wallet_topup',
    category: 'wallet',
    label: 'User topped up wallet',
    value: amount,
  });
};

export const trackServiceUsage = (service: 'taxi' | 'delivery' | 'restaurants') => {
  event({
    action: 'service_usage',
    category: 'lifestyle',
    label: `User used ${service} service`,
  });
};

export const trackSignup = (method: 'email' | 'google' | 'kakao') => {
  event({
    action: 'sign_up',
    category: 'user',
    label: `Signup via ${method}`,
  });
};

export const trackDemoComplete = (step: number) => {
  event({
    action: 'demo_complete',
    category: 'engagement',
    label: `Demo completed to step ${step}`,
    value: step,
  });
};

// TypeScript declaration
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}
