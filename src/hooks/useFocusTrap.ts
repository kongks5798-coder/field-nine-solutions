"use client";
import { useEffect, useRef } from "react";

export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function getFocusableElements() {
      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
        .filter(el => !el.hasAttribute("disabled") && el.offsetParent !== null);
    }

    // 열릴 때 첫 번째 요소에 포커스
    const elements = getFocusableElements();
    if (elements.length > 0) elements[0].focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    // Escape로 닫기 지원
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        container.dispatchEvent(new CustomEvent("focustrap-escape"));
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("keydown", handleEscape);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("keydown", handleEscape);
    };
  }, [active]);

  return containerRef;
}
