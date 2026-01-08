"use client";

import { useState, useEffect } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  animated?: boolean;
}

/**
 * Field Nine 전문 로고 컴포넌트
 * - 다크/라이트 모드 지원
 * - 애니메이션 효과
 * - 반응형 크기
 */
export default function Logo({ size = "md", className = "", animated = true }: LogoProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 다크 모드 감지 (향후 구현)
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);
  }, []);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  if (!mounted) {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="w-full h-full bg-[#1A5D3F]/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} ${animated ? "transition-transform hover:scale-110" : ""}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* 배경 원형 그라데이션 */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A5D3F" stopOpacity="1" />
            <stop offset="100%" stopColor="#0F4A2F" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="logoGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A5D3F" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0F4A2F" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* 외부 프레임 (더 세련된 디자인) */}
        <rect
          x="4"
          y="4"
          width="56"
          height="56"
          rx="12"
          stroke="url(#logoGradient)"
          strokeWidth="2.5"
          fill="none"
          className={animated ? "animate-pulse-slow" : ""}
        />

        {/* 내부 그리드 패턴 */}
        <g opacity="0.3">
          <line x1="20" y1="20" x2="44" y2="20" stroke="url(#logoGradient)" strokeWidth="1.5" />
          <line x1="20" y1="32" x2="44" y2="32" stroke="url(#logoGradient)" strokeWidth="1.5" />
          <line x1="20" y1="44" x2="44" y2="44" stroke="url(#logoGradient)" strokeWidth="1.5" />
          <line x1="20" y1="20" x2="20" y2="44" stroke="url(#logoGradient)" strokeWidth="1.5" />
          <line x1="32" y1="20" x2="32" y2="44" stroke="url(#logoGradient)" strokeWidth="1.5" />
          <line x1="44" y1="20" x2="44" y2="44" stroke="url(#logoGradient)" strokeWidth="1.5" />
        </g>

        {/* 중앙 포커스 포인트 (더 세련된 디자인) */}
        <circle
          cx="32"
          cy="32"
          r="8"
          fill="url(#logoGradient)"
          className={animated ? "animate-pulse" : ""}
        />
        <circle
          cx="32"
          cy="32"
          r="4"
          fill="white"
          opacity="0.9"
        />

        {/* 상단 악센트 (선택적) */}
        <path
          d="M 32 12 L 36 20 L 28 20 Z"
          fill="url(#logoGradient)"
          opacity="0.6"
          className={animated ? "transition-opacity hover:opacity-100" : ""}
        />
      </svg>
    </div>
  );
}
