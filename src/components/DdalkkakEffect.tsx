"use client";

import { useEffect, useRef, useState } from "react";

interface FloatItem {
  id: number;
  x: number;
  y: number;
  text: string;
  mega: boolean;
}

// ── Web Audio 딸깍 소리 합성 ────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
function playDdalkkak(mega = false) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (mega) {
      // 더블클릭: 화려한 딸깍딸깍
      osc.type = "square";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      // 일반 클릭: 단순 딸깍
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    }
  } catch {
    // AudioContext 차단 환경 무시
  }
}

// ── 텍스트 변형 테이블 ──────────────────────────────────────────────────────
const TEXTS = ["딸깍", "딸깍!", "딸~깍", "딸깍?", "딸깍~", "딸깍."];
const MILESTONES: Record<number, string> = {
  10:  "10번 딸깍! 🎯",
  30:  "30번 딸깍! 🔥",
  50:  "딸깍 고수! 💪",
  100: "딸깍 마스터! 🏆",
  200: "딸깍의 신! 🌟",
  500: "딸깍 레전드! 👑",
};

export default function DdalkkakEffect() {
  const [floats, setFloats]       = useState<FloatItem[]>([]);
  const [count, setCount]         = useState(0);
  const [showBadge, setShowBadge] = useState(false);
  const [party, setParty]         = useState(false);

  const countRef     = useRef(0);
  const idRef        = useRef(0);
  const lastRef      = useRef({ t: 0, x: 0, y: 0 });

  // 플로팅 텍스트 추가 헬퍼
  const spawn = (x: number, y: number, text: string, mega = false) => {
    const id = ++idRef.current;
    setFloats(prev => [...prev, { id, x, y, text, mega }]);
    setTimeout(
      () => setFloats(prev => prev.filter(f => f.id !== id)),
      mega ? 1300 : 750,
    );
  };

  // ── 전역 클릭 리스너 ──────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const now = Date.now();
      const prev = lastRef.current;

      // 더블클릭 감지: 300ms 내 같은 위치(±25px)
      const isDouble =
        now - prev.t < 300 &&
        Math.abs(e.clientX - prev.x) < 25 &&
        Math.abs(e.clientY - prev.y) < 25;

      lastRef.current = { t: now, x: e.clientX, y: e.clientY };

      if (isDouble) {
        // ── 기능 3: 더블클릭 MEGA 딸깍 ──────────────────────────────
        playDdalkkak(true);
        spawn(e.clientX, e.clientY - 20, "딸깍딸깍!!", true);
        const emojis = ["💥", "⚡", "✨", "🔥", "😱"];
        emojis.forEach((em, i) => {
          setTimeout(() => {
            spawn(
              e.clientX + (Math.random() - 0.5) * 130,
              e.clientY + (Math.random() - 0.5) * 90,
              em,
              false,
            );
          }, i * 70);
        });
        return;
      }

      // ── 기능 1 + 2: 일반 클릭 플로팅 텍스트 + 효과음 ──────────────
      playDdalkkak(false);

      countRef.current += 1;
      const c = countRef.current;
      setCount(c);
      setShowBadge(true);

      const label = MILESTONES[c] ?? TEXTS[Math.floor(Math.random() * TEXTS.length)];
      spawn(e.clientX, e.clientY - 8, label);
    };

    window.addEventListener("click", handle);
    return () => window.removeEventListener("click", handle);
  }, []);

  // ── 기능 4: 마일스톤 파티 ────────────────────────────────────────────────
  useEffect(() => {
    if (MILESTONES[count]) {
      setParty(true);
      setTimeout(() => setParty(false), 2200);
    }
  }, [count]);

  return (
    <>
      {/* ── 플로팅 텍스트들 ──────────────────────────────────────── */}
      {floats.map(f => (
        <div
          key={f.id}
          style={{
            position:      "fixed",
            left:          f.x,
            top:           f.y,
            transform:     "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex:        99999,
            fontWeight:    f.mega ? 900 : 700,
            fontSize:      f.mega ? 30 : 13,
            color:         f.mega ? "#f97316" : "#f43f5e",
            textShadow:    f.mega ? "0 0 24px rgba(249,115,22,0.9)" : "none",
            whiteSpace:    "nowrap",
            fontFamily:    '"Pretendard", Inter, sans-serif',
            animation:     f.mega ? "fn-mega 1.3s ease-out forwards" : "fn-float 0.75s ease-out forwards",
          }}
        >
          {f.text}
        </div>
      ))}

      {/* ── 딸깍 카운터 뱃지 ─────────────────────────────────────── */}
      {showBadge && (
        <button
          onClick={() => setShowBadge(false)}
          title="닫기"
          style={{
            position:       "fixed",
            bottom:         24,
            right:          24,
            zIndex:         9999,
            background:     "rgba(10,10,20,0.88)",
            color:          "#f97316",
            border:         party
              ? "1px solid #f97316"
              : "1px solid rgba(249,115,22,0.25)",
            borderRadius:   14,
            padding:        "7px 14px",
            fontSize:       13,
            fontWeight:     700,
            fontFamily:     '"Pretendard", Inter, sans-serif',
            backdropFilter: "blur(10px)",
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            gap:            6,
            boxShadow:      party
              ? "0 0 30px rgba(249,115,22,0.6)"
              : "0 4px 14px rgba(0,0,0,0.35)",
            transition:     "box-shadow 0.3s",
            animation:      party ? "fn-bounce 0.4s ease" : "none",
          }}
        >
          <span style={{ fontSize: 15 }}>🖱️</span>
          <span>딸깍이 {count.toLocaleString()}번</span>
          {count >= 100 && <span>🏆</span>}
        </button>
      )}

      {/* ── 파티 오버레이 ─────────────────────────────────────────── */}
      {party && (
        <div
          style={{
            position:      "fixed",
            inset:         0,
            zIndex:        99998,
            pointerEvents: "none",
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            animation:     "fn-party-bg 2.2s ease-out forwards",
          }}
        >
          <div style={{
            fontSize:   52,
            fontWeight: 900,
            color:      "#f97316",
            textAlign:  "center",
            lineHeight: 1.3,
            fontFamily: '"Pretendard", Inter, sans-serif',
            textShadow: "0 0 60px rgba(249,115,22,1), 0 0 120px rgba(244,63,94,0.6)",
            animation:  "fn-party-text 2.2s ease-out forwards",
          }}>
            🎉 딸깍 {count}회!
            <br />
            <span style={{ fontSize: 26 }}>{MILESTONES[count]}</span>
          </div>
        </div>
      )}

      {/* ── 글로벌 애니메이션 ─────────────────────────────────────── */}
      <style>{`
        @keyframes fn-float {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(1.15); }
          100% { opacity: 0; transform: translate(-50%, calc(-50% - 52px)) scale(0.85); }
        }
        @keyframes fn-mega {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(1.6) rotate(-3deg); }
          40%  { opacity: 1; transform: translate(-50%, calc(-50% - 28px)) scale(1.1) rotate(2deg); }
          100% { opacity: 0; transform: translate(-50%, calc(-50% - 85px)) scale(0.7); }
        }
        @keyframes fn-bounce {
          0%,100% { transform: scale(1); }
          40%     { transform: scale(1.18); }
          70%     { transform: scale(0.95); }
        }
        @keyframes fn-party-bg {
          0%   { opacity: 0; background: rgba(249,115,22,0.08); }
          15%  { opacity: 1; background: rgba(249,115,22,0.15); }
          80%  { opacity: 1; background: rgba(249,115,22,0.05); }
          100% { opacity: 0; background: transparent; }
        }
        @keyframes fn-party-text {
          0%   { opacity: 0; transform: scale(0.3) rotate(-8deg); }
          25%  { opacity: 1; transform: scale(1.25) rotate(3deg); }
          55%  { opacity: 1; transform: scale(1) rotate(0deg); }
          100% { opacity: 0; transform: scale(0.85) rotate(0deg); }
        }
      `}</style>
    </>
  );
}
