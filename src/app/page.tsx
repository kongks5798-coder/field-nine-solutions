"use client";
import React, { useState, useEffect, useRef } from "react";

export default function Home() {
  // 대시보드 상태 예시 (실전에서는 API 연동)
  const [stats, setStats] = useState({
    ai: 99.9,
    cowork: 24,
    files: 1024,
    admins: 3,
    errors: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // 채팅 상태
  const [chat, setChat] = useState<{user: string; text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  // 파일 업로드 상태
  const [uploadedFile, setUploadedFile] = useState<string>("");

  // 더미 API 연동 시뮬레이션
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setStats({ ai: 99.9, cowork: 24, files: 1024, admins: 3, errors: 0 });
      setLoading(false);
    }, 800);
  }, []);

  // 버튼 클릭 시 상태 변화 예시
  const handleAutoRun = (type: string) => {
    setLoading(true);
    setMessage("");
    setTimeout(() => {
      if (type === "ai") setMessage("AI 자동화가 성공적으로 실행되었습니다.");
      if (type === "cowork") setMessage("실시간 협업이 시작되었습니다.");
      if (type === "files") setMessage("클라우드 파일 관리가 활성화되었습니다.");
      setLoading(false);
    }, 1000);
  };

  // 채팅 메시지 전송
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChat([...chat, { user: "나", text: chatInput }]);
    setChatInput("");
    setTimeout(() => {
      setChat(c => [...c, { user: "AI", text: "자동 응답: " + Math.random().toString(36).slice(2, 8) }]);
    }, 800);
  };

  // 채팅 스크롤 하단 고정
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  // 파일 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0].name);
      setMessage(`파일 "${e.target.files[0].name}" 업로드 완료!`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(120deg, #181824 0%, #23243a 100%)', color: '#fff' }}>
      <header style={{ padding: '2rem 0', textAlign: 'center', borderBottom: '1px solid #222', fontWeight: 800, fontSize: '2rem', letterSpacing: 1 }}>
        Fieldnine Dashboard
      </header>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '3rem 0' }}>
        {/* 대시보드 핵심 카드 + 관리자/에러 위젯 */}
        <section style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
          <div style={{ background: 'rgba(30,32,60,0.95)', borderRadius: 16, padding: '2rem 2.5rem', minWidth: 220, boxShadow: '0 2px 12px #0002' }}>
            <div style={{ fontSize: 18, color: '#b3b3cc', marginBottom: 8 }}>AI 자동화</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{loading ? '...' : stats.ai + '%'}</div>
            <div style={{ fontSize: 14, color: '#6cf' }}>실시간 성공률</div>
          </div>
          <div style={{ background: 'rgba(30,32,60,0.95)', borderRadius: 16, padding: '2rem 2.5rem', minWidth: 220, boxShadow: '0 2px 12px #0002' }}>
            <div style={{ fontSize: 18, color: '#b3b3cc', marginBottom: 8 }}>실시간 협업</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{loading ? '...' : stats.cowork + '명'}</div>
            <div style={{ fontSize: 14, color: '#6cf' }}>동시 접속</div>
          </div>
          <div style={{ background: 'rgba(30,32,60,0.95)', borderRadius: 16, padding: '2rem 2.5rem', minWidth: 220, boxShadow: '0 2px 12px #0002' }}>
            <div style={{ fontSize: 18, color: '#b3b3cc', marginBottom: 8 }}>클라우드 파일</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{loading ? '...' : stats.files}</div>
            <div style={{ fontSize: 14, color: '#6cf' }}>관리 중</div>
          </div>
          <div style={{ background: 'rgba(30,32,60,0.95)', borderRadius: 16, padding: '2rem 2.5rem', minWidth: 180, boxShadow: '0 2px 12px #0002' }}>
            <div style={{ fontSize: 18, color: '#b3b3cc', marginBottom: 8 }}>관리자</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{loading ? '...' : stats.admins}</div>
            <div style={{ fontSize: 14, color: '#6cf' }}>활성 관리자</div>
          </div>
          <div style={{ background: 'rgba(60,32,32,0.95)', borderRadius: 16, padding: '2rem 2.5rem', minWidth: 180, boxShadow: '0 2px 12px #0002' }}>
            <div style={{ fontSize: 18, color: '#ffb3b3', marginBottom: 8 }}>에러</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#ff6c6c' }}>{loading ? '...' : stats.errors}</div>
            <div style={{ fontSize: 14, color: '#ffb3b3' }}>실시간 모니터링</div>
          </div>
        </section>
        {/* 자동 실행 버튼 + 파일 업로드 */}
        <section style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
          <button onClick={() => handleAutoRun('ai')} style={{ padding: '1rem 2rem', borderRadius: 8, background: '#007bff', color: '#fff', fontWeight: 600, border: 'none', fontSize: 16 }}>AI 자동 실행</button>
          <button onClick={() => handleAutoRun('cowork')} style={{ padding: '1rem 2rem', borderRadius: 8, background: '#6c63ff', color: '#fff', fontWeight: 600, border: 'none', fontSize: 16 }}>협업 시작</button>
          <button onClick={() => handleAutoRun('files')} style={{ padding: '1rem 2rem', borderRadius: 8, background: '#28a745', color: '#fff', fontWeight: 600, border: 'none', fontSize: 16 }}>클라우드 파일 관리</button>
          <label style={{ padding: '1rem 2rem', borderRadius: 8, background: '#222', color: '#fff', fontWeight: 600, border: 'none', fontSize: 16, cursor: 'pointer' }}>
            파일 업로드
            <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
        </section>
        {/* 실시간 프리뷰/보고서 링크 + 업로드 결과 */}
        <section style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>최종 자동화/테스트/배포 보고서</div>
          <a href="/DEPLOYMENT_FINAL_REPORT.md" target="_blank" rel="noopener" style={{ display: 'inline-block', margin: '0 12px', padding: '8px 16px', borderRadius: 8, background: '#007bff', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>배포 보고서 보기</a>
          <a href="/TEST_FINAL_REPORT.md" target="_blank" rel="noopener" style={{ display: 'inline-block', margin: '0 12px', padding: '8px 16px', borderRadius: 8, background: '#28a745', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>테스트 결과 보기</a>
          {uploadedFile && <div style={{ marginTop: 16, color: '#6cf', fontWeight: 600 }}>업로드: {uploadedFile}</div>}
        </section>
        {/* 실시간 채팅 예시 */}
        <section style={{ width: 420, margin: '0 auto 40px', background: 'rgba(30,32,60,0.95)', borderRadius: 16, boxShadow: '0 2px 12px #0002', padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#b3b3cc' }}>실시간 채팅</div>
          <div ref={chatRef} style={{ height: 120, overflowY: 'auto', background: '#181824', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15 }}>
            {chat.length === 0 && <div style={{ color: '#666' }}>채팅 내역 없음</div>}
            {chat.map((msg, i) => (
              <div key={i} style={{ marginBottom: 4 }}><span style={{ color: msg.user === '나' ? '#6cf' : '#fff' }}>{msg.user}:</span> {msg.text}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }} style={{ flex: 1, borderRadius: 8, border: '1px solid #333', padding: 8, fontSize: 15, background: '#23243a', color: '#fff' }} placeholder="메시지 입력..." />
            <button onClick={handleSendChat} style={{ borderRadius: 8, background: '#007bff', color: '#fff', fontWeight: 600, border: 'none', fontSize: 15, padding: '8px 16px' }}>전송</button>
          </div>
        </section>
        {/* 상태 메시지 */}
        {message && <div style={{ marginTop: 24, color: '#6cf', fontWeight: 600, fontSize: 18 }}>{message}</div>}
      </main>
      <footer style={{ textAlign: 'center', color: '#888', padding: '1.5rem 0', fontSize: '1rem', borderTop: '1px solid #222' }}>
        © 2026 Fieldnine. All rights reserved.
      </footer>
    </div>
  );
}