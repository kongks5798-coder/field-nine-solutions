"use client";

import React, { useState, useCallback } from "react";
import { T } from "./workspace.constants";
import { useAutonomousStore } from "./stores";
import type { TaskStep } from "./stores/useAutonomousStore";

const STATUS_COLORS: Record<string, string> = {
  pending: T.muted,
  running: T.accent,
  awaiting_approval: "#fbbf24",
  completed: T.green,
  failed: T.red,
  skipped: T.muted,
  rolled_back: T.warn,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  running: "실행 중",
  awaiting_approval: "승인 대기",
  completed: "완료",
  failed: "실패",
  skipped: "건너뜀",
  rolled_back: "롤백됨",
};

const STATE_LABELS: Record<string, string> = {
  idle: "대기",
  decomposing: "태스크 분해 중...",
  executing_step: "단계 실행 중",
  validating: "검증 중...",
  self_healing: "자동 수정 중...",
  awaiting_approval: "승인 대기",
  completing_step: "단계 완료 처리 중",
  rolling_back: "롤백 중...",
  completed: "완료!",
  failed: "실패",
  cancelled: "취소됨",
};

interface Props {
  onSendAi: (prompt: string) => void;
}

export function AutonomousPanel({ onSendAi }: Props) {
  const [taskInput, setTaskInput] = useState("");
  const currentTask = useAutonomousStore((s) => s.currentTask);
  const approvalMode = useAutonomousStore((s) => s.approvalMode);
  const ctx = useAutonomousStore((s) => s.ctx);
  const isAutonomousMode = useAutonomousStore((s) => s.isAutonomousMode);

  const setApprovalMode = useAutonomousStore((s) => s.setApprovalMode);
  const startTask = useAutonomousStore((s) => s.startTask);
  const cancelTask = useAutonomousStore((s) => s.cancelTask);
  const approveStep = useAutonomousStore((s) => s.approveStep);
  const rejectStep = useAutonomousStore((s) => s.rejectStep);
  const rollbackAll = useAutonomousStore((s) => s.rollbackAll);
  const reset = useAutonomousStore((s) => s.reset);

  const handleStart = useCallback(() => {
    if (!taskInput.trim()) return;
    startTask(taskInput.trim());
    onSendAi(taskInput.trim());
    setTaskInput("");
  }, [taskInput, startTask, onSendAi]);

  const isRunning =
    ctx.state === "decomposing" ||
    ctx.state === "executing_step" ||
    ctx.state === "validating" ||
    ctx.state === "self_healing" ||
    ctx.state === "completing_step";

  const isDone = ctx.state === "completed" || ctx.state === "failed" || ctx.state === "cancelled";

  if (!isAutonomousMode) return null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: T.topbar,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>⚡</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>자율 에이전트</span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 4,
            background: isRunning ? `${T.accent}15` : isDone ? `${T.green}15` : "transparent",
            color: isRunning ? T.accent : isDone ? T.green : T.muted,
            border: `1px solid ${isRunning ? `${T.accent}30` : isDone ? `${T.green}30` : T.border}`,
          }}
        >
          {STATE_LABELS[ctx.state] ?? ctx.state}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {/* Approval mode */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 6 }}>
            승인 모드
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {([
              ["auto", "자동"],
              ["step", "단계별"],
              ["plan_only", "계획만"],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setApprovalMode(mode)}
                disabled={isRunning}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: `1px solid ${approvalMode === mode ? T.accent : T.border}`,
                  background: approvalMode === mode ? `${T.accent}15` : "transparent",
                  color: approvalMode === mode ? T.accent : T.muted,
                  cursor: isRunning ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: isRunning ? 0.5 : 1,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Task input */}
        {!currentTask && (
          <div style={{ marginBottom: 14 }}>
            <textarea
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="만들고 싶은 앱을 설명해주세요...&#10;예: Todo 앱을 만들어줘"
              style={{
                width: "100%",
                minHeight: 80,
                padding: "10px 12px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                color: T.text,
                fontSize: 12,
                outline: "none",
                fontFamily: "inherit",
                resize: "vertical",
                lineHeight: 1.6,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = T.accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleStart();
                }
              }}
            />
            <button
              onClick={handleStart}
              disabled={!taskInput.trim()}
              style={{
                width: "100%",
                padding: "10px 0",
                marginTop: 8,
                background: taskInput.trim()
                  ? "linear-gradient(135deg, #f97316, #f43f5e)"
                  : T.muted,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: taskInput.trim() ? "pointer" : "default",
                fontFamily: "inherit",
                boxShadow: taskInput.trim() ? "0 4px 16px rgba(249,115,22,0.3)" : "none",
              }}
            >
              ⚡ 자율 실행 시작 (Ctrl+Enter)
            </button>
          </div>
        )}

        {/* Step timeline */}
        {currentTask && currentTask.steps.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 8 }}>
              실행 단계 ({currentTask.steps.filter((s) => s.status === "completed").length}/{currentTask.steps.length})
            </div>
            {currentTask.steps.map((step) => (
              <StepItem
                key={step.id}
                step={step}
                onApprove={() => approveStep(step.id)}
                onReject={() => rejectStep(step.id)}
              />
            ))}
          </div>
        )}

        {/* Decomposing state */}
        {ctx.state === "decomposing" && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>
              태스크 분석 중...
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
              AI가 실행 단계를 계획하고 있습니다
            </div>
          </div>
        )}

        {/* Error display */}
        {ctx.lastError && ctx.state === "failed" && (
          <div
            style={{
              padding: "10px 12px",
              background: `${T.red}10`,
              border: `1px solid ${T.red}30`,
              borderRadius: 8,
              color: T.red,
              fontSize: 11,
              marginBottom: 14,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>오류 발생</div>
            {ctx.lastError}
          </div>
        )}

        {/* Completed */}
        {ctx.state === "completed" && (
          <div
            style={{
              textAlign: "center",
              padding: 20,
              background: `${T.green}08`,
              borderRadius: 12,
              border: `1px solid ${T.green}20`,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 13, color: T.green, fontWeight: 700 }}>
              모든 단계 완료!
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
              {currentTask?.steps.filter((s) => s.status === "completed").length}개 단계가 성공적으로 실행되었습니다
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {currentTask && (
        <div
          style={{
            padding: "8px 12px",
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            gap: 6,
          }}
        >
          {isRunning && (
            <button
              onClick={cancelTask}
              style={{
                flex: 1,
                padding: "7px 0",
                background: `${T.red}15`,
                border: `1px solid ${T.red}30`,
                borderRadius: 6,
                color: T.red,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              취소
            </button>
          )}
          {isDone && (
            <>
              <button
                onClick={rollbackAll}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  background: `${T.warn}15`,
                  border: `1px solid ${T.warn}30`,
                  borderRadius: 6,
                  color: T.warn,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                전체 롤백
              </button>
              <button
                onClick={reset}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  background: `${T.accent}15`,
                  border: `1px solid ${T.accent}30`,
                  borderRadius: 6,
                  color: T.accent,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                새 태스크
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step item sub-component ─────────────────────────────────────────────────

function StepItem({
  step,
  onApprove,
  onReject,
}: {
  step: TaskStep;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(step.status === "running");
  const color = STATUS_COLORS[step.status] ?? T.muted;

  return (
    <div
      style={{
        marginBottom: 6,
        borderRadius: 8,
        border: `1px solid ${step.status === "running" ? `${T.accent}30` : T.border}`,
        background: step.status === "running" ? `${T.accent}05` : "transparent",
        overflow: "hidden",
      }}
    >
      {/* Step header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        {/* Status indicator */}
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
            animation: step.status === "running" ? "pulse 1.5s infinite" : "none",
          }}
        />
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}>
          {step.index + 1}. {step.title}
        </span>
        <span style={{ fontSize: 9, color, fontWeight: 600 }}>
          {STATUS_LABELS[step.status] ?? step.status}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 10px 8px", fontSize: 11 }}>
          <div style={{ color: T.muted, marginBottom: 6, lineHeight: 1.5 }}>
            {step.description}
          </div>
          {step.filesAffected.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {step.filesAffected.map((f) => (
                <span
                  key={f}
                  style={{
                    padding: "1px 6px",
                    background: `${T.info}15`,
                    borderRadius: 4,
                    fontSize: 9,
                    color: T.info,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          )}
          {step.result && (
            <div
              style={{
                padding: "6px 8px",
                background: T.surface,
                borderRadius: 6,
                fontSize: 10,
                color: T.muted,
                maxHeight: 100,
                overflowY: "auto",
                marginBottom: 6,
                lineHeight: 1.5,
              }}
            >
              {step.result.slice(0, 300)}
              {step.result.length > 300 && "..."}
            </div>
          )}
          {step.error && (
            <div style={{ color: T.red, fontSize: 10, marginBottom: 6 }}>
              {step.error}
            </div>
          )}
          {/* Approval buttons */}
          {step.status === "awaiting_approval" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={onApprove}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  background: T.green,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                승인
              </button>
              <button
                onClick={onReject}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  background: T.red,
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                거부
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
