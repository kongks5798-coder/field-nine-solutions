import { getDB, type Order, type Customer } from "./database";

export type ProactiveSignal = {
  type: string;
  severity: "info" | "warn" | "critical";
  message: string;
  value?: number;
};

export type ProactiveReport = {
  signals: ProactiveSignal[];
  forecast: { nextRevenue: number; confidence: number };
  snapshot: { customers: number; orders: number; revenue: number };
};

function sumPaid(orders: Order[]) {
  return orders.filter((o) => o.status === "paid").reduce((s, o) => s + Number(o.amount || 0), 0);
}

function sliceByDays<T extends { createdAt: number }>(arr: T[], days: number) {
  const now = Date.now();
  const ms = days * 24 * 60 * 60 * 1000;
  return arr.filter((x) => now - x.createdAt <= ms);
}

function pctChange(prev: number, curr: number) {
  if (prev === 0) return curr === 0 ? 0 : 1;
  return (curr - prev) / prev;
}

function severityFromChange(change: number) {
  if (change <= -0.4) return "critical" as const;
  if (change <= -0.2) return "warn" as const;
  if (change >= 0.4) return "info" as const;
  if (change >= 0.2) return "info" as const;
  return "info" as const;
}

function churnRisk(customers: Customer[]) {
  const recent = sliceByDays(customers, 14).length;
  if (recent === 0) return { risk: 0.7, msg: "최근 14일 신규 고객 없음" };
  if (recent <= 2) return { risk: 0.4, msg: "최근 14일 신규 고객 저조" };
  return { risk: 0.1, msg: "신규 고객 유입 정상" };
}

export async function runProactive(): Promise<ProactiveReport> {
  const db = getDB();
  const [orders, customers, stats] = await Promise.all([db.listOrders(), db.listCustomers(), db.stats()]);
  const last7 = sliceByDays(orders, 7);
  const prev7 = orders
    .filter((o) => {
      const d = Date.now() - o.createdAt;
      return d > 7 * 24 * 60 * 60 * 1000 && d <= 14 * 24 * 60 * 60 * 1000;
    })
    .map((x) => x);
  const rLast = sumPaid(last7);
  const rPrev = sumPaid(prev7);
  const change = pctChange(rPrev, rLast);
  const refundRate =
    orders.length === 0 ? 0 : orders.filter((o) => o.status === "refunded").length / orders.length;
  const cancelledRate =
    orders.length === 0 ? 0 : orders.filter((o) => o.status === "cancelled").length / orders.length;
  const churn = churnRisk(customers);
  const signals: ProactiveSignal[] = [];
  signals.push({
    type: "revenue_change_7d",
    severity: severityFromChange(change),
    message:
      change >= 0
        ? `최근 7일 매출 증가율 ${(change * 100).toFixed(1)}%`
        : `최근 7일 매출 감소율 ${(Math.abs(change) * 100).toFixed(1)}%`,
    value: change,
  });
  if (refundRate >= 0.2) {
    signals.push({
      type: "refund_rate_high",
      severity: "warn",
      message: `환불 비율 ${(refundRate * 100).toFixed(1)}%`,
      value: refundRate,
    });
  }
  if (cancelledRate >= 0.2) {
    signals.push({
      type: "cancel_rate_high",
      severity: "warn",
      message: `취소 비율 ${(cancelledRate * 100).toFixed(1)}%`,
      value: cancelledRate,
    });
  }
  signals.push({
    type: "churn_risk",
    severity: churn.risk >= 0.5 ? "warn" : "info",
    message: churn.msg,
    value: churn.risk,
  });
  const growthAdj = Math.max(-0.5, Math.min(0.5, change));
  const nextRevenue = Math.max(0, Math.round((rLast * (1 + growthAdj * 0.5)) * 100) / 100);
  const confidence = Math.max(0.3, Math.min(0.9, 0.7 - refundRate * 0.5));
  return {
    signals,
    forecast: { nextRevenue, confidence },
    snapshot: stats,
  };
}
