"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { fetchCollabSession } from "@/utils/collab";

export default function CollabViewerPage() {
  const params = useParams();
  const id = params.id as string;
  const [html, setHtml] = useState("");
  const [name, setName] = useState("불러오는 중...");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      const session = await fetchCollabSession(id);
      if (session) {
        setHtml(session.html);
        setName(session.name);
        setLastUpdate(new Date(session.ts));
        setError(false);
      } else {
        setError(true);
      }
    }
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: 48 }}>🔗</div>
      <h2>세션을 찾을 수 없습니다</h2>
      <p style={{ color: "#888" }}>링크가 만료되었거나 존재하지 않습니다</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0d1117" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", background: "#161b22", borderBottom: "1px solid #30363d", gap: 12 }}>
        <span style={{ fontSize: 20 }}>🔴</span>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{name}</span>
        <span style={{ fontSize: 11, color: "#6e7681", marginLeft: "auto" }}>
          {lastUpdate ? `마지막 업데이트: ${lastUpdate.toLocaleTimeString("ko-KR")}` : "연결 중..."}
        </span>
        <span style={{ fontSize: 11, color: "#3fb950", background: "#0d2818", padding: "2px 8px", borderRadius: 4 }}>● LIVE</span>
      </div>
      <iframe
        srcDoc={html || "<div style='display:flex;align-items:center;justify-content:center;height:100vh;color:#666;font-family:sans-serif'>연결 대기 중...</div>"}
        style={{ flex: 1, border: "none" }}
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
