import { getDB, type Order } from "@/core/database";

export type OrderStatus = Order["status"];

const statuses: OrderStatus[] = ["pending", "paid", "preparing", "risk_review", "cancelled", "refunded"];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && statuses.includes(value as OrderStatus);
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  if (from === to) return true;
  if (from === "pending") return to === "paid" || to === "cancelled";
  if (from === "paid") return to === "preparing" || to === "risk_review" || to === "refunded";
  if (from === "preparing") return to === "refunded" || to === "preparing";
  if (from === "risk_review") return to === "preparing" || to === "refunded" || to === "risk_review";
  if (from === "cancelled") return to === "cancelled";
  if (from === "refunded") return to === "refunded";
  return false;
}

export function resolveOrderCommand(command: string, current: OrderStatus): OrderStatus | null {
  const text = command.trim();
  if (!text) return null;
  if (text.includes("주문 처리") || text.includes("배송 준비")) {
    if (current === "paid" || current === "risk_review") return "preparing";
    return null;
  }
  if (text.includes("결제 완료")) {
    return current === "pending" ? "paid" : null;
  }
  if (text.includes("취소")) {
    return current === "pending" ? "cancelled" : null;
  }
  if (text.includes("환불")) {
    return current === "paid" || current === "preparing" || current === "risk_review" ? "refunded" : null;
  }
  if (text.includes("리스크") || text.includes("검토")) {
    return current === "paid" ? "risk_review" : null;
  }
  return null;
}

function normalizeEmail(value: string, fallbackId: number) {
  const email = value.trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return email.toLowerCase();
  return `imported-${fallbackId}@fieldnine.io`;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

function coerceRows(input: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(input)) {
    return input.filter((x) => x && typeof x === "object") as Array<Record<string, unknown>>;
  }
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj.rows)) {
      return obj.rows.filter((x) => x && typeof x === "object") as Array<Record<string, unknown>>;
    }
  }
  return [];
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((x) => x.trim().length > 0);
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const rows: Array<Record<string, unknown>> = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const row: Record<string, unknown> = {};
    for (let c = 0; c < header.length; c += 1) {
      row[header[c]] = cols[c] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

function mapRowToOrder(row: Record<string, unknown>, index: number) {
  const name =
    (row.customer_name as string) ||
    (row.customername as string) ||
    (row.name as string) ||
    `고객 ${index + 1}`;
  const rawEmail =
    (row.customer_email as string) || (row.customeremail as string) || (row.email as string) || "";
  const amount =
    toNumber(row.amount) ??
    toNumber(row.total_amount) ??
    toNumber(row.revenue) ??
    toNumber(row.sales) ??
    null;
  const status = isOrderStatus(row.status) ? row.status : "paid";
  if (typeof name !== "string" || !name.trim() || amount === null || amount <= 0) return null;
  return {
    name: name.trim(),
    email: normalizeEmail(String(rawEmail || ""), index + 1),
    amount,
    status,
  };
}

export async function importOrdersFromText(text: string) {
  let rows: Array<Record<string, unknown>> = [];
  const trimmed = text.trim();
  if (!trimmed) return { created: [] as Order[], rejected: 0 };
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      rows = coerceRows(JSON.parse(trimmed));
    } catch {
      rows = [];
    }
  }
  if (rows.length === 0) {
    rows = parseCsv(text);
  }
  const db = getDB();
  const created: Order[] = [];
  let rejected = 0;
  for (let i = 0; i < rows.length; i += 1) {
    const mapped = mapRowToOrder(rows[i], i);
    if (!mapped) {
      rejected += 1;
      continue;
    }
    const customer = await db.createCustomer({ name: mapped.name, email: mapped.email });
    const order = await db.createOrder({ customerId: customer.id, amount: mapped.amount, status: mapped.status });
    created.push(order);
  }
  return { created, rejected };
}

export async function generateOrdersFromMarket(count = 10, avgAmount = 180) {
  const db = getDB();
  const created: Order[] = [];
  for (let i = 0; i < count; i += 1) {
    const variance = (Math.random() - 0.5) * avgAmount;
    const amount = Math.max(20, Math.round((avgAmount + variance) * 100) / 100);
    const customer = await db.createCustomer({
      name: `AI 고객 ${Date.now().toString().slice(-4)}-${i + 1}`,
      email: `ai-${Date.now()}-${i + 1}@fieldnine.io`,
    });
    const order = await db.createOrder({ customerId: customer.id, amount, status: "paid" });
    created.push(order);
  }
  return created;
}

function decideProcessingStatus(order: Order) {
  if (order.amount >= 800) return "risk_review" as const;
  if (order.amount >= 400 && Math.random() < 0.25) return "risk_review" as const;
  return "preparing" as const;
}

export async function autoProcessOrders(orders: Order[]) {
  const db = getDB();
  const updated: Order[] = [];
  for (const order of orders) {
    if (order.status !== "paid") continue;
    const next = decideProcessingStatus(order);
    const result = await db.updateOrderStatus(order.id, next);
    if (result) updated.push(result);
  }
  return { processed: updated.length, updated };
}

export async function autoProcessPaidOrders() {
  const db = getDB();
  const orders = await db.listOrders();
  const paid = orders.filter((o) => o.status === "paid");
  return autoProcessOrders(paid);
}

export async function listOrders() {
  const db = getDB();
  return db.listOrders();
}

export async function getOrder(id: string) {
  const db = getDB();
  return db.getOrderById(id);
}

export async function createOrder(input: { customerId: string; amount: number; status?: OrderStatus }) {
  const db = getDB();
  return db.createOrder(input);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const db = getDB();
  return db.updateOrderStatus(id, status);
}

export async function simulateOrderFlow(count = 10) {
  const db = getDB();
  const customer = await db.createCustomer({
    name: "AI Simulator",
    email: `ai-sim-${Date.now()}@fieldnine.io`,
  });
  const created: Order[] = [];
  const updated: Order[] = [];
  const transitions: Array<{ id: string; from: OrderStatus; to: OrderStatus }> = [];
  for (let i = 0; i < count; i += 1) {
    const amount = Math.round((Math.random() * 900 + 100) * 100) / 100;
    const order = await db.createOrder({ customerId: customer.id, amount, status: "paid" });
    created.push(order);
  }
  for (const order of created) {
    const next = await db.updateOrderStatus(order.id, "preparing");
    if (next) {
      updated.push(next);
      transitions.push({ id: order.id, from: order.status, to: "preparing" });
    }
  }
  return { customer, created, updated, transitions };
}
