"use client";
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show if not already installed and not dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'dismissed') localStorage.setItem('pwa-install-dismissed', '1');
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: '#161b22', border: '1px solid rgba(249,115,22,0.3)',
      borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center',
      gap: 12, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      maxWidth: 340, width: 'calc(100vw - 40px)',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚡</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>딸깍 설치하기</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>홈화면에 추가하면 더 빠르게</div>
      </div>
      <button onClick={install} style={{ padding: '6px 12px', borderRadius: 8, background: 'linear-gradient(135deg,#f97316,#f43f5e)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>설치</button>
      <button onClick={dismiss} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 16, cursor: 'pointer', padding: 4, flexShrink: 0 }}>×</button>
    </div>
  );
}
