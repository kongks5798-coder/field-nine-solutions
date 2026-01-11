'use client';

import ChatInterface from '@/components/ai/ChatInterface';
import { Brain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-foreground">Field Nine</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                홈으로
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 채팅 영역 */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full h-[calc(100vh-8rem)] max-w-5xl">
          <ChatInterface />
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-xs text-muted-foreground">
            Field Nine AI 어시스턴트는 Google Gemini와 OpenAI ChatGPT를 지원합니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
