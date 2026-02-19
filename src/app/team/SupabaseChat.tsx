"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/utils/supabase/client";

type Message = { id: number; user: string; text: string; created_at: string };

export default function SupabaseChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [user] = useState("나");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload: unknown) => {
        fetchMessages();
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  async function fetchMessages() {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function sendMessage() {
    if (!input.trim()) return;
    await supabase.from('messages').insert([{ user, text: input }]);
    setInput("");
  }

  return (
    <div className="w-full mt-6">
      <h2 className="text-base font-semibold mb-2 text-pink-700 dark:text-pink-200">실시간 채팅 (Supabase)</h2>
      <div className="bg-pink-50 dark:bg-pink-900 rounded-lg p-4 h-48 overflow-y-auto mb-2 flex flex-col gap-2">
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className="text-sm">
            <span className="font-bold mr-2">{msg.user}:</span>
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border border-pink-200 dark:border-pink-800 px-2 py-1 text-sm bg-white dark:bg-gray-800"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="메시지 입력..."
        />
        <button onClick={sendMessage} className="bg-pink-600 hover:bg-pink-700 text-white rounded px-3 py-1 text-sm">전송</button>
      </div>
      <div className="mt-2 text-xs text-gray-400">Supabase Realtime 연동. DB에 messages 테이블 필요.</div>
    </div>
  );
}
