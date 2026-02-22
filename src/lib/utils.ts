/**
 * 공통 유틸리티 함수
 */

/** 한국어 날짜 포맷 */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

/** 한국어 날짜+시간 포맷 */
export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
}

/** 상대 시간 (예: "3분 전") */
export function formatRelativeTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min  = Math.floor(diff / 60000);
    const hour = Math.floor(diff / 3600000);
    const day  = Math.floor(diff / 86400000);
    if (min < 1)   return '방금 전';
    if (min < 60)  return `${min}분 전`;
    if (hour < 24) return `${hour}시간 전`;
    if (day < 7)   return `${day}일 전`;
    return formatDate(dateStr);
  } catch {
    return String(dateStr);
  }
}

/** 원화 포맷 (예: "₩39,000") */
export function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

/** 용량 포맷 (예: "1.5 MB") */
export function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 ** 2)   return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

/** 슬러그 생성 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}
