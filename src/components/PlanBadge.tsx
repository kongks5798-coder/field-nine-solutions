"use client";

type Plan = "starter" | "pro" | "team";

interface PlanBadgeProps {
  plan: Plan | string;
  size?: "sm" | "md" | "lg";
}

const PLAN_CONFIG: Record<Plan, { label: string; color: string; bg: string; border: string }> = {
  starter: {
    label: "FREE",
    color: "#9ca3af",
    bg:    "rgba(107,114,128,0.12)",
    border:"rgba(107,114,128,0.25)",
  },
  pro: {
    label: "PRO",
    color: "#f97316",
    bg:    "rgba(249,115,22,0.12)",
    border:"rgba(249,115,22,0.30)",
  },
  team: {
    label: "TEAM",
    color: "#818cf8",
    bg:    "rgba(129,140,248,0.12)",
    border:"rgba(129,140,248,0.30)",
  },
};

const SIZE_STYLES = {
  sm: { fontSize: 9,  padding: "2px 6px",  borderRadius: 6 },
  md: { fontSize: 11, padding: "3px 9px",  borderRadius: 8 },
  lg: { fontSize: 13, padding: "4px 12px", borderRadius: 10 },
};

/**
 * PlanBadge — shows a plan pill (FREE / PRO / TEAM).
 * Falls back to a neutral grey badge for unknown plan strings.
 */
export default function PlanBadge({ plan, size = "md" }: PlanBadgeProps) {
  const cfg = PLAN_CONFIG[plan as Plan] ?? {
    label: plan.toUpperCase(),
    color: "#9ca3af",
    bg:    "rgba(107,114,128,0.12)",
    border:"rgba(107,114,128,0.25)",
  };
  const sz = SIZE_STYLES[size];

  return (
    <span
      aria-label={`플랜: ${cfg.label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        ...sz,
        userSelect: "none",
      }}
    >
      {cfg.label}
    </span>
  );
}
