export type Customer = {
  id: string;
  name: string;
  email: string;
  createdAt: number;
};

export type Order = {
  id: string;
  customerId: string;
  amount: number;
  status: "pending" | "paid" | "cancelled" | "refunded";
  createdAt: number;
};

export type Stats = {
  customers: number;
  orders: number;
  revenue: number;
};

export interface Database {
  listCustomers(): Promise<Customer[]>;
  createCustomer(input: { name: string; email: string }): Promise<Customer>;
  getCustomerById(id: string): Promise<Customer | null>;
  deleteCustomer(id: string): Promise<boolean>;
  updateCustomer(id: string, input: { name?: string; email?: string }): Promise<Customer | null>;

  listOrders(): Promise<Order[]>;
  createOrder(input: { customerId: string; amount: number; status?: Order["status"] }): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: Order["status"]): Promise<Order | null>;

  stats(): Promise<Stats>;
}

class MemoryDB implements Database {
  private customers: Customer[] = [];
  private orders: Order[] = [];

  async listCustomers() {
    return this.customers.slice().sort((a, b) => b.createdAt - a.createdAt);
  }
  async createCustomer(input: { name: string; email: string }) {
    const c: Customer = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email.toLowerCase(),
      createdAt: Date.now(),
    };
    this.customers.push(c);
    return c;
  }
  async getCustomerById(id: string) {
    return this.customers.find((c) => c.id === id) || null;
  }
  async deleteCustomer(id: string) {
    const before = this.customers.length;
    this.customers = this.customers.filter((c) => c.id !== id);
    this.orders = this.orders.filter((o) => o.customerId !== id);
    return this.customers.length < before;
  }
  async updateCustomer(id: string, input: { name?: string; email?: string }) {
    const c = this.customers.find((x) => x.id === id);
    if (!c) return null;
    if (typeof input.name === "string" && input.name.trim()) c.name = input.name.trim();
    if (typeof input.email === "string" && input.email.trim()) c.email = input.email.trim().toLowerCase();
    return c;
  }

  async listOrders() {
    return this.orders.slice().sort((a, b) => b.createdAt - a.createdAt);
  }
  async createOrder(input: { customerId: string; amount: number; status?: Order["status"] }) {
    const status = input.status ?? "pending";
    const o: Order = {
      id: crypto.randomUUID(),
      customerId: input.customerId,
      amount: Math.round(input.amount * 100) / 100,
      status,
      createdAt: Date.now(),
    };
    this.orders.push(o);
    return o;
  }
  async getOrderById(id: string) {
    return this.orders.find((o) => o.id === id) || null;
  }
  async updateOrderStatus(id: string, status: Order["status"]) {
    const o = this.orders.find((x) => x.id === id);
    if (!o) return null;
    o.status = status;
    return o;
  }

  async stats() {
    const revenue = this.orders.reduce((sum, o) => sum + (o.status === "paid" ? o.amount : 0), 0);
    return {
      customers: this.customers.length,
      orders: this.orders.length,
      revenue: Math.round(revenue * 100) / 100,
    };
  }
}

let singleton: Database | null = null;

export function getDB(): Database {
  if (singleton) return singleton;
  const provider = (process.env.DB_PROVIDER || "memory").toLowerCase();
  switch (provider) {
    case "supabase": {
      const SUPABASE_URL = process.env.SUPABASE_URL || "";
      const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
      if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        singleton = new MemoryDB();
        return singleton;
      }
      class SupabaseDB implements Database {
        private readonly base = SUPABASE_URL.replace(/\/+$/, "");
        private readonly key = SUPABASE_SERVICE_KEY;
        private headers() {
          return {
            "Content-Type": "application/json",
            apikey: this.key,
            Authorization: `Bearer ${this.key}`,
            Prefer: "return=representation",
          };
        }
        private async get<T>(path: string) {
          const resp = await fetch(`${this.base}${path}`, { headers: this.headers() });
          if (!resp.ok) throw new Error(`Supabase GET ${path} failed`);
          const data = (await resp.json()) as T;
          return data;
        }
        private async post<T>(path: string, body: unknown) {
          const resp = await fetch(`${this.base}${path}`, {
            method: "POST",
            headers: this.headers(),
            body: JSON.stringify(body),
          });
          if (!resp.ok) throw new Error(`Supabase POST ${path} failed`);
          const data = (await resp.json()) as T;
          return data;
        }
        async listCustomers(): Promise<Customer[]> {
          const data = await this.get<Array<{ id: string; name: string; email: string; created_at: string }>>(
            `/rest/v1/customers?select=*&order=created_at.desc&limit=1000`
          );
          return (data || []).map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            createdAt: Date.parse(c.created_at),
          }));
        }
        async createCustomer(input: { name: string; email: string }): Promise<Customer> {
          const payload = { name: input.name, email: input.email.toLowerCase() };
          const [data] = await this.post<Array<{ id: string; name: string; email: string; created_at: string }>>(
            `/rest/v1/customers`,
            payload
          );
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            createdAt: Date.parse(data.created_at),
          };
        }
        async getCustomerById(id: string): Promise<Customer | null> {
          const data = await this.get<Array<{ id: string; name: string; email: string; created_at: string }>>(
            `/rest/v1/customers?id=eq.${encodeURIComponent(id)}&select=*`
          );
          const c = data?.[0];
          return c ? { id: c.id, name: c.name, email: c.email, createdAt: Date.parse(c.created_at) } : null;
        }
        async deleteCustomer(id: string): Promise<boolean> {
          const resp = await fetch(`${this.base}/rest/v1/customers?id=eq.${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: this.headers(),
          });
          return resp.ok;
        }
        async updateCustomer(id: string, input: { name?: string; email?: string }): Promise<Customer | null> {
          const payload: Record<string, string> = {};
          if (typeof input.name === "string" && input.name.trim()) payload.name = input.name.trim();
          if (typeof input.email === "string" && input.email.trim()) payload.email = input.email.trim().toLowerCase();
          if (Object.keys(payload).length === 0) return this.getCustomerById(id);
          const resp = await fetch(`${this.base}/rest/v1/customers?id=eq.${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: this.headers(),
            body: JSON.stringify(payload),
          });
          if (!resp.ok) return null;
          const [data] = (await resp.json()) as Array<{ id: string; name: string; email: string; created_at: string }>;
          return data ? { id: data.id, name: data.name, email: data.email, createdAt: Date.parse(data.created_at) } : null;
        }
        async listOrders(): Promise<Order[]> {
          const data = await this.get<
            Array<{ id: string; customer_id: string; amount: number; status: Order["status"]; created_at: string }>
          >(`/rest/v1/orders?select=*&order=created_at.desc&limit=1000`);
          return (data || []).map((o) => ({
            id: o.id,
            customerId: o.customer_id,
            amount: Number(o.amount),
            status: o.status,
            createdAt: Date.parse(o.created_at),
          }));
        }
        async createOrder(input: {
          customerId: string;
          amount: number;
          status?: Order["status"];
        }): Promise<Order> {
          const payload = {
            customer_id: input.customerId,
            amount: input.amount,
            status: input.status ?? "pending",
          };
          const [data] = await this.post<
            Array<{ id: string; customer_id: string; amount: number; status: Order["status"]; created_at: string }>
          >(`/rest/v1/orders`, payload);
          return {
            id: data.id,
            customerId: data.customer_id,
            amount: Number(data.amount),
            status: data.status,
            createdAt: Date.parse(data.created_at),
          };
        }
        async getOrderById(id: string): Promise<Order | null> {
          const data = await this.get<
            Array<{ id: string; customer_id: string; amount: number; status: Order["status"]; created_at: string }>
          >(`/rest/v1/orders?id=eq.${encodeURIComponent(id)}&select=*`);
          const o = data?.[0];
          return o
            ? {
                id: o.id,
                customerId: o.customer_id,
                amount: Number(o.amount),
                status: o.status,
                createdAt: Date.parse(o.created_at),
              }
            : null;
        }
        async updateOrderStatus(id: string, status: Order["status"]): Promise<Order | null> {
          const resp = await fetch(`${this.base}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: this.headers(),
            body: JSON.stringify({ status }),
          });
          if (!resp.ok) return null;
          const [data] = (await resp.json()) as Array<{
            id: string;
            customer_id: string;
            amount: number;
            status: Order["status"];
            created_at: string;
          }>;
          return data
            ? {
                id: data.id,
                customerId: data.customer_id,
                amount: Number(data.amount),
                status: data.status,
                createdAt: Date.parse(data.created_at),
              }
            : null;
        }
        async stats(): Promise<Stats> {
          const customers = await this.get<Array<{ id: string }>>(`/rest/v1/customers?select=id&limit=10000`);
          const orders = await this.get<Array<{ amount: number; status: Order["status"] }>>(
            `/rest/v1/orders?select=amount,status&limit=100000`
          );
          const arr = orders || [];
          const revenue = arr.filter((o) => o.status === "paid").reduce((sum, o) => sum + Number(o.amount || 0), 0);
          return {
            customers: (customers || []).length,
            orders: arr.length,
            revenue: Math.round(revenue * 100) / 100,
          };
        }
      }
      singleton = new SupabaseDB();
      return singleton;
    }
    default:
      singleton = new MemoryDB();
      return singleton;
  }
}
