"use client";
import { useState, useEffect } from "react";

interface ReferralData {
  code: string;
  referralUrl: string;
  successCount: number;
  bonusPerReferral: number;
}

export function ReferralWidget() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then(r => r.ok ? r.json() : null)
      .then((d: ReferralData | null) => d && setData(d))
      .catch(() => {});
  }, []);

  const copy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!data) return null;

  return (
    <div style={{ background: "linear-gradient(135deg,#0d2818,#0d1117)", border: "1px solid #238636", borderRadius: 12, padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>🎁</span>
        <div>
          <div style={{ color: "#3fb950", fontWeight: 700, fontSize: 15 }}>친구 초대하고 토큰 받기</div>
          <div style={{ color: "#8b949e", fontSize: 12 }}>친구가 가입하면 둘 다 {data.bonusPerReferral.toLocaleString()} 토큰!</div>
        </div>
        {data.successCount > 0 && (
          <div style={{ marginLeft: "auto", background: "#238636", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 12 }}>
            {data.successCount}명 초대 성공
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{
          flex: 1,
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 13,
          color: "#8b949e",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap" as const,
        }}>
          {data.referralUrl}
        </div>
        <button
          onClick={copy}
          style={{
            background: copied ? "#238636" : "#21262d",
            color: "#fff",
            border: "1px solid #30363d",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: "nowrap" as const,
          }}
        >
          {copied ? "✅ 복사됨" : "링크 복사"}
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#6e7681" }}>
        코드: <span style={{ color: "#e6edf3", fontWeight: 700, letterSpacing: 2 }}>{data.code}</span>
        &nbsp;·&nbsp;친구에게 /signup?ref={data.code} 공유
      </div>
    </div>
  );
}
