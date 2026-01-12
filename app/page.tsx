import { redirect } from 'next/navigation';

export default function HomePage() {
  // 메인 페이지에서 차익거래 페이지로 자동 리다이렉트
  redirect('/arbitrage');
}
