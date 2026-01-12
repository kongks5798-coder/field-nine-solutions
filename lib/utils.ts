import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn Utility - Tailwind 클래스 병합
 * 
 * 비즈니스 목적:
 * - 조건부 스타일링으로 컴포넌트 재사용성 향상
 * - Tailwind 클래스 충돌 해결
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
