// Dummy orders module for build
// Accepts a status string and checks if it is a valid order status
export function isOrderStatus(status: any): boolean {
	const validStatuses = [
		'PENDING', 'OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED', 'REJECTED',
		'pending', 'open', 'partially_filled', 'filled', 'cancelled', 'expired', 'rejected',
		'paid', 'preparing', 'risk_review', 'refunded',
	];
	return typeof status === 'string' && validStatuses.includes(status);
}
// Accepts current and next status, returns true (dummy)
export function canTransition(currentStatus: any, nextStatus: any) { return true; }
// Accepts an order data argument, returns dummy order
export async function createOrder(data: any) {
	return { id: 'created', ...data };
}
export async function listOrders() { return []; }
// Accepts an id argument, returns dummy order
export function getOrder(id?: string) {
	return { id: id || 'dummy', status: 'PENDING', customerId: 'dummy', amount: 0 };
}
// Accepts command and current status, returns a dummy next status
export function resolveOrderCommand(command: string, status: string): string {
	return 'OPEN';
}
// Accepts id and status, returns dummy updated order
export async function updateOrderStatus(id: string, status: string) {
	return { id, status, customerId: 'dummy', amount: 0 };
}
// Accepts a count argument, returns dummy array
export function simulateOrderFlow(count: number) {
	return Array.from({ length: count }, (_, i) => ({ id: `sim${i+1}`, status: 'SIMULATED' }));
}
// Returns dummy processed result
export async function autoProcessPaidOrders() {
	return { processed: 0 };
}
// Accepts an array of orders, returns dummy processed result
export async function autoProcessOrders(orders: any[]) {
	return { processed: orders.length, updated: orders.map(o => ({ ...o, status: 'PROCESSED' })) };
}
// Accepts a text argument, returns dummy import result
export async function importOrdersFromText(text: string) {
	return {
		created: [{ id: 'imported1', status: 'IMPORTED', text }],
		rejected: []
	};
}
// Accepts count and avgAmount, returns dummy orders array
export function generateOrdersFromMarket(count: number, avgAmount: number) {
	return Array.from({ length: count }, (_, i) => ({ id: `gen${i+1}`, amount: avgAmount, status: 'GENERATED' }));
}

