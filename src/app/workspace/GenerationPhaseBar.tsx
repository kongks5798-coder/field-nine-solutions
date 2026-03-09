"use client";

// Phase progress bar shown at bottom of preview pane during generation
// Shows: [설계] → [HTML] → [CSS] → [JS] → [검증] → [완료]

type Phase =
  | "idle"
  | "architect"
  | "building"
  | "html-done"
  | "css-done"
  | "js-done"
  | "critic"
  | "patching"
  | "done";

interface Props {
  streamingText: string; // Current streaming status text from AI store
}

export function GenerationPhaseBar({ streamingText }: Props) {
  // Parse current phase from streamingText
  const getPhase = (text: string): Phase => {
    if (!text) return "idle";
    if (text.includes("설계")) return "architect";
    if (text.includes("동시 생성")) return "building";
    if (text.includes("HTML 완성")) return "html-done";
    if (text.includes("CSS 완성")) return "css-done";
    if (text.includes("JS 완성")) return "js-done";
    if (text.includes("검증")) return "critic";
    if (text.includes("수정")) return "patching";
    if (text.includes("완료")) return "done";
    return "idle";
  };

  const phase = getPhase(streamingText);
  if (phase === "idle") return null; // Don't show when not generating

  const STEPS: { label: string; icon: string }[] = [
    { label: "설계", icon: "🎯" },
    { label: "HTML", icon: "🏗️" },
    { label: "CSS", icon: "🎨" },
    { label: "JS", icon: "⚙️" },
    { label: "검증", icon: "🔍" },
    { label: "완료", icon: "✅" },
  ];

  // Determine progress based on phase
  const phaseOrder: Phase[] = [
    "architect",
    "building",
    "html-done",
    "css-done",
    "js-done",
    "critic",
    "patching",
    "done",
  ];
  const currentIdx = phaseOrder.indexOf(phase);

  // Map steps to completion state
  const getStepState = (
    stepIdx: number,
  ): "done" | "active" | "pending" => {
    if (phase === "done") return "done";
    const stepPhaseMap: Phase[] = [
      "architect",
      "building",
      "html-done",
      "css-done",
      "critic",
      "done",
    ];
    const stepActivationPhase = stepPhaseMap[stepIdx];
    const activationIdx = phaseOrder.indexOf(stepActivationPhase);
    if (currentIdx > activationIdx) return "done";
    if (currentIdx === activationIdx) return "active";
    return "pending";
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(5, 5, 8, 0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(249, 115, 22, 0.2)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        zIndex: 50,
      }}
    >
      {/* Phase steps */}
      {STEPS.map((step, i) => {
        const state = getStepState(i);
        return (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            {/* Connector line */}
            {i > 0 && (
              <div
                style={{
                  width: 20,
                  height: 1,
                  background: state !== "pending" ? "#f97316" : "#334155",
                  transition: "background 0.3s ease",
                }}
              />
            )}
            {/* Step dot + label */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  background:
                    state === "done"
                      ? "#f97316"
                      : state === "active"
                        ? "rgba(249, 115, 22, 0.2)"
                        : "#1e293b",
                  border:
                    state === "active"
                      ? "2px solid #f97316"
                      : "2px solid transparent",
                  transition: "all 0.3s ease",
                  animation:
                    state === "active"
                      ? "gpb-pulse 1.5s ease-in-out infinite"
                      : "none",
                }}
              >
                {state === "done" ? "✓" : step.icon}
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: state === "pending" ? "#475569" : "#e2e8f0",
                  fontWeight: state === "active" ? 600 : 400,
                  transition: "color 0.3s",
                }}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Status text */}
      <div
        style={{
          marginLeft: "auto",
          fontSize: 12,
          color: "#94a3b8",
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {streamingText}
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes gpb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
