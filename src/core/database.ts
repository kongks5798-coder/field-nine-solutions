export function getDB() {
  return {
    deleteCustomer: async (_id: string) => true,
    createCustomer: async (data: Record<string, unknown>) => ({ id: `c_${Date.now()}`, ...data }),
    listCustomers: async () => [
      { id: "cust1", name: "홍길동", email: "hong@fieldnine.io" },
      { id: "cust2", name: "김민준", email: "kim@fieldnine.io" },
    ],
    createOrder: async (data: Record<string, unknown>) => ({ id: `o_${Date.now()}`, status: "pending", ...data }),
    updateCustomer: async (id: string, data: Record<string, unknown>) => ({ id, ...data }),
    getOrderById: async (id: string) => ({ id, status: "pending", customerId: "cust1", amount: 100000 }),
    updateOrderStatus: async (id: string, status: string) => ({ id, status, customerId: "cust1", amount: 100000 }),
    listOrders: async () => [
      { id: "ord1", status: "pending", customerId: "cust1", amount: 150000 },
      { id: "ord2", status: "paid", customerId: "cust2", amount: 280000 },
    ],
    stats: async () => ({ totalOrders: 2, totalAmount: 430000, cancelled: 0, refunded: 0 }),
  };
}