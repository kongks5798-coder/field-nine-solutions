"use client";
import { useEffect } from "react";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"50vh",gap:16,padding:32 }}>
      <h2 style={{ fontSize:20,fontWeight:600 }}>오류가 발생했습니다</h2>
      <p style={{ color:"#888",fontSize:14 }}>{error.message || "알 수 없는 오류"}</p>
      <button onClick={reset} style={{ padding:"8px 20px",borderRadius:8,border:"1px solid #333",background:"#111",color:"#fff",cursor:"pointer" }}>
        다시 시도
      </button>
    </div>
  );
}
