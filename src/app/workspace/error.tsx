"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ErrorKind = "network" | "auth" | "storage" | "generic";

function classifyError(error: Error): ErrorKind {
  const msg = (error.message || "").toLowerCase();
  const name = (error.name || "").toLowerCase();

  // 네트워크 에러
  if (
    name === "typeerror" && msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("net::") ||
    msg.includes("timeout") ||
    msg.includes("aborted") ||
    msg.includes("cors") ||
    msg.includes("연결")
  ) return "network";

  // 인증 에러
  if (
    msg.includes("unauthorized") ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("forbidden") ||
    msg.includes("auth") ||
    msg.includes("session") ||
    msg.includes("token") ||
    msg.includes("인증") ||
    msg.includes("로그인")
  ) return "auth";

  // 스토리지 에러 (localStorage, quota 등)
  if (
    msg.includes("quota") ||
    msg.includes("storage") ||
    msg.includes("localstorage") ||
    msg.includes("저장")
  ) return "storage";

  return "generic";
}

const ERROR_INFO: Record<ErrorKind, {
  icon: string;
  title: string;
  description: string;
  primaryAction: { label: string; type: "reset" | "login" | "clear" };
  secondaryLabel?: string;
}> = {
  network: {
    icon: "\uD83C\uDF10", // Globe emoji
    title: "네트워크 연결 문제",
    description: "서버에 연결할 수 없습니다. 인터넷 연결을 확인한 후 다시 시도해주세요. Wi-Fi 또는 모바일 데이터가 활성화되어 있는지 확인해주세요.",
    primaryAction: { label: "다시 시도", type: "reset" },
    secondaryLabel: "오프라인에서 계속 작업",
  },
  auth: {
    icon: "\uD83D\uDD12", // Lock emoji
    title: "인증이 필요합니다",
    description: "로그인 세션이 만료되었거나 접근 권한이 없습니다. 다시 로그인해주세요.",
    primaryAction: { label: "로그인", type: "login" },
  },
  storage: {
    icon: "\uD83D\uDCBE", // Floppy disk emoji
    title: "저장 공간 문제",
    description: "브라우저 저장 공간이 부족하거나 접근이 제한되어 있습니다. 캐시를 정리한 후 다시 시도해주세요.",
    primaryAction: { label: "캐시 정리 후 재시도", type: "clear" },
  },
  generic: {
    icon: "\u26A0\uFE0F", // Warning emoji
    title: "워크스페이스에서 오류가 발생했습니다",
    description: "워크스페이스를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    primaryAction: { label: "다시 시도", type: "reset" },
  },
};

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [kind, setKind] = useState<ErrorKind>("generic");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    console.error("[Dalkak Workspace Error]", error);
    setKind(classifyError(error));

    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => {
        setIsOnline(false);
        setKind("network");
      };
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [error]);

  const info = ERROR_INFO[kind];

  const handlePrimary = () => {
    switch (info.primaryAction.type) {
      case "reset":
        reset();
        break;
      case "login":
        if (typeof window !== "undefined") {
          window.location.href = `/login?next=${encodeURIComponent("/workspace")}`;
        }
        break;
      case "clear":
        if (typeof window !== "undefined") {
          try {
            // 워크스페이스 관련 캐시만 정리
            const keysToPreserve = ["fn_user"];
            const allKeys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && !keysToPreserve.includes(key)) allKeys.push(key);
            }
            allKeys.forEach((k) => localStorage.removeItem(k));
          } catch { /* 무시 */ }
          reset();
        }
        break;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#07080f",
      fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
      padding: "24px",
      textAlign: "center",
    }}>
      {/* Logo */}
      <a href="/dashboard" style={{ textDecoration: "none", marginBottom: 40 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 20, color: "#fff",
          margin: "0 auto",
        }}>D</div>
      </a>

      {/* 에러 아이콘 */}
      <div style={{ fontSize: 64, marginBottom: 16 }}>{info.icon}</div>

      {/* 온라인 상태 표시 */}
      {!isOnline && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          borderRadius: 20,
          background: "rgba(239,68,68,0.15)",
          color: "#ef4444",
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 16,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#ef4444",
          }} />
          오프라인
        </div>
      )}

      <h1 style={{
        fontSize: 26, fontWeight: 800, color: "#e8eaf0",
        marginBottom: 12, marginTop: 0,
      }}>
        {info.title}
      </h1>

      <p style={{
        fontSize: 15, color: "#6b7280",
        marginBottom: 8, maxWidth: 440, lineHeight: 1.7,
      }}>
        {info.description}
      </p>

      {error.digest && (
        <p style={{ fontSize: 12, color: "#4b5563", marginBottom: 32 }}>
          오류 코드: {error.digest}
        </p>
      )}

      {/* 액션 버튼 */}
      <div style={{
        display: "flex", gap: 12, flexWrap: "wrap",
        justifyContent: "center", marginTop: 16,
      }}>
        <button
          onClick={handlePrimary}
          style={{
            padding: "12px 28px", borderRadius: 10, border: "none",
            background: kind === "auth"
              ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
              : "linear-gradient(135deg, #f97316 0%, #f43f5e 100%)",
            color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: "pointer",
            boxShadow: kind === "auth"
              ? "0 4px 14px rgba(59,130,246,0.3)"
              : "0 4px 14px rgba(249,115,22,0.3)",
          }}
        >
          {info.primaryAction.label}
        </button>

        <a href="/dashboard" style={{
          padding: "12px 28px", borderRadius: 10, textDecoration: "none",
          border: "1.5px solid #23263a",
          background: "#12141e", color: "#e8eaf0", fontSize: 15, fontWeight: 600,
          display: "inline-flex", alignItems: "center",
        }}>
          대시보드로
        </a>
      </div>

      {/* 네트워크 에러 시 추가 안내 */}
      {kind === "network" && (
        <div style={{
          marginTop: 40,
          padding: "16px 24px",
          borderRadius: 12,
          background: "#12141e",
          border: "1px solid #23263a",
          maxWidth: 400,
          textAlign: "left",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", marginBottom: 10 }}>
            문제 해결 방법
          </div>
          <ul style={{
            margin: 0, padding: "0 0 0 18px",
            fontSize: 13, color: "#6b7280", lineHeight: 1.8,
          }}>
            <li>Wi-Fi 또는 모바일 데이터 연결 확인</li>
            <li>VPN을 사용 중이라면 비활성화 후 재시도</li>
            <li>브라우저 새로고침 (Ctrl+R / Cmd+R)</li>
            <li>문제가 지속되면 <a href="/status" style={{ color: "#f97316", textDecoration: "none" }}>시스템 상태 페이지</a> 확인</li>
          </ul>
        </div>
      )}

      {/* 인증 에러 시 추가 안내 */}
      {kind === "auth" && (
        <div style={{
          marginTop: 40,
          padding: "16px 24px",
          borderRadius: 12,
          background: "#12141e",
          border: "1px solid #23263a",
          maxWidth: 400,
          textAlign: "left",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", marginBottom: 10 }}>
            참고
          </div>
          <ul style={{
            margin: 0, padding: "0 0 0 18px",
            fontSize: 13, color: "#6b7280", lineHeight: 1.8,
          }}>
            <li>로그인 세션은 보안을 위해 일정 시간 후 만료됩니다</li>
            <li>로그인 후 작업 중이던 프로젝트로 자동 복귀됩니다</li>
            <li>비밀번호를 잊으셨나요? <a href="/auth/forgot-password" style={{ color: "#f97316", textDecoration: "none" }}>비밀번호 재설정</a></li>
          </ul>
        </div>
      )}

      {/* 스토리지 에러 시 추가 안내 */}
      {kind === "storage" && (
        <div style={{
          marginTop: 40,
          padding: "16px 24px",
          borderRadius: 12,
          background: "#12141e",
          border: "1px solid #23263a",
          maxWidth: 400,
          textAlign: "left",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", marginBottom: 10 }}>
            문제 해결 방법
          </div>
          <ul style={{
            margin: 0, padding: "0 0 0 18px",
            fontSize: 13, color: "#6b7280", lineHeight: 1.8,
          }}>
            <li>브라우저 설정에서 사이트 데이터 삭제</li>
            <li>시크릿 모드에서는 저장 공간이 제한됩니다</li>
            <li>다른 브라우저에서 시도해보세요</li>
          </ul>
        </div>
      )}
    </div>
  );
}
