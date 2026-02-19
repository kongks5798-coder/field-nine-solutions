// Dummy database module for build
export function getDB() {
	return {
		deleteCustomer: async (id: string) => true,
		createCustomer: async (data: any) => ({ id: 'dummy', ...data }),
		listCustomers: async () => [],
		createOrder: async (data: any) => ({ id: 'dummy', ...data }),
		updateCustomer: async (id: string, data: any) => ({ id, ...data }),
		getOrderById: async (id: string) => ({ id, status: 'PENDING', customerId: 'dummy', amount: 0 }),
		updateOrderStatus: async (id: string, status: string) => ({ id, status, customerId: 'dummy', amount: 0 }),
		listOrders: async () => [
		  { id: 'dummy1', status: 'PENDING', customerId: 'dummy', amount: 100 },
		  { id: 'dummy2', status: 'OPEN', customerId: 'dummy', amount: 200 }
		],
		stats: async () => ({ totalOrders: 2, totalAmount: 300, cancelled: 0, refunded: 0 }),
	};
}