'use client';

import { useState, KeyboardEvent } from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface ChatBoxProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

export default function ChatBox({ onSubmit, isLoading = false }: ChatBoxProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-ivory-bg rounded-full p-2">
          <MessageSquare className="w-5 h-5 text-tesla-black" />
        </div>
        <h2 className="text-xl font-bold text-tesla-black">AI에게 물어보기</h2>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="오늘 뭐 사줄까? 또는 내 일정 정리해줘"
          className="flex-1 p-4 rounded-full border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-tesla-black focus:border-transparent text-base"
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
          className="bg-tesla-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>처리 중...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>보내기</span>
            </>
          )}
        </button>
      </div>

      <p className="text-sm text-gray-500 mt-3 text-center">
        💡 예시: "운동화 추천해줘", "오늘 일정 정리해줘", "이번 주 쇼핑 리스트 만들어줘"
      </p>
    </div>
  );
}
