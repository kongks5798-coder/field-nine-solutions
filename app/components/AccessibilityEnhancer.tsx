'use client';

import { useEffect } from 'react';

/**
 * Tesla-style Accessibility Enhancer
 * 키보드 네비게이션, ARIA 레이블, 포커스 관리 개선
 */
export function AccessibilityEnhancer() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 키보드 네비게이션 개선
    const handleKeyboardNavigation = (e: KeyboardEvent) => {
      // Escape 키로 모달 닫기
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach((modal) => {
          const closeButton = modal.querySelector('[aria-label*="닫기"], [aria-label*="Close"]');
          if (closeButton && closeButton instanceof HTMLElement) {
            closeButton.click();
          }
        });
      }

      // Tab 키로 포커스 트랩 (모달 내)
      if (e.key === 'Tab') {
        const activeModal = document.querySelector('[role="dialog"]:not([hidden])');
        if (activeModal) {
          const focusableElements = activeModal.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // 스킵 링크 추가 (접근성)
    const addSkipLink = () => {
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.textContent = '메인 콘텐츠로 건너뛰기';
      skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-white focus:rounded-lg';
      skipLink.setAttribute('aria-label', '메인 콘텐츠로 건너뛰기');
      document.body.insertBefore(skipLink, document.body.firstChild);
    };

    // 포커스 표시 개선
    const enhanceFocusStyles = () => {
      const style = document.createElement('style');
      style.textContent = `
        *:focus-visible {
          outline: 2px solid #06B6D4;
          outline-offset: 2px;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        .focus\:not-sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: 0.5rem 1rem;
          margin: 0;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
      `;
      document.head.appendChild(style);
    };

    // ARIA 라이브 리전 추가 (동적 콘텐츠 알림)
    const addLiveRegion = () => {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    };

    // 초기화
    addSkipLink();
    enhanceFocusStyles();
    addLiveRegion();
    window.addEventListener('keydown', handleKeyboardNavigation);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyboardNavigation);
      const skipLink = document.querySelector('a[href="#main-content"]');
      if (skipLink) skipLink.remove();
      const liveRegion = document.getElementById('aria-live-region');
      if (liveRegion) liveRegion.remove();
    };
  }, []);

  return null;
}

/**
 * 접근성 유틸리티 함수
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const liveRegion = document.getElementById('aria-live-region');
  if (liveRegion) {
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    // 메시지 초기화 (다음 알림을 위해)
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}
