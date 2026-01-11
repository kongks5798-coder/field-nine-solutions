'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg hover:scale-110 transition-transform"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-80 h-96 shadow-2xl border-2">
      <CardContent className="p-0 h-full flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">AI 어시스턴트</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 내용 */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">AI와 대화하기</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Google Gemini 또는 ChatGPT와 실시간으로 대화하세요.
            </p>
          </div>
          <Link href="/chat" className="w-full">
            <Button className="w-full">
              채팅 시작하기
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
